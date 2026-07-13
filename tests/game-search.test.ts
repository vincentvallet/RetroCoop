import {describe, expect, it} from 'vitest';
import {normalizeGameTitle, searchGames} from '../lib/games';
import {scoreMetadataMatch} from '../lib/metadata/matching';
import {parseOptions} from '../scripts/enrich-igdb';

const games = [
  {title: 'Streets of Rage 3', aliases: []},
  {title: "Street Fighter II': Special Champion Edition", aliases: []},
  {title: 'L’Été olympique', aliases: []},
];

describe('recherche de jeux', () => {
  it('ignore accents, casse et ponctuation', () => expect(normalizeGameTitle('L’ÉTÉ!')).toBe('l ete'));
  it('rapproche chiffres romains et arabes', () => expect(normalizeGameTitle('Street Fighter II')).toBe(normalizeGameTitle('Street Fighter 2')));
  it('recherche par premières lettres', () => expect(searchGames(games, 'stre').map(game => game.title)).toHaveLength(2));
});

describe('enrichissement', () => {
  it('parse les options sûres', () => expect(parseOptions(['--dry-run', '--limit=20', '--game=Test'])).toEqual({dryRun: true, force: false, limit: 20, game: 'Test'}));
  it('refuse un titre proche sans assez de signaux', () => expect(scoreMetadataMatch({title: 'Street Fighter II', releaseYear: 1993}, {externalId: '1', source: 'IGDB', title: 'Street Fighter II Turbo', releaseYear: 1995}).confidence).toBeLessThan(.72));
});

