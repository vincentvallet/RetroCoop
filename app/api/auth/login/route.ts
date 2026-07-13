import argon2 from 'argon2';
import {prisma} from '@/lib/db';
import {normalizeIdentity} from '@/lib/registration-security';
import {createSessionToken,sessionCookie} from '@/lib/auth';

export async function POST(request:Request){
  let input:{email?:string;password?:string};
  try{input=await request.json()}catch{return Response.json({error:'Requête invalide.'},{status:400})}
  const user=await prisma.user.findFirst({where:{email:normalizeIdentity(input.email??''),status:'ACTIVE'}});
  if(!user||!await argon2.verify(user.passwordHash,input.password??''))return Response.json({error:'Identifiants incorrects.'},{status:401});
  const token=createSessionToken(user.id,user.authVersion);
  return Response.json({ok:true,user:{id:user.id,username:user.username}},{headers:{'Set-Cookie':sessionCookie(token)}});
}
