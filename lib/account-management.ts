import {randomUUID} from 'node:crypto';
import argon2 from 'argon2';
import {Prisma} from '@prisma/client';
import {prisma} from './db';
import {validatePassword,validateUsername} from './account-validation';
import {digest,normalizeIdentity,secret} from './registration-security';
import {publicUsername} from './public-user';

export class AccountError extends Error{constructor(public status:number,message:string,public code:string){super(message)}}
const fail=(status:number,message:string,code:string):never=>{throw new AccountError(status,message,code)};

export async function updateAccountUsername(userId:string,input:unknown){
  const validated=validateUsername(input);if(!validated.ok)throw new AccountError(400,validated.error,validated.code);
  const value=validated.value,normalized=validated.normalized;
  try{const user=await prisma.$transaction(async tx=>{const updated=await tx.user.update({where:{id:userId,status:'ACTIVE'},data:{username:value,usernameNormalized:normalized},select:{id:true,username:true}});await tx.auditLog.create({data:{actorId:userId,action:'USERNAME_CHANGED',entityType:'User',entityId:userId,metadata:{}}});return updated});return{id:user.id,username:publicUsername(user.username,user.id)}}catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002')fail(409,'Ce pseudo est déjà utilisé.','USERNAME_TAKEN');throw error}
}

export async function changeAccountPassword(userId:string,input:{currentPassword?:unknown;newPassword?:unknown;confirmation?:unknown}){
  const currentPassword=input.currentPassword;if(typeof currentPassword!=='string')throw new AccountError(400,'Le mot de passe actuel est incorrect.','CURRENT_PASSWORD_INVALID');
  if(input.newPassword!==input.confirmation)fail(400,'La confirmation du nouveau mot de passe ne correspond pas.','PASSWORD_CONFIRMATION_MISMATCH');
  const validated=validatePassword(input.newPassword);if(!validated.ok)throw new AccountError(400,validated.error,validated.code);const newPassword=validated.value;
  const user=await prisma.user.findFirst({where:{id:userId,status:'ACTIVE'},select:{passwordHash:true,authVersion:true}});if(!user)throw new AccountError(401,'Le mot de passe actuel est incorrect.','CURRENT_PASSWORD_INVALID');const currentValid=await argon2.verify(user.passwordHash,currentPassword);if(!currentValid)fail(401,'Le mot de passe actuel est incorrect.','CURRENT_PASSWORD_INVALID');
  if(await argon2.verify(user.passwordHash,newPassword))fail(400,'Le nouveau mot de passe doit être différent de l’ancien.','PASSWORD_UNCHANGED');
  const passwordHash=await argon2.hash(newPassword,{type:argon2.argon2id});
  const updated=await prisma.$transaction(async tx=>{const row=await tx.user.update({where:{id:userId},data:{passwordHash,authVersion:{increment:1}},select:{authVersion:true}});await tx.auditLog.create({data:{actorId:userId,action:'PASSWORD_CHANGED',entityType:'User',entityId:userId,metadata:{sessionsRevoked:true}}});return row});
  return updated.authVersion;
}

export async function deleteAccount(userId:string,input:{currentPassword?:unknown;confirmation?:unknown}){
  if(input.confirmation!=='SUPPRIMER')fail(400,'Saisissez exactement SUPPRIMER pour confirmer.','DELETION_CONFIRMATION_INVALID');
  const currentPassword=input.currentPassword;if(typeof currentPassword!=='string')throw new AccountError(401,'Le mot de passe actuel est incorrect.','CURRENT_PASSWORD_INVALID');
  const user=await prisma.user.findFirst({where:{id:userId,status:'ACTIVE'},select:{id:true,email:true,passwordHash:true,authVersion:true}});if(!user)throw new AccountError(401,'Le mot de passe actuel est incorrect.','CURRENT_PASSWORD_INVALID');const currentValid=await argon2.verify(user.passwordHash,currentPassword);if(!currentValid)fail(401,'Le mot de passe actuel est incorrect.','CURRENT_PASSWORD_INVALID');
  const email=user.email,now=new Date(),deletionVersion=user.authVersion+1;
  await prisma.$transaction(async tx=>{
    const hosted=await tx.gameSession.findMany({where:{hostId:userId,startsAtUtc:{gt:now},status:{notIn:['CANCELLED','COMPLETED']}},select:{id:true,game:{select:{title:true}},participants:{where:{status:'JOINED',userId:{not:userId}},select:{userId:true}}}});
    const notifications=hosted.flatMap(session=>session.participants.map(participant=>({recipientId:participant.userId,sessionId:session.id,type:'SESSION_CANCELLED_ACCOUNT_DELETED',title:'Une session a été annulée',body:`La session ${session.game.title} a été annulée par son organisateur.`})));
    if(notifications.length)await tx.notification.createMany({data:notifications});
    await tx.gameSession.updateMany({where:{id:{in:hosted.map(session=>session.id)}},data:{status:'CANCELLED'}});
    await tx.sessionParticipant.updateMany({where:{userId,status:'JOINED'},data:{status:'LEFT',version:{increment:1}}});
    await tx.notification.deleteMany({where:{recipientId:userId}});
    await tx.legalRequest.deleteMany({where:{OR:[{userId},{requesterEmail:email}]}});
    await tx.registrationAttempt.deleteMany({where:{emailNormalized:normalizeIdentity(email)}});
    await tx.auditLog.create({data:{actorId:userId,action:'ACCOUNT_DELETED',entityType:'User',entityId:userId,metadata:{activeDataAnonymized:true,sessionsRevoked:true}}});
    await tx.user.update({where:{id:userId},data:{email:`deleted-${userId}@invalid.local`,username:`__deleted__${userId}`,usernameNormalized:`__deleted__${userId}`,passwordHash:digest(`${randomUUID()}:${secret()}`),status:'DELETED',authVersion:deletionVersion,joinEmailEnabled:false,leaveEmailEnabled:false,chatMutedUntil:null,city:null,deletedAt:now}});
  });
  return{email,deletionVersion};
}

export function accountError(error:unknown){if(error instanceof AccountError)return Response.json({error:error.message,code:error.code},{status:error.status});console.error('Account operation failed.',{errorCode:error instanceof Prisma.PrismaClientKnownRequestError?error.code:'INTERNAL'});return Response.json({error:'Impossible de traiter cette opération.'},{status:500})}
