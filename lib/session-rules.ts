export type SessionRuleInput={hostId:string;status:string;startsAtUtc:Date;maxPlayers:number;participantIds:string[]};
export type SessionRuleRejection={status:number;code:string;message:string};
export function joinRejection(session:SessionRuleInput,userId:string,now=new Date()):SessionRuleRejection|null{
  if(session.hostId===userId)return{status:409,code:'OWNER_ALREADY_JOINED',message:'Vous organisez déjà cette session.'};
  if(session.participantIds.includes(userId))return{status:409,code:'ALREADY_JOINED',message:'Vous participez déjà à cette session.'};
  if(session.status==='CANCELLED')return{status:409,code:'SESSION_CANCELLED',message:'Cette session a été annulée.'};
  if(session.status==='CLOSED')return{status:409,code:'REGISTRATIONS_CLOSED',message:'Les inscriptions sont fermées.'};
  if(session.status==='FULL'||session.participantIds.length>=session.maxPlayers)return{status:409,code:'SESSION_FULL',message:'Cette session est complète.'};
  if(session.status!=='OPEN')return{status:409,code:'REGISTRATIONS_CLOSED',message:'Les inscriptions sont fermées.'};
  if(session.startsAtUtc<=now)return{status:409,code:'SESSION_PAST',message:'Cette session a déjà commencé.'};
  return null;
}
export function capacityStatus(status:string,participantCount:number,maximum:number){if(status!=='OPEN'&&status!=='FULL')return status;return participantCount>=maximum?'FULL':'OPEN'}
