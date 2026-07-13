import {currentUserFromToken,sessionTokenFromRequest} from '@/lib/auth';
import {actionError,joinSession,leaveSession} from '@/lib/session-management';
import {sendParticipantJoinedEmail,sendParticipantLeftEmail} from '@/lib/email';
import {after} from 'next/server';

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){const user=await currentUserFromToken(sessionTokenFromRequest(request));if(!user)return Response.json({error:'Vous devez être connecté pour rejoindre cette session.'},{status:401});try{const {id}=await params,result=await joinSession(id,user.id);after(()=>sendParticipantJoinedEmail(result.email).catch(()=>undefined));return Response.json({success:true,session:result.session},{status:201,headers:{'Cache-Control':'no-store'}})}catch(error){return actionError(error)}}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){const user=await currentUserFromToken(sessionTokenFromRequest(request));if(!user)return Response.json({error:'Authentification requise.'},{status:401});try{const {id}=await params,result=await leaveSession(id,user.id);after(()=>sendParticipantLeftEmail(result.email).catch(()=>undefined));return Response.json({success:true,message:'Vous avez quitté la session.',session:result.session},{headers:{'Cache-Control':'no-store'}})}catch(error){return actionError(error)}}
