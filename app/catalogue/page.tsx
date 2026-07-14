import games from '@/data/normalized/megadrive-games.json';
import {CatalogueClient} from '@/components/CatalogueClient';
import {CatalogueGame, toCatalogueGame} from '@/lib/games';

export const metadata = {
  title: 'Jeux coop MD',
  description: 'Découvrez les jeux coopératifs et multijoueurs Mega Drive proposés sur RetroCoop.',
};

export default function Catalogue() {
  const catalogue = (games as CatalogueGame[]).map(toCatalogueGame);
  return <main className="section wrap"><h1>Jeux coop MD</h1><CatalogueClient games={catalogue}/></main>;
}
