import argon2 from 'argon2';
import {prisma} from '@/lib/db';
import {clientIp,digest,normalizeIdentity,secret} from '@/lib/registration-security';
import {createSessionToken,sessionCookie} from '@/lib/auth';
import {validatePassword,validateUsername} from '@/lib/account-validation';
import {sendWelcomeEmail} from '@/lib/email';
import {after} from 'next/server';
import {Prisma} from '@prisma/client';

export async function POST(request:Request){
  let input:{email?:string;username?:string;password?:string;answer?:string;challengeToken?:string;website?:string};
  try{input=await request.json()}catch{return Response.json({error:'Requête invalide.'},{status:400})}
  const email=normalizeIdentity(input.email??'');
  const usernameResult=validateUsername(input.username);
  const username=usernameResult.ok?usernameResult.value:'';
  const usernameNormalized=usernameResult.ok?usernameResult.normalized:normalizeIdentity(input.username??'');
  const password=input.password??'';
  const passwordResult=validatePassword(password);
  const ipHash=digest(`${clientIp(request.headers)}:${secret()}`);
  const since=new Date(Date.now()-15*60_000);
  if(input.website)return Response.json({error:'Inscription refusée.'},{status:400});
  if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!usernameResult.ok||!passwordResult.ok||!input.challengeToken)return Response.json({error:!usernameResult.ok?usernameResult.error:!passwordResult.ok?passwordResult.error:'Champs invalides.'},{status:400});
  const attempts=await prisma.registrationAttempt.count({where:{success:false,createdAt:{gte:since},OR:[{ipHash},{emailNormalized:email},{usernameNormalized}]}});
  if(attempts>=5)return Response.json({error:'Trop de tentatives. Réessayez dans 15 minutes.'},{status:429});
  const challenge=await prisma.registrationChallenge.findUnique({where:{tokenHash:digest(input.challengeToken)}});
  const answerValid=challenge&&!challenge.usedAt&&challenge.expiresAt>new Date()&&challenge.answerHash===digest(`${input.answer??''}:${secret()}`);
  if(!answerValid){await prisma.registrationAttempt.create({data:{ipHash,emailNormalized:email,usernameNormalized}});return Response.json({error:'Le calcul est incorrect ou expiré.'},{status:400})}
  let user:{id:string;username:string};
  try{
    const passwordHash=await argon2.hash(password,{type:argon2.argon2id});
    const [,createdUser] = await prisma.$transaction([
      prisma.registrationChallenge.update({where:{id:challenge.id},data:{usedAt:new Date()}}),
      prisma.user.create({data:{email,username,usernameNormalized,passwordHash}}),
      prisma.registrationAttempt.create({data:{ipHash,emailNormalized:email,usernameNormalized,success:true}}),
    ]);
    user=createdUser;
  }catch(error){
    await prisma.registrationAttempt.create({data:{ipHash,emailNormalized:email,usernameNormalized}});
    if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002')return Response.json({error:'Cet email ou ce pseudo est déjà utilisé.'},{status:409});
    console.error('Registration failed.',{errorCode:error instanceof Prisma.PrismaClientKnownRequestError?error.code:'INTERNAL',model:error instanceof Prisma.PrismaClientKnownRequestError?error.meta?.modelName:undefined,column:error instanceof Prisma.PrismaClientKnownRequestError?error.meta?.column:undefined});
    return Response.json({error:'Inscription impossible. Réessayez.'},{status:500});
  }
  after(()=>sendWelcomeEmail({userId:user.id,email}).catch(()=>undefined));
  return Response.json({ok:true,user:{id:user.id,username:user.username}},{status:201,headers:{'Set-Cookie':sessionCookie(createSessionToken(user.id,0))}});
}
