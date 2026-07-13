import {currentUserFromToken,sessionTokenFromRequest} from '@/lib/auth';
import {actionError,removeParticipant} from '@/lib/session-management';

export async function DELETE(request:Request,{params}:{params:Promise<{id:string;userId:string}>}){const user=await currentUserFromToken(sessionTokenFromRequest(request));if(!user)return Response.json({error:'Authentification requise.'},{status:401});try{const {id,userId}=await params;return Response.json({success:true,session:await removeParticipant(id,userId,user.id)},{headers:{'Cache-Control':'no-store'}})}catch(error){return actionError(error)}}
