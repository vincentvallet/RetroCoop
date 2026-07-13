import {prisma} from '../db';
import {publicUsername} from '../public-user';
import {deliverEmail} from './send-email';
import {accountDeletedTemplate,participantJoinedTemplate,participantLeftTemplate,welcomeTemplate} from './templates';

const appUrl=()=>{const value=(process.env.APP_URL||'').replace(/\/$/,'');return value||'http://localhost:3000'};
const notificationStatus=(status:string)=>status==='SENT'?'SENT':status==='FAILED'?'FAILED':status==='SKIPPED'?'DISABLED':status;

export async function sendWelcomeEmail(input:{userId:string;email:string}){
  return deliverEmail({eventType:'WELCOME',idempotencyKey:`welcome:${input.userId}`,userId:input.userId,to:input.email,template:welcomeTemplate(appUrl())});
}

export type ParticipationEmailInput={notificationId:string;sessionId:string;participantId:string;participantName:string;hostId:string;hostName:string;hostEmail:string;gameTitle:string;startsAt:Date;timezone:string;participantCount:number;maximumCapacity:number;participationVersion:number;enabled:boolean};
function participationTemplateInput(input:ParticipationEmailInput){return{hostUsername:input.hostName,participantUsername:input.participantName,game:input.gameTitle,startsAt:input.startsAt,timezone:input.timezone,participantCount:input.participantCount,maximumCapacity:input.maximumCapacity,sessionUrl:`${appUrl()}/sessions/${input.sessionId}`}}

export async function sendParticipantJoinedEmail(input:ParticipationEmailInput){
  const result=await deliverEmail({eventType:'PARTICIPANT_JOINED',idempotencyKey:`session-participant-joined:${input.sessionId}:${input.participantId}:${input.participationVersion}`,userId:input.hostId,sessionId:input.sessionId,to:input.hostEmail,template:participantJoinedTemplate(participationTemplateInput(input)),enabled:input.enabled});
  await prisma.notification.update({where:{id:input.notificationId},data:{emailStatus:notificationStatus(result.status),emailSentAt:result.status==='SENT'?new Date():null}}).catch(()=>undefined);return result;
}

export async function sendParticipantLeftEmail(input:ParticipationEmailInput){
  const result=await deliverEmail({eventType:'PARTICIPANT_LEFT',idempotencyKey:`session-participant-left:${input.sessionId}:${input.participantId}:${input.participationVersion}`,userId:input.hostId,sessionId:input.sessionId,to:input.hostEmail,template:participantLeftTemplate(participationTemplateInput(input)),enabled:input.enabled});
  await prisma.notification.update({where:{id:input.notificationId},data:{emailStatus:notificationStatus(result.status),emailSentAt:result.status==='SENT'?new Date():null}}).catch(()=>undefined);return result;
}

export async function sendAccountDeletedEmail(input:{userId:string;email:string;deletionVersion:number}){
  return deliverEmail({eventType:'ACCOUNT_DELETED',idempotencyKey:`account-deleted:${input.userId}:${input.deletionVersion}`,userId:input.userId,to:input.email,template:accountDeletedTemplate()});
}

export{publicUsername};
