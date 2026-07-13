export type GameplayImage={path:string;source:'libretro'|'igdb'|'screenscraper'|'manual';sourceFilename?:string;width:number;height:number;fileSize:number;platformVerified:boolean;sortOrder:number;importedAt:string};
export type CatalogueGame = {
  platform: string;
  title: string;
  sortTitle: string;
  slug: string;
  aliases: string[];
  region: string | null;
  releaseYear: number | null;
  genres: string[];
  tags?: string[];
  playerMin: number | null;
  playerMax: number | null;
  coop: boolean | null;
  versus: boolean | null;
  coverUrl?: string | null;
  coverAlt?: string | null;
  metadataSource?: string | null;
  metadataExternalId?: string | null;
  metadataUpdatedAt?: string | null;
  coverSource?: string | null;
  coverAttribution?: string | null;
  coverPath?: string | null;
  coverOrigin?: 'manual' | 'editorial' | 'libretro' | 'igdb' | 'screenscraper' | 'placeholder' | null;
  coverSourceFilename?: string | null;
  coverRegion?: string | null;
  coverMatchConfidence?: number | null;
  coverImportedAt?: string | null;
  gameplayImages?: GameplayImage[];
  externalRating?: number | null;
  externalRatingCount?: number | null;
  externalRatingProvider?: 'igdb' | null;
  organizedSessionCount?: number;
};

export function toCatalogueGame(game: CatalogueGame): CatalogueGame {
  return {platform: game.platform, title: game.title, sortTitle: game.sortTitle, slug: game.slug, aliases: game.aliases ?? [], region: game.region, releaseYear: game.releaseYear, genres: game.genres ?? [],tags:game.tags??[], playerMin: game.playerMin, playerMax: game.playerMax, coop: game.coop, versus: game.versus, coverUrl: game.coverUrl ?? null, coverAlt: game.coverAlt ?? null, metadataSource: game.metadataSource ?? null, metadataExternalId: game.metadataExternalId ?? null, metadataUpdatedAt: game.metadataUpdatedAt ?? null, coverSource: game.coverSource ?? null, coverAttribution: game.coverAttribution ?? null,coverPath:game.coverPath??null,coverOrigin:game.coverOrigin??null,coverSourceFilename:game.coverSourceFilename??null,coverRegion:game.coverRegion??null,coverMatchConfidence:game.coverMatchConfidence??null,coverImportedAt:game.coverImportedAt??null,gameplayImages:game.gameplayImages??[],externalRating:game.externalRating??null,externalRatingCount:game.externalRatingCount??null,externalRatingProvider:game.externalRatingProvider??null,organizedSessionCount:game.organizedSessionCount??0};
}

const roman: Record<string, string> = {i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6'};

export function normalizeGameTitle(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .replace(/\b(i|ii|iii|iv|v|vi)\b/g, token => roman[token] ?? token)
    .replace(/\b(mega drive|megadrive|genesis|europe|usa|japan|pal|ntsc)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function searchGames<T extends Pick<CatalogueGame, 'title' | 'aliases'>>(games: T[], query: string, limit = 10) {
  const needle = normalizeGameTitle(query);
  if (!needle) return games.slice(0, limit);
  return games
    .map((game, index) => {
      const values = [game.title, ...(game.aliases ?? [])].map(normalizeGameTitle);
      const best = Math.min(...values.map(value => value === needle ? 0 : value.startsWith(needle) ? 1 : value.includes(needle) ? 2 : 99));
      return {game, index, best};
    })
    .filter(result => result.best < 99)
    .sort((a, b) => a.best - b.best || a.index - b.index)
    .slice(0, limit)
    .map(result => result.game);
}
