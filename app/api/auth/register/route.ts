import argon2 from 'argon2';
import {prisma} from '@/lib/db';
import {clientIp,digest,normalizeIdentity,secret} from '@/lib/registration-security';
import {createSessionToken,sessionCookie} from '@/lib/auth';

export async function POST(request:Request){
  let input:{email?:string;username?:string;password?:string;answer?:string;challengeToken?:string;website?:string};
  try{input=await request.json()}catch{return Response.json({error:'Requête invalide.'},{status:400})}
  const email=normalizeIdentity(input.email??'');
  const username=(input.username??'').normalize('NFKC').trim();
  const usernameNormalized=normalizeIdentity(username);
  const password=input.password??'';
  const ipHash=digest(`${clientIp(request.headers)}:${secret()}`);
  const since=new Date(Date.now()-15*60_000);
  if(input.website)return Response.json({error:'Inscription refusée.'},{status:400});
  if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254||username.length<3||username.length>32||password.length<1||password.length>128||!input.challengeToken)return Response.json({error:'Champs invalides.'},{status:400});
  const attempts=await prisma.registrationAttempt.count({where:{success:false,createdAt:{gte:since},OR:[{ipHash},{emailNormalized:email},{usernameNormalized}]}});
  if(attempts>=5)return Response.json({error:'Trop de tentatives. Réessayez dans 15 minutes.'},{status:429});
  const challenge=await prisma.registrationChallenge.findUnique({where:{tokenHash:digest(input.challengeToken)}});
  const answerValid=challenge&&!challenge.usedAt&&challenge.expiresAt>new Date()&&challenge.answerHash===digest(`${input.answer??''}:${secret()}`);
  if(!answerValid){await prisma.registrationAttempt.create({data:{ipHash,emailNormalized:email,usernameNormalized}});return Response.json({error:'Le calcul est incorrect ou expiré.'},{status:400})}
  try{
    const passwordHash=await argon2.hash(password,{type:argon2.argon2id});
    const [,user] = await prisma.$transaction([
      prisma.registrationChallenge.update({where:{id:challenge.id},data:{usedAt:new Date()}}),
      prisma.user.create({data:{email,username,usernameNormalized,passwordHash}}),
      prisma.registrationAttempt.create({data:{ipHash,emailNormalized:email,usernameNormalized,success:true}}),
    ]);
    return Response.json({ok:true,user:{id:user.id,username:user.username,email:user.email}},{status:201,headers:{'Set-Cookie':sessionCookie(createSessionToken(user.id))}});
  }catch{
    await prisma.registrationAttempt.create({data:{ipHash,emailNormalized:email,usernameNormalized}});
    return Response.json({error:'Cet email ou ce pseudo est déjà utilisé.'},{status:409});
  }
}
