export type GameMetadataCandidate = {externalId: string; title: string; releaseYear?: number; platformNames?: string[]};

export interface NormalizedGameMetadata {
  externalId: string;
  source: string;
  title: string;
  alternativeTitles?: string[];
  releaseDate?: string;
  releaseYear?: number;
  developer?: string;
  publisher?: string;
  genres?: string[];
  playersMin?: number;
  playersMax?: number;
  coverUrl?: string;
  coverWidth?: number;
  coverHeight?: number;
  sourcePageUrl?: string;
  license?: string;
  attribution?: string;
}

export interface GameMetadataProvider {
  searchGame(input: {title: string; platform: string; year?: number}): Promise<GameMetadataCandidate[]>;
  getGameDetails(externalId: string): Promise<NormalizedGameMetadata>;
}

export interface MetadataMatch {candidate: NormalizedGameMetadata; confidence: number; reasons: string[]}
