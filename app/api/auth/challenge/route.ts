import crypto from 'node:crypto';
import {prisma} from '@/lib/db';
import {digest,secret} from '@/lib/registration-security';
export const dynamic='force-dynamic';
export async function GET(){const a=crypto.randomInt(1,10),b=crypto.randomInt(1,10),token=crypto.randomBytes(24).toString('base64url'),expiresAt=new Date(Date.now()+10*60_000);await prisma.registrationChallenge.create({data:{tokenHash:digest(token),answerHash:digest(`${a+b}:${secret()}`),expiresAt}});return Response.json({question:`Combien font ${a} + ${b} ?`,token,expiresAt:expiresAt.toISOString()},{headers:{'Cache-Control':'no-store'}})}
