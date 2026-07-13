import {cookies} from 'next/headers';
import {prisma} from '@/lib/db';
import {safeEqual, sign} from '@/lib/registration-security';

export const SESSION_COOKIE = 'retrocoop_session';
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60;
type SessionPayload = {sub: string; exp: number};

export function createSessionToken(userId: string) {
  const payload = Buffer.from(JSON.stringify({sub: userId, exp: Date.now() + SESSION_MAX_AGE * 1000} satisfies SessionPayload)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra || !safeEqual(signature, sign(payload))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionPayload;
    return typeof parsed.sub === 'string' && typeof parsed.exp === 'number' && parsed.exp > Date.now() ? parsed : null;
  } catch { return null; }
}

export function sessionCookie(token: string) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export function expiredSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export async function currentUserFromToken(token?: string | null) {
  const payload = readSessionToken(token);
  if (!payload) return null;
  return prisma.user.findFirst({where: {id: payload.sub, status: 'ACTIVE'}, select: {id: true, username: true, email: true, role: true}});
}

export function sessionTokenFromRequest(request: Request) {
  const cookie = request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith(`${SESSION_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1)) : null;
}

export async function currentUser() {
  const store = await cookies();
  return currentUserFromToken(store.get(SESSION_COOKIE)?.value);
}

export function safeReturnTo(value?: string | null, fallback = '/catalogue') {
  return value?.startsWith('/') && !value.startsWith('//') ? value : fallback;
}
