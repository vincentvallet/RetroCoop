import games from '@/data/normalized/megadrive-games.json';
import {CatalogueClient} from '@/components/CatalogueClient';
import {CatalogueGame, toCatalogueGame} from '@/lib/games';

export default function Catalogue() {
  const catalogue = (games as CatalogueGame[]).map(toCatalogueGame);
  return <main className="section wrap"><h1>Catalogue</h1><CatalogueClient games={catalogue}/></main>;
}
