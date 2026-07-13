import {GameMetadataProvider, NormalizedGameMetadata} from './types';

type IgdbGame = {id: number; name: string; first_release_date?: number; alternative_names?: {name: string}[]; genres?: {name: string}[]; involved_companies?: {developer: boolean; publisher: boolean; company: {name: string}}[]; cover?: {image_id: string; width?: number; height?: number}; platforms?: {name: string}[]};

export class IgdbProvider implements GameMetadataProvider {
  private token?: string;
  private lastRequestAt = 0;
  constructor(private clientId: string, private clientSecret: string) {}

  private async accessToken() {
    if (this.token) return this.token;
    const body = new URLSearchParams({client_id: this.clientId, client_secret: this.clientSecret, grant_type: 'client_credentials'});
    const response = await fetch('https://id.twitch.tv/oauth2/token', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body});
    if (!response.ok) throw new Error(`Authentification IGDB impossible (${response.status})`);
    this.token = String((await response.json() as {access_token: string}).access_token);
    return this.token;
  }

  private async request(query: string): Promise<IgdbGame[]> {
    const delay = Math.max(0, 260 - (Date.now() - this.lastRequestAt));
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    this.lastRequestAt = Date.now();
    const response = await fetch('https://api.igdb.com/v4/games', {method: 'POST', headers: {'Client-ID': this.clientId, Authorization: `Bearer ${await this.accessToken()}`, Accept: 'application/json'}, body: query});
    if (response.status === 429) throw new Error('Limite de requêtes IGDB atteinte (429)');
    if (!response.ok) throw new Error(`Requête IGDB impossible (${response.status})`);
    return response.json() as Promise<IgdbGame[]>;
  }

  async searchGame(input: {title: string; platform: string; year?: number}) {
    const safeTitle = input.title.replace(/["\\]/g, ' ');
    const results = await this.request(`search "${safeTitle}"; fields name,first_release_date,platforms.name; where platforms = (29); limit 10;`);
    return results.map(game => ({externalId: String(game.id), title: game.name, releaseYear: game.first_release_date ? new Date(game.first_release_date * 1000).getUTCFullYear() : undefined, platformNames: game.platforms?.map(platform => platform.name)}));
  }

  async getGameDetails(externalId: string): Promise<NormalizedGameMetadata> {
    if (!/^\d+$/.test(externalId)) throw new Error('Identifiant IGDB invalide');
    const [game] = await this.request(`fields name,first_release_date,alternative_names.name,genres.name,involved_companies.developer,involved_companies.publisher,involved_companies.company.name,cover.image_id,cover.width,cover.height,platforms.name; where id = ${externalId}; limit 1;`);
    if (!game) throw new Error(`Jeu IGDB ${externalId} introuvable`);
    const date = game.first_release_date ? new Date(game.first_release_date * 1000) : undefined;
    return {externalId, source: 'IGDB', title: game.name, alternativeTitles: game.alternative_names?.map(value => value.name), releaseDate: date?.toISOString().slice(0, 10), releaseYear: date?.getUTCFullYear(), developer: game.involved_companies?.find(value => value.developer)?.company.name, publisher: game.involved_companies?.find(value => value.publisher)?.company.name, genres: game.genres?.map(value => value.name), coverUrl: game.cover ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg` : undefined, coverWidth: game.cover?.width, coverHeight: game.cover?.height, license: 'Twitch Developer Service Agreement', attribution: 'Données et visuel : IGDB'};
  }
}
