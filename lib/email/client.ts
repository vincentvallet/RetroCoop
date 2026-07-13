import type {EmailTemplate} from './templates';

export type ResendResult={status:'SENT'|'FAILED'|'SKIPPED';providerId?:string;errorCode?:string};

export async function sendWithResend(to:string,template:EmailTemplate,idempotencyKey:string):Promise<ResendResult>{
  const key=process.env.RESEND_API_KEY,from=process.env.EMAIL_FROM;
  if(!key||!from)return{status:'SKIPPED',errorCode:'EMAIL_DISABLED'};
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
    const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:controller.signal,headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':idempotencyKey.slice(0,256)},body:JSON.stringify({from,to:[to],subject:template.subject,text:template.text,html:template.html})});
    const payload=await response.json().catch(()=>({})) as {id?:string;name?:string};
    return response.ok?{status:'SENT',providerId:payload.id}:{status:'FAILED',errorCode:payload.name||`HTTP_${response.status}`};
  }catch(error){return{status:'FAILED',errorCode:error instanceof DOMException&&error.name==='AbortError'?'TIMEOUT':'NETWORK_ERROR'}}finally{clearTimeout(timer)}
}
