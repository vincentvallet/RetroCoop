import {Prisma} from '@prisma/client';
import {prisma} from '@/lib/db';
import {serializeSession,sessionInclude} from '@/lib/sessions';
import {capacityStatus,joinRejection} from '@/lib/session-rules';

export class SessionActionError extends Error{constructor(public status:number,message:string,public code:string){super(message)}}
function fail(status:number,message:string,code:string):never{throw new SessionActionError(status,message,code)}
const retries=3;

async function serializable<T>(operation:(tx:Prisma.TransactionClient)=>Promise<T>){
  for(let attempt=0;;attempt++)try{return await prisma.$transaction(operation,{isolationLevel:Prisma.TransactionIsolationLevel.Serializable})}catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2034'&&attempt<retries)continue;throw error}
}

export async function joinSession(sessionId:string,userId:string){
  return serializable(async tx=>{
    const session=await tx.gameSession.findUnique({where:{id:sessionId},include:{participants:{where:{status:'JOINED'},select:{userId:true}}}});if(!session)fail(404,'Session introuvable.','NOT_FOUND');
    const rejection=joinRejection({...session,participantIds:session.participants.map(item=>item.userId)},userId);if(rejection)fail(rejection.status,rejection.message,rejection.code);
    await tx.sessionParticipant.upsert({where:{sessionId_userId:{sessionId,userId}},create:{sessionId,userId,status:'JOINED'},update:{status:'JOINED',joinedAt:new Date()}});
    if(session.participants.length+1>=session.maxPlayers)await tx.gameSession.update({where:{id:sessionId},data:{status:'FULL'}});
    return tx.gameSession.findUniqueOrThrow({where:{id:sessionId},include:sessionInclude});
  }).then(row=>serializeSession(row,userId));
}

export async function leaveSession(sessionId:string,userId:string){
  return serializable(async tx=>{
    const session=await tx.gameSession.findUnique({where:{id:sessionId},include:{participants:{where:{status:'JOINED'},select:{userId:true}}}});if(!session)fail(404,'Session introuvable.','NOT_FOUND');if(session.hostId===userId)fail(409,'L’organisateur doit annuler ou supprimer sa session.','OWNER_CANNOT_LEAVE');
    if(!session.participants.some(item=>item.userId===userId))fail(409,'Vous ne participez pas à cette session.','NOT_JOINED');
    await tx.sessionParticipant.update({where:{sessionId_userId:{sessionId,userId}},data:{status:'LEFT'}});if(session.status==='FULL'&&session.startsAtUtc>new Date())await tx.gameSession.update({where:{id:sessionId},data:{status:'OPEN'}});
    return tx.gameSession.findUniqueOrThrow({where:{id:sessionId},include:sessionInclude});
  }).then(row=>serializeSession(row,userId));
}

