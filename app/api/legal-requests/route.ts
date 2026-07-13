import {prisma} from '@/lib/db';
import {currentUserFromToken, sessionTokenFromRequest} from '@/lib/auth';
import {clientIp, digest, normalizeIdentity, secret} from '@/lib/registration-security';
import {isLegalRequestCategory} from '@/lib/legal-request-categories';

const controlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const emailPattern = /^\S+@\S+\.\S+$/;

function text(value: unknown, maximum: number) {
  return typeof value === 'string' ? value.normalize('NFKC').trim().slice(0, maximum + 1) : '';
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const allowedOrigins = new Set([new URL(request.url).origin]);
  if (process.env.APP_URL) allowedOrigins.add(process.env.APP_URL.replace(/\/$/, ''));
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedHost && forwardedProto && ['http', 'https'].includes(forwardedProto)) allowedOrigins.add(`${forwardedProto}://${forwardedHost}`);
  if (origin && !allowedOrigins.has(origin)) return Response.json({error: 'Origine de la requête refusée.'}, {status: 403});
  let input: Record<string, unknown>;
  try { input = await request.json(); } catch { return Response.json({error: 'Requête invalide.'}, {status: 400}); }
  if (input.website) return Response.json({error: 'Demande refusée.'}, {status: 400});

  const user = await currentUserFromToken(sessionTokenFromRequest(request));
  const category = input.category;
  const requesterName = text(input.requesterName, 100) || null;
  const suppliedEmail = normalizeIdentity(text(input.requesterEmail, 254));
  const requesterEmail = user?.email || suppliedEmail;
  const subject = text(input.subject, 200);
  const message = text(input.message, 5000);
  const pageUrl = text(input.pageUrl, 500) || null;
  if (!isLegalRequestCategory(category) || !emailPattern.test(requesterEmail) || subject.length < 3 || message.length < 20 || subject.length > 200 || message.length > 5000) {
    return Response.json({error: 'Les champs de la demande sont invalides.'}, {status: 400});
  }
  if (controlCharacters.test(subject) || controlCharacters.test(message) || /<\/?(?:script|iframe|object|embed)\b/i.test(message)) {
    return Response.json({error: 'Seul le texte brut est accepté.'}, {status: 400});
  }
  if (pageUrl) {
    try { const parsed = new URL(pageUrl); if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(); }
    catch { return Response.json({error: 'L’URL concernée est invalide.'}, {status: 400}); }
  }

  const ipHash = digest(`${clientIp(request.headers)}:${secret()}:legal-request`);
  const since = new Date(Date.now() - 60 * 60_000);
  if (await prisma.legalRequest.count({where: {ipHash, createdAt: {gte: since}}}) >= 5) {
    return Response.json({error: 'Trop de demandes ont été envoyées. Réessayez plus tard.'}, {status: 429});
  }
  const row = await prisma.legalRequest.create({data: {category, requesterName, requesterEmail, subject, message, pageUrl, ipHash, userId: user?.id}});
  return Response.json({success: true, reference: row.id}, {status: 201, headers: {'Cache-Control': 'no-store'}});
}
