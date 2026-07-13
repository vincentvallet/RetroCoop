import {prisma} from './db';
import {clientIp, digest, secret} from './registration-security';

export function sameOriginError(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return null;
  const allowed = new Set([new URL(request.url).origin]);
  if (process.env.APP_URL) allowed.add(process.env.APP_URL.replace(/\/$/, ''));
  const host = request.headers.get('x-forwarded-host');
  const protocol = request.headers.get('x-forwarded-proto');
  if (host && protocol && ['http', 'https'].includes(protocol)) allowed.add(`${protocol}://${host}`);
  return allowed.has(origin) ? null : Response.json({error: 'Origine de la requête refusée.'}, {status: 403});
}

export function requestSecurityHash(request: Request) {
  return digest(`${clientIp(request.headers)}:${secret()}:account-security`);
}

export async function accountRateLimited(userId: string, action: string, ipHash: string, maximum: number, windowMs: number) {
  const since = new Date(Date.now() - windowMs);
  return await prisma.accountSecurityEvent.count({where: {action, createdAt: {gte: since}, OR: [{userId}, {ipHash}]}}) >= maximum;
}

export async function recordAccountEvent(userId: string | null, action: string, ipHash: string, success: boolean) {
  await prisma.accountSecurityEvent.create({data: {userId, action, ipHash, success}});
}
