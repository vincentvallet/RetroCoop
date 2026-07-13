import {currentUserFromToken,sessionTokenFromRequest} from '@/lib/auth';
import {actionError,deleteSession,updateSession} from '@/lib/session-management';
import {sessionById} from '@/lib/sessions';

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params,user=await currentUserFromToken(sessionTokenFromRequest(request)),session=await sessionById(id,user?.id);if(!session)return Response.json({error:'Session introuvable.'},{status:404});return Response.json({session},{headers:{'Cache-Control':'no-store'}})}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){const user=await currentUserFromToken(sessionTokenFromRequest(request));if(!user)return Response.json({error:'Authentification requise.'},{status:401});try{const input=await request.json(),{id}=await params;return Response.json({success:true,session:await updateSession(id,user.id,input)},{headers:{'Cache-Control':'no-store'}})}catch(error){return actionError(error)}}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){const user=await currentUserFromToken(sessionTokenFromRequest(request));if(!user)return Response.json({error:'Authentification requise.'},{status:401});try{const {id}=await params;await deleteSession(id,user.id);return Response.json({success:true})}catch(error){return actionError(error)}}
