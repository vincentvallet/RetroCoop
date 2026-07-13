import {Prisma} from '@prisma/client';
import {prisma} from './db';
import {digest} from './registration-security';
import {publicUsername} from './public-user';

export const CHAT_MAX_LENGTH=500,CHAT_INITIAL_LIMIT=50;
export class ChatError extends Error{constructor(public status:number,message:string,public code:string){super(message)}}
export const chatError=(error:unknown)=>error instanceof ChatError?Response.json({error:error.message,code:error.code},{status:error.status}):Response.json({error:'Impossible de traiter le chat.'},{status:500});
export function requestIpHash(request:Request){const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||request.headers.get('x-real-ip')||'unknown';return digest(`${process.env.AUTH_SECRET??'retrocoop'}:${ip}`)}
export function validateChatContent(value:unknown){
  if(typeof value!=='string')throw new ChatError(400,'Le message est invalide.','INVALID_MESSAGE');
  const content=value.normalize('NFKC').trim();
  if(!content)throw new ChatError(400,'Le message ne peut pas être vide.','EMPTY_MESSAGE');
  if(content.length>CHAT_MAX_LENGTH)throw new ChatError(400,`Le message ne peut pas dépasser ${CHAT_MAX_LENGTH} caractères.`,'MESSAGE_TOO_LONG');
  if(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(content)||/<\/?[a-z][^>]*>/i.test(content)||/<script/i.test(content))throw new ChatError(400,'Seul le texte brut est autorisé.','PLAIN_TEXT_ONLY');
  if(/(.)\1{19,}/u.test(content)||/(\b\w+\b)(?:\s+\1){9,}/iu.test(content))throw new ChatError(400,'Le message paraît anormalement répétitif.','REPETITIVE_CONTENT');
  const urls=content.match(/(?:https?:\/\/|www\.)\S+/gi)??[];
  if(urls.length>2)throw new ChatError(400,'Un message ne peut pas contenir plus de deux liens.','TOO_MANY_LINKS');
  const suspicious=urls.some(url=>/(?:bit\.ly|tinyurl\.com|t\.co|cutt\.ly|is\.gd)/i.test(url));
  return{content,contentHash:digest(content.toLocaleLowerCase('fr')),suspicious};
}
export async function chatAccess(sessionId:string,userId:string){
  const session=await prisma.gameSession.findUnique({where:{id:sessionId},select:{id:true,hostId:true,status:true,participants:{where:{userId,status:'JOINED'},select:{userId:true}}}});
  if(!session)throw new ChatError(404,'Session introuvable.','NOT_FOUND');
  if(session.hostId!==userId&&!session.participants.length)throw new ChatError(403,'Le chat est réservé aux participants actifs.','CHAT_FORBIDDEN');
  return{session,readOnly:session.status==='CANCELLED'||session.status==='COMPLETED'};
}
const messageInclude={author:{select:{id:true,username:true,email:true}}} satisfies Prisma.SessionMessageInclude;
type MessageRow=Prisma.SessionMessageGetPayload<{include:typeof messageInclude}>;
export function serializeChatMessage(message:MessageRow,currentUserId:string){return{id:message.id,content:message.deletedAt?'Message supprimé par la modération':message.content,createdAt:message.createdAt.toISOString(),deleted:Boolean(message.deletedAt),author:{id:message.author.id,username:publicUsername(message.author.username,message.author.email)},isOwnMessage:message.authorId===currentUserId,suspicious:message.suspicious}}
export async function listChatMessages(sessionId:string,userId:string,before?:Date){await chatAccess(sessionId,userId);const rows=await prisma.sessionMessage.findMany({where:{sessionId,...(before?{createdAt:{lt:before}}:{})},include:messageInclude,orderBy:{createdAt:'desc'},take:CHAT_INITIAL_LIMIT+1});const hasMore=rows.length>CHAT_INITIAL_LIMIT,messages=rows.slice(0,CHAT_INITIAL_LIMIT).reverse().map(row=>serializeChatMessage(row,userId));return{messages,hasMore,nextCursor:hasMore?rows[CHAT_INITIAL_LIMIT-1]?.createdAt.toISOString():null}}

export async function sendChatMessage(sessionId:string,userId:string,input:{content?:unknown;clientRequestId?:unknown},ipHash:string){
  const access=await chatAccess(sessionId,userId);if(access.readOnly)throw new ChatError(409,'Cette session est en lecture seule.','CHAT_READ_ONLY');
  const user=await prisma.user.findUniqueOrThrow({where:{id:userId},select:{chatMutedUntil:true}});if(user.chatMutedUntil&&user.chatMutedUntil>new Date())throw new ChatError(403,`Votre accès au chat est suspendu jusqu’au ${user.chatMutedUntil.toLocaleString('fr-FR')}.`,'CHAT_MUTED');
  const validated=validateChatContent(input.content),clientRequestId=typeof input.clientRequestId==='string'&&input.clientRequestId.length<=100?input.clientRequestId:null,now=new Date(),fiveSecondsAgo=new Date(now.getTime()-5000),minuteAgo=new Date(now.getTime()-60000);
  const result=await prisma.$transaction(async tx=>{
    if(clientRequestId){const existing=await tx.sessionMessage.findFirst({where:{sessionId,authorId:userId,clientRequestId},include:messageInclude});if(existing)return{message:existing,error:null}}
    const [burst,minute,ipEvents,duplicate]=await Promise.all([
      tx.sessionMessage.count({where:{sessionId,authorId:userId,createdAt:{gte:fiveSecondsAgo}}}),
      tx.sessionMessage.count({where:{sessionId,authorId:userId,createdAt:{gte:minuteAgo}}}),
      tx.chatRateLimitEvent.count({where:{ipHash,createdAt:{gte:minuteAgo}}}),
      tx.sessionMessage.findFirst({where:{sessionId,authorId:userId,contentHash:validated.contentHash,createdAt:{gte:minuteAgo}}})
    ]);
    const limited=burst>=3||minute>=10||ipEvents>=30;
    if(limited||duplicate){await tx.chatRateLimitEvent.create({data:{sessionId,userId,ipHash,outcome:limited?'RATE_LIMITED':'DUPLICATE'}});return{message:null,error:limited?'RATE_LIMITED':'DUPLICATE'}}
    const message=await tx.sessionMessage.create({data:{sessionId,authorId:userId,content:validated.content,contentHash:validated.contentHash,clientRequestId,suspicious:validated.suspicious},include:messageInclude});
    await tx.chatRateLimitEvent.create({data:{sessionId,userId,ipHash,outcome:'ACCEPTED'}});return{message,error:null};
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  if(result.error==='RATE_LIMITED')throw new ChatError(429,'Vous envoyez des messages trop rapidement. Réessayez dans quelques secondes.','RATE_LIMITED');
  if(result.error==='DUPLICATE')throw new ChatError(409,'Ce message a déjà été envoyé récemment.','DUPLICATE_MESSAGE');
  return serializeChatMessage(result.message!,userId);
}
