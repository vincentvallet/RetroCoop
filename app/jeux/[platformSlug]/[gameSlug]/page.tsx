import gamesData from '@/data/normalized/megadrive-games.json';
import {CatalogueGame} from '@/lib/games';
import {notFound} from 'next/navigation';
import {GameDetailNavigator} from '@/components/GameDetailNavigator';

const games = gamesData as CatalogueGame[];
export function generateStaticParams() { return games.map(game => ({platformSlug: 'megadrive', gameSlug: game.slug})); }

export default async function Game({params}: {params: Promise<{gameSlug: string}>}) {
  const {gameSlug} = await params;
  const game = games.find(item => item.slug === gameSlug);
  if (!game) notFound();
  return <GameDetailNavigator initialSlug={game.slug}/>;
}
