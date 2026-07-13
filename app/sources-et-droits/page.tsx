import Link from 'next/link';
import {independenceNotice, legalConfig} from '@/lib/legal-config';

export default function Rights() {
  return <main className="section wrap legal-page">
    <h1>Sources et droits</h1>
    <p>Le catalogue initial résulte de sources locales auditées. Les jaquettes peuvent être rapprochées techniquement avec Libretro Thumbnails — Sega Mega Drive / Genesis puis hébergées localement, sans hotlinking.</p>
    <p>{independenceNotice}</p>
    <p>Pour une correction ou un retrait : <a href={`mailto:${legalConfig.rightsContactEmail}`}>{legalConfig.rightsContactEmail}</a>.</p>
    <p><Link href="/respect-droits-auteur">Consulter la procédure relative aux droits d’auteur</Link> ou <Link href="/signalement-droits">envoyer une demande de retrait</Link>.</p>
  </main>;
}
