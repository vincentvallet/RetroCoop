import games from '@/data/normalized/megadrive-games.json';
import {CatalogueClient} from '@/components/CatalogueClient';
import {CatalogueGame, toCatalogueGame} from '@/lib/games';

export default async function Catalogue({searchParams}:{searchParams:Promise<{sort?:string}>}) {
  const catalogue = (games as CatalogueGame[]).map(toCatalogueGame);
  const {sort}=await searchParams;
  return <main className="section wrap"><h1>Catalogue</h1><CatalogueClient games={catalogue} initialSort={sort}/></main>;
}
