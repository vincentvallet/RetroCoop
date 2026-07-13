import {prisma} from '@/lib/db';

export const sessionInclude={game:{select:{id:true,title:true,slug:true,coverUrl:true}},host:{select:{id:true,username:true,email:true}},participants:{where:{status:'JOINED' as const},select:{userId:true}}};

export function publicSessionWhere(now=new Date()){return{status:'OPEN' as const,startsAtUtc:{gte:now}}}

export function serializeSession(session:{id:string;gameId:string;hostId:string;startsAtUtc:Date;durationMinutes:number;timezoneAtCreation:string;locationType:string;minPlayers:number;maxPlayers:number;status:string;createdAt:Date;game:{id:string;title:string;slug:string;coverUrl:string|null};host:{id:string;username:string;email:string};participants:Array<{userId:string}>}){
  return{id:session.id,gameId:session.gameId,creatorId:session.hostId,status:session.status,visibility:'PUBLIC' as const,startsAt:session.startsAtUtc.toISOString(),createdAt:session.createdAt.toISOString(),durationMinutes:session.durationMinutes,timezone:session.timezoneAtCreation,locationType:session.locationType,minPlayers:session.minPlayers,maxPlayers:session.maxPlayers,participantCount:session.participants.length,game:session.game,creator:{id:session.host.id,username:session.host.username,email:session.host.email}};
}

export async function listPublicSessions(){const rows=await prisma.gameSession.findMany({where:publicSessionWhere(),include:sessionInclude,orderBy:{startsAtUtc:'asc'}});return rows.map(serializeSession)}
