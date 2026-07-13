import {prisma} from './db';
import {legalConfig} from './legal-config';
type JoinEmail={notificationId:string;sessionId:string;participantId:string;participantName:string;hostName:string;hostEmail:string;gameTitle:string;startsAt:Date;timezone:string;enabled:boolean};
export async function sendJoinEmail(input:JoinEmail){
  const key=process.env.RESEND_API_KEY,from=legalConfig.defaultEmailFrom,base=(process.env.APP_URL??'').replace(/\/$/,'');
  if(!input.enabled||!key||!from||!base){await prisma.notification.update({where:{id:input.notificationId},data:{emailStatus:input.enabled?'DISABLED':'PREFERENCE_DISABLED'}});return}
  const recent=await prisma.notification.findFirst({where:{id:{not:input.notificationId},sessionId:input.sessionId,actorId:input.participantId,type:'SESSION_PARTICIPANT_JOINED',emailStatus:'SENT',emailSentAt:{gte:new Date(Date.now()-30*60*1000)}}});
  if(recent){await prisma.notification.update({where:{id:input.notificationId},data:{emailStatus:'RATE_LIMITED'}});return}
  await prisma.notification.update({where:{id:input.notificationId},data:{emailStatus:'PENDING'}});
  try{const date=new Intl.DateTimeFormat('fr-FR',{dateStyle:'full',timeStyle:'short',timeZone:input.timezone}).format(input.startsAt),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:controller.signal,headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[input.hostEmail],subject:'Un joueur a rejoint votre session RetroCoop',text:`Bonjour ${input.hostName},\n\n${input.participantName} a rejoint votre session pour jouer à ${input.gameTitle} le ${date}.\n\nVoir la session :\n${base}/sessions/${input.sessionId}`})});clearTimeout(timer);await prisma.notification.update({where:{id:input.notificationId},data:response.ok?{emailStatus:'SENT',emailSentAt:new Date()}:{emailStatus:'FAILED'}})}catch(error){console.warn('Notification email non envoyée.',error instanceof Error?error.message:'Erreur Resend');await prisma.notification.update({where:{id:input.notificationId},data:{emailStatus:'FAILED'}}).catch(()=>undefined)}
}
