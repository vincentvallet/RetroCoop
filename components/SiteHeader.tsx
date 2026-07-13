import Image from 'next/image';
import Link from 'next/link';
import AccountNav from '@/components/AccountNav';
export default function SiteHeader(){return <header><Link className="brand" href="/"><Image src="/media/brand/logo.png" width={520} height={180} alt="Retro Coop" priority/></Link><nav aria-label="Navigation principale"><Link href="/catalogue">Catalogue</Link><Link href="/sessions">Sessions</Link><Link href="/comment-jouer">Comment jouer</Link><AccountNav/></nav></header>}
