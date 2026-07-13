import gamesData from '../data/normalized/megadrive-games.json';
import {resolveGameMediaUrl} from './media';
type CatalogueEntry={slug:string;title:string;coverUrl?:string|null};
const games=gamesData as CatalogueEntry[],bySlug=new Map(games.map(game=>[game.slug,game]));
const normalize=(value:string)=>value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').replace(/[^a-z0-9]+/g,' ').trim();
const byTitle=new Map(games.map(game=>[normalize(game.title),game]));
export function currentSessionCover(game:{slug:string;title:string}){const entry=bySlug.get(game.slug)??byTitle.get(normalize(game.title));return entry?.coverUrl?resolveGameMediaUrl(entry.coverUrl):null}
