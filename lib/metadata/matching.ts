import {normalizeGameTitle} from '../games';
import {MetadataMatch, NormalizedGameMetadata} from './types';

export function scoreMetadataMatch(game: {title: string; releaseYear: number | null; playerMax?: number | null}, candidate: NormalizedGameMetadata): MetadataMatch {
  const target = normalizeGameTitle(game.title);
  const names = [candidate.title, ...(candidate.alternativeTitles ?? [])].map(normalizeGameTitle);
  let confidence = 0;
  const reasons: string[] = [];
  if (names.includes(target)) { confidence += 0.72; reasons.push('titre exact normalisé'); }
  else if (names.some(name => name.startsWith(target) || target.startsWith(name))) { confidence += 0.48; reasons.push('titre proche à vérifier'); }
  if (game.releaseYear && candidate.releaseYear) {
    const delta = Math.abs(game.releaseYear - candidate.releaseYear);
    if (delta === 0) { confidence += 0.18; reasons.push('année identique'); }
    else if (delta === 1) { confidence += 0.08; reasons.push('année voisine'); }
    else { confidence -= 0.18; reasons.push('année incompatible'); }
  }
  if (game.playerMax && candidate.playersMax && game.playerMax === candidate.playersMax) { confidence += 0.1; reasons.push('nombre de joueurs identique'); }
  return {candidate, confidence: Math.max(0, Math.min(1, confidence)), reasons};
}
