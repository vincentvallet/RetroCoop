import './globals.css';
import Link from 'next/link';
import {Suspense} from 'react';
import SiteHeader from '@/components/SiteHeader';
import Notice from '@/components/Notice';
import {independenceNotice, legalConfig} from '@/lib/legal-config';

export const metadata = {metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'), title: {default: 'Retro Coop — Jouons ensemble', template: '%s | Retro Coop'}, description: 'Jeux coop Mega Drive et rendez-vous pour jouer ensemble aux jeux rétro multijoueurs.'};

export default function Layout({children}: {children: React.ReactNode}) {
  return <html lang="fr" data-scroll-behavior="smooth"><body>
    <SiteHeader/>
    <Suspense><Notice/></Suspense>
    {children}
    <footer><div className="wrap footer-content"><p>{independenceNotice}</p><p>Contact : <a href={`mailto:${legalConfig.contactEmail}`}>{legalConfig.contactEmail}</a></p><nav aria-label="Liens légaux"><Link href="/cgu">Conditions d’utilisation</Link><Link href="/confidentialite">Confidentialité</Link><Link href="/mentions-legales">Mentions légales</Link><Link href="/respect-droits-auteur">Respect des droits d’auteur</Link></nav></div></footer>
  </body></html>;
}
