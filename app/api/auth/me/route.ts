import {currentUserFromToken, SESSION_COOKIE} from '@/lib/auth';

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(`${SESSION_COOKIE}=`));
  const user = await currentUserFromToken(cookie ? decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1)) : null);
  return Response.json({authenticated: Boolean(user), user}, {headers: {'Cache-Control': 'no-store'}});
}
