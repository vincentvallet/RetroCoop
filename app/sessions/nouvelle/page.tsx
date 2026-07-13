import games from '@/data/normalized/megadrive-games.json';
import {CatalogueGame,toCatalogueGame} from '@/lib/games';
import {currentUser} from '@/lib/auth';
import {publicUsername} from '@/lib/public-user';
import Link from 'next/link';
import NewSessionForm from '@/components/NewSessionForm';
export default async function NewSession({searchParams}:{searchParams:Promise<{jeu?:string}>}){const [{jeu},user]=await Promise.all([searchParams,currentUser()]);return <main className="section wrap form-page"><h1>Proposer une partie</h1>{user?<><p>Connecté en tant que <strong>{publicUsername(user.username,user.email)}</strong>.</p><NewSessionForm games={(games as CatalogueGame[]).map(toCatalogueGame)} initialSlug={jeu}/></>:<div className="session-form"><p>La connexion est requise pour publier une session.</p><div className="auth-actions"><Link className="btn" href="/connexion?returnTo=/sessions/nouvelle">Se connecter pour publier</Link><Link href="/inscription">Créer un compte</Link></div></div>}</main>}
