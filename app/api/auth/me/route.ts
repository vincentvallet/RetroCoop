import {currentUserFromToken, SESSION_COOKIE} from '@/lib/auth';
import {publicUsername} from '@/lib/public-user';

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(`${SESSION_COOKIE}=`));
  const user = await currentUserFromToken(cookie ? decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1)) : null);
  return Response.json({authenticated:Boolean(user),user:user?{id:user.id,username:publicUsername(user.username,user.email),role:user.role,joinEmailEnabled:user.joinEmailEnabled}:null},{headers:{'Cache-Control':'no-store'}});
}
