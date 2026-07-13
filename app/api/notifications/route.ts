import {currentUserFromToken,sessionTokenFromRequest} from '@/lib/auth';
import {notificationList} from '@/lib/notifications';
export async function GET(request:Request){const user=await currentUserFromToken(sessionTokenFromRequest(request));if(!user)return Response.json({error:'Authentification requise.'},{status:401});return Response.json(await notificationList(user.id),{headers:{'Cache-Control':'no-store'}})}
