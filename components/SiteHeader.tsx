import Image from 'next/image';
import Link from 'next/link';
import {currentUser} from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';

export default async function SiteHeader() {
  const user = await currentUser();
  return <header><Link className="brand" href="/"><Image src="/media/brand/logo.png" width={520} height={180} alt="Retro Coop" priority/></Link><nav aria-label="Navigation principale"><Link href="/catalogue">Catalogue</Link><Link href="/sessions">Sessions</Link><Link href="/comment-jouer">Comment jouer</Link>{user ? <div className="account-nav" aria-label={`Connecté en tant que ${user.username || user.email}`}><span>{user.username || user.email}</span><Link href="/sessions">Mes sessions</Link><LogoutButton/></div> : <Link href="/connexion">Connexion / Inscription</Link>}</nav></header>;
}
