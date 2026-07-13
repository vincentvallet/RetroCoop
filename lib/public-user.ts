import {createHash} from 'node:crypto';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PublicUser = {id: string; username: string};

export function neutralPublicAlias(userId: string) {
  const suffix = createHash('sha256')
    .update(`retrocoop-public-alias:${userId}`)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
  return `Joueur-${suffix}`;
}

export function publicUsername(username: string | null | undefined, userId: string) {
  const value = username?.normalize('NFKC').trim();
  return value && !emailPattern.test(value) ? value : neutralPublicAlias(userId);
}
