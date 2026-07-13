import './globals.css';
import Link from 'next/link';
import {Suspense} from 'react';
import SiteHeader from '@/components/SiteHeader';
import Notice from '@/components/Notice';

export const metadata = {metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'), title: {default: 'Retro Coop — Jouons ensemble', template: '%s | Retro Coop'}, description: 'Catalogue et rendez-vous pour jouer ensemble aux jeux rétro multijoueurs.'};

export default function Layout({children}: {children: React.ReactNode}) {
  return <html lang="fr"><body>
    <SiteHeader/>
    <Suspense><Notice/></Suspense>
    {children}
    <footer><div className="wrap footer-content"><p>Les marques, titres et visuels appartiennent à leurs ayants droit respectifs. Retro Coop est un projet communautaire indépendant sans affiliation avec SEGA.</p><p>Pour une correction ou un retrait : <a href="mailto:contact@retrocoop.fr">contact@retrocoop.fr</a></p><nav aria-label="Liens légaux"><Link href="/confidentialite">Confidentialité</Link><Link href="/cgu">CGU</Link></nav></div></footer>
  </body></html>;
}
