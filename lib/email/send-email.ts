import {Prisma} from '@prisma/client';
import {prisma} from '../db';
import {sendWithResend} from './client';
import type {EmailTemplate} from './templates';

export type DeliveryEvent='WELCOME'|'PARTICIPANT_JOINED'|'PARTICIPANT_LEFT'|'ACCOUNT_DELETED';
type DeliveryInput={eventType:DeliveryEvent;idempotencyKey:string;to:string;template:EmailTemplate;userId?:string|null;sessionId?:string|null;enabled?:boolean};

export async function deliverEmail(input:DeliveryInput){
  let delivery;
  try{delivery=await prisma.emailDelivery.create({data:{eventType:input.eventType,idempotencyKey:input.idempotencyKey,userId:input.userId,sessionId:input.sessionId,status:input.enabled===false?'SKIPPED':'PENDING',attempts:input.enabled===false?0:1,lastErrorCode:input.enabled===false?'PREFERENCE_DISABLED':null}})}catch(error){
    if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002'){const existing=await prisma.emailDelivery.findUnique({where:{idempotencyKey:input.idempotencyKey}});return{status:existing?.status??'SKIPPED',duplicate:true,deliveryId:existing?.id}}
    throw error;
  }
  if(input.enabled===false)return{status:'SKIPPED',duplicate:false,deliveryId:delivery.id};
  if(input.eventType==='PARTICIPANT_JOINED'||input.eventType==='PARTICIPANT_LEFT'){
    const participantId=input.idempotencyKey.split(':').at(-2);
    const recent=participantId&&input.sessionId?await prisma.emailDelivery.count({where:{
      id:{not:delivery.id},
      sessionId:input.sessionId,
      idempotencyKey:{contains:`:${participantId}:`},
      eventType:{in:['PARTICIPANT_JOINED','PARTICIPANT_LEFT']},
      status:{in:['PENDING','SENT']},
      createdAt:{gte:new Date(Date.now()-60*60_000)},
    }}):0;
    if(recent>=6){await prisma.emailDelivery.update({where:{id:delivery.id},data:{status:'SKIPPED',attempts:0,lastErrorCode:'PARTICIPATION_RATE_LIMITED'}}).catch(()=>undefined);console.warn('Transactional email suppressed.',{eventType:input.eventType,deliveryId:delivery.id,errorCode:'PARTICIPATION_RATE_LIMITED'});return{status:'SKIPPED',duplicate:false,deliveryId:delivery.id,errorCode:'PARTICIPATION_RATE_LIMITED'}}
  }
  const result=await sendWithResend(input.to,input.template,input.idempotencyKey);
  await prisma.emailDelivery.update({where:{id:delivery.id},data:{status:result.status,providerId:result.providerId,lastErrorCode:result.errorCode,sentAt:result.status==='SENT'?new Date():null,failedAt:result.status==='FAILED'?new Date():null}}).catch(()=>undefined);
  if(result.status==='FAILED')console.warn('Transactional email failed.',{eventType:input.eventType,deliveryId:delivery.id,errorCode:result.errorCode});
  return{...result,duplicate:false,deliveryId:delivery.id};
}
