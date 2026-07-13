import Link from 'next/link';
import Image from 'next/image';
import {CatalogueGame} from '@/lib/games';

export function GameCard({game}: {game: CatalogueGame}) {
  return <article className="card"><Link href={`/jeux/megadrive/${game.slug}`}>
    <div className="cover">
      {game.coverUrl ? <Image src={game.coverUrl} alt={game.coverAlt ?? `Jaquette de ${game.title}`} width={300} height={420} loading="lazy"/> : <span className="cover-placeholder"><span className="pixel">RETRO<br/>COOP</span><small>Jaquette indisponible</small></span>}
    </div>
    <section><h3>{game.title}</h3><small>{game.releaseYear ?? 'Année à vérifier'} · {game.playerMax ? `${game.playerMax} joueurs max.` : 'Joueurs inconnus'}</small><div>{game.coop && <span className="badge">Coop</span>}{game.versus && <span className="badge">Versus</span>}{game.genres?.[0] && <span className="badge muted">{game.genres[0]}</span>}</div></section>
  </Link></article>;
}
