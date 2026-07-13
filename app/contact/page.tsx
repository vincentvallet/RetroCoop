import LegalRequestForm from '@/components/LegalRequestForm';
import {isLegalRequestCategory, type LegalRequestCategory} from '@/lib/legal-request-categories';
import {legalConfig} from '@/lib/legal-config';

export const metadata = {title: 'Contacter OFID'};

export default async function ContactPage({searchParams}: {searchParams: Promise<{category?: string}>}) {
  const {category} = await searchParams;
  const selected: LegalRequestCategory = isLegalRequestCategory(category) ? category : 'GENERAL';
  return <main className="section wrap legal-page">
    <h1>Contacter OFID</h1>
    <p>Utilisez ce formulaire sécurisé pour une question générale, un problème de compte, une demande relative aux données personnelles, un signalement ou un problème de sécurité.</p>
    <p>Contact institutionnel : <a href={`mailto:${legalConfig.contactEmail}`}>{legalConfig.contactEmail}</a>.</p>
    <LegalRequestForm defaultCategory={selected}/>
  </main>;
}
