import gamesData from '@/data/normalized/megadrive-games.json';
import {GameCard} from '@/components/GameCard';
import {CatalogueGame, normalizeGameTitle} from '@/lib/games';
import Link from 'next/link';

const games = gamesData as CatalogueGame[];
const featuredGameTitles = [
  'Streets of Rage 3',
  'Street Fighter II',
  'World of Illusion Starring Mickey Mouse and Donald Duck',
  'FIFA Soccer 95',
  'Pete Sampras Tennis',
  'NBA Jam Tournament Edition',
];

function findFeatured(title: string) {
  const wanted = normalizeGameTitle(title);
  return games.find(game => normalizeGameTitle(game.title) === wanted)
    ?? games.find(game => normalizeGameTitle(game.title).startsWith(wanted));
}

export default function Home() {
  const featured = featuredGameTitles.map(findFeatured).filter((game): game is CatalogueGame => Boolean(game));
  return <main>
    <div className="hero">
      <article>
        <h1>Proposez un jeu, fixez une date, jouez ensemble</h1>
        <p>Redécouvrez les jeux rétro et trouvez des partenaires de jeu</p>
        <Link className="btn" href="/catalogue">Explorer les jeux coop MD</Link>
      </article>
    </div>
    <section className="catalogue-counter" aria-label="Nombre de jeux coop MD">
      <strong>Explorez {games.length} jeux Mega Drive multijoueurs</strong>
      <span>À 2 joueurs ou plus</span>
    </section>
    <section className="section wrap">
      <h2>À redécouvrir ensemble</h2>
      <p className="section-intro">Une sélection éditoriale de classiques à partager.</p>
      <div className="grid">{featured.map(game => <GameCard key={game.slug} game={game}/>)}</div>
    </section>
    <section className="section wrap session-cta">
      <div><h2>Une partie en vue ?</h2><p>Proposez un créneau en ligne et retrouvez vos partenaires de jeu</p></div>
      <Link className="btn" href="/sessions/nouvelle">Créer une session</Link>
    </section>
  </main>;
}
