import LegalRequestForm from '@/components/LegalRequestForm';
import {legalConfig} from '@/lib/legal-config';

export const metadata = {title: 'Signaler une atteinte aux droits'};

export default function RightsReport() {
  return <main className="section wrap legal-page">
    <h1>Signaler une atteinte aux droits</h1>
    <p>Décrivez précisément le contenu concerné, l’URL, la nature de vos droits et la mesure demandée. OFID pourra vous demander les éléments nécessaires pour vérifier la demande.</p>
    <p>Contact relatif aux droits d’auteur : <a href={`mailto:${legalConfig.rightsContactEmail}`}>{legalConfig.rightsContactEmail}</a>.</p>
    <LegalRequestForm defaultCategory="COPYRIGHT" defaultSubject="[RETROCOOP — DEMANDE DE RETRAIT] "/>
  </main>;
}
