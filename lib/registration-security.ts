import crypto from 'node:crypto';
export const normalizeIdentity=(value:string)=>value.normalize('NFKC').trim().toLocaleLowerCase('fr');
export const digest=(value:string)=>crypto.createHash('sha256').update(value).digest('hex');
export const secret=()=>{
  const value=process.env.AUTH_SECRET;
  if(value)return value;
  if(process.env.NODE_ENV==='production')throw new Error('AUTH_SECRET is required in production');
  return 'retrocoop-local-development-only';
};
export const sign=(value:string)=>crypto.createHmac('sha256',secret()).update(value).digest('base64url');
export const safeEqual=(left:string,right:string)=>{const a=Buffer.from(left),b=Buffer.from(right);return a.length===b.length&&crypto.timingSafeEqual(a,b)};
export const clientIp=(headers:Headers)=>(headers.get('x-forwarded-for')?.split(',')[0]||headers.get('x-real-ip')||'local').trim();
