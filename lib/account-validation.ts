import {normalizeIdentity} from './registration-security';

const reserved = new Set(['admin','administrator','administrateur','moderator','moderateur','retrocoop','support','system','systeme']);
const usernamePattern = /^[\p{L}\p{N}_-]+(?: [\p{L}\p{N}_-]+)*$/u;

export type ValidationResult = {ok: true; value: string; normalized: string} | {ok: false; error: string; code: string};

export function validateUsername(input: unknown): ValidationResult {
  if (typeof input !== 'string') return {ok: false, error: 'Le pseudo est invalide.', code: 'INVALID_USERNAME'};
  const value = input.normalize('NFKC');
  if (value !== value.trim() || value.length < 3 || value.length > 24 || !usernamePattern.test(value) || value.includes('@')) return {ok: false, error: 'Le pseudo doit contenir 3 à 24 caractères autorisés.', code: 'INVALID_USERNAME'};
  const normalized = normalizeIdentity(value);
  const words = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[ _-]+/);
  if (words.some(word => reserved.has(word))) return {ok: false, error: 'Ce pseudo est réservé.', code: 'RESERVED_USERNAME'};
  return {ok: true, value, normalized};
}

export function validatePassword(input: unknown) {
  if (typeof input !== 'string' || input.length < 12 || input.length > 128 || !/\p{L}/u.test(input) || !/\d/u.test(input)) {
    return {ok: false as const, error: 'Le mot de passe doit contenir au moins 12 caractères, une lettre et un chiffre.', code: 'WEAK_PASSWORD'};
  }
  return {ok: true as const, value: input};
}