export type SessionUpdate={action?:'close'|'reopen'|'cancel';startsAtUtc?:string;durationMinutes?:number;maximumPlayers?:number;message?:string|null};
export async function updateSession(sessionId:string,userId:string,input:SessionUpdate){
  return serializable(async tx=>{
    const session=await tx.gameSession.findUnique({where:{id:sessionId},include:{participants:{where:{status:'JOINED'},select:{userId:true}}}});if(!session)fail(404,'Session introuvable.','NOT_FOUND');if(session.hostId!==userId)fail(403,'Vous n’êtes pas autorisé à modifier cette session.','FORBIDDEN');
    const data:Prisma.GameSessionUpdateInput={};
    if(input.action==='close'){if(session.status!=='OPEN'&&session.status!=='FULL')fail(409,'Cette session ne peut pas être fermée.','INVALID_STATUS');data.status='CLOSED'}
    if(input.action==='reopen'){if(session.status!=='CLOSED')fail(409,'Cette session ne peut pas être rouverte.','INVALID_STATUS');if(session.startsAtUtc<=new Date())fail(409,'Cette session a déjà commencé.','SESSION_PAST');data.status=session.participants.length>=session.maxPlayers?'FULL':'OPEN'}
    if(input.action==='cancel'){if(session.status==='CANCELLED'||session.status==='COMPLETED')fail(409,'Cette session ne peut pas être annulée.','INVALID_STATUS');data.status='CANCELLED'}
    if(input.startsAtUtc!==undefined){const date=new Date(input.startsAtUtc);if(Number.isNaN(date.getTime())||date<=new Date())fail(400,'La nouvelle date doit être dans le futur.','INVALID_DATE');data.startsAtUtc=date}
    if(input.durationMinutes!==undefined){const duration=Number(input.durationMinutes);if(!Number.isInteger(duration)||duration<30||duration>720)fail(400,'La durée est invalide.','INVALID_DURATION');data.durationMinutes=duration}
    if(input.maximumPlayers!==undefined){const maximum=Number(input.maximumPlayers);if(!Number.isInteger(maximum)||maximum<2||maximum>16)fail(400,'La capacité est invalide.','INVALID_CAPACITY');if(maximum<session.participants.length)fail(409,'La capacité ne peut pas être inférieure au nombre actuel de participants.','CAPACITY_TOO_LOW');data.maxPlayers=maximum;data.status=capacityStatus(session.status,session.participants.length,maximum) as 'OPEN'|'FULL'|'CLOSED'|'CANCELLED'|'COMPLETED'}
    if(input.message!==undefined){const message=input.message?.trim()||null;if(message&&message.length>500)fail(400,'Le message ne peut pas dépasser 500 caractères.','MESSAGE_TOO_LONG');data.message=message}
    await tx.gameSession.update({where:{id:sessionId},data});return tx.gameSession.findUniqueOrThrow({where:{id:sessionId},include:sessionInclude});
  }).then(row=>serializeSession(row,userId));
}

export async function deleteSession(sessionId:string,userId:string){const session=await prisma.gameSession.findUnique({where:{id:sessionId},select:{hostId:true}});if(!session)fail(404,'Session introuvable.','NOT_FOUND');if(session.hostId!==userId)fail(403,'Vous n’êtes pas autorisé à supprimer cette session.','FORBIDDEN');await prisma.gameSession.delete({where:{id:sessionId}})}

export async function removeParticipant(sessionId:string,targetUserId:string,ownerId:string){
  return serializable(async tx=>{const session=await tx.gameSession.findUnique({where:{id:sessionId},include:{participants:{where:{status:'JOINED'},select:{userId:true}}}});if(!session)fail(404,'Session introuvable.','NOT_FOUND');if(session.hostId!==ownerId)fail(403,'Vous n’êtes pas autorisé à modifier cette session.','FORBIDDEN');if(targetUserId===session.hostId)fail(409,'L’organisateur ne peut pas être retiré.','OWNER_CANNOT_BE_REMOVED');if(!session.participants.some(item=>item.userId===targetUserId))fail(404,'Participant introuvable.','PARTICIPANT_NOT_FOUND');await tx.sessionParticipant.update({where:{sessionId_userId:{sessionId,userId:targetUserId}},data:{status:'REMOVED'}});if(session.status==='FULL'&&session.startsAtUtc>new Date())await tx.gameSession.update({where:{id:sessionId},data:{status:'OPEN'}});return tx.gameSession.findUniqueOrThrow({where:{id:sessionId},include:sessionInclude})}).then(row=>serializeSession(row,ownerId));
}

export function actionError(error:unknown){if(error instanceof SessionActionError)return Response.json({success:false,error:error.message,code:error.code},{status:error.status});if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002')return Response.json({success:false,error:'Vous participez déjà à cette session.',code:'ALREADY_JOINED'},{status:409});console.error('Session action failed',error);return Response.json({success:false,error:'Impossible de modifier la session. Réessayez.',code:'INTERNAL_ERROR'},{status:500})}
