import {Prisma} from '@prisma/client';
import {prisma} from './db';
import {publicUsername} from './public-user';
import {currentSessionCover} from './session-media';

export const sessionInclude={
  game:{select:{id:true,title:true,slug:true}},
  host:{select:{id:true,username:true}},
  participants:{where:{status:'JOINED' as const},orderBy:{joinedAt:'asc' as const},select:{userId:true,joinedAt:true,user:{select:{id:true,username:true}}}}
} satisfies Prisma.GameSessionInclude;
export type SessionWithRelations=Prisma.GameSessionGetPayload<{include:typeof sessionInclude}>;
export function publicSessionWhere(now=new Date()){return{visibility:'PUBLIC' as const,startsAtUtc:{gte:now},status:{not:'COMPLETED' as const}}}

export function serializeSession(session:SessionWithRelations,currentUserId?:string|null){
  const participantIds=session.participants.map(item=>item.userId),isOwner=currentUserId===session.hostId,isCurrentUserParticipant=Boolean(currentUserId&&participantIds.includes(currentUserId)),coverPath=currentSessionCover(session.game);
  return{id:session.id,gameId:session.gameId,creatorId:session.hostId,status:session.status,visibility:session.visibility,startsAt:session.startsAtUtc.toISOString(),createdAt:session.createdAt.toISOString(),durationMinutes:session.durationMinutes,timezone:session.timezoneAtCreation,locationType:session.locationType,message:session.message,minPlayers:session.minPlayers,maxPlayers:session.maxPlayers,maxParticipants:session.maxPlayers,participantCount:session.participants.length,isOwner,isCurrentUserParticipant,canAccessChat:isOwner||isCurrentUserParticipant,chatReadOnly:session.status==='CANCELLED'||session.status==='COMPLETED',canJoin:Boolean(currentUserId&&!isOwner&&!isCurrentUserParticipant&&session.status==='OPEN'&&session.startsAtUtc>new Date()&&session.participants.length<session.maxPlayers),game:{...session.game,coverPath},creator:{id:session.host.id,username:publicUsername(session.host.username,session.host.id)},participants:session.participants.map(item=>({userId:item.userId,username:publicUsername(item.user.username,item.user.id),joinedAt:item.joinedAt.toISOString(),isOrganizer:item.userId===session.hostId}))};
}
export type SerializedSession=ReturnType<typeof serializeSession>;
export async function sessionById(id:string,currentUserId?:string|null){const row=await prisma.gameSession.findUnique({where:{id},include:sessionInclude});return row?serializeSession(row,currentUserId):null}
export async function listPublicSessions(currentUserId?:string|null){const rows=await prisma.gameSession.findMany({where:publicSessionWhere(),include:sessionInclude,orderBy:{startsAtUtc:'asc'}});return rows.map(row=>serializeSession(row,currentUserId))}
export async function listMySessions(userId:string){const rows=await prisma.gameSession.findMany({where:{OR:[{hostId:userId},{participants:{some:{userId,status:'JOINED'}}}]},include:sessionInclude,orderBy:{startsAtUtc:'desc'}});return rows.map(row=>serializeSession(row,userId))}
