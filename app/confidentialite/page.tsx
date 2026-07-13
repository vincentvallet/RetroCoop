import Link from 'next/link';
import {legalConfig} from '@/lib/legal-config';

export const metadata = {title: 'Politique de confidentialité'};

export default function Privacy() {
  return <main className="section wrap legal-page">
    <h1>Politique de confidentialité</h1>
    <h2>Responsable du traitement</h2>
    <p><strong>{legalConfig.publisherFullName}</strong><br/>SIRET : {legalConfig.siret}<br/>Contact relatif aux données personnelles : <a href={`mailto:${legalConfig.privacyContactEmail}`}>{legalConfig.privacyContactEmail}</a></p>

    <h2>Données traitées</h2>
    <p>Selon les fonctions utilisées, RetroCoop traite l’email privé de connexion, le pseudo, le hash du mot de passe, les sessions de jeu, les participations, les messages, les notifications, les signalements, les actions de modération, les préférences de notification, les données techniques antiflood, les journaux de sécurité et les demandes relatives aux droits d’auteur ou aux données personnelles.</p>
    <p>L’email de connexion est une donnée privée. Il n’est jamais utilisé comme pseudo, identité visible ou fallback public.</p>

    <h2>Finalités et bases</h2>
    <ul>
      <li>fournir les comptes, sessions et communications demandés par l’utilisateur ;</li>
      <li>sécuriser le service, limiter les abus et assurer la modération ;</li>
      <li>envoyer les notifications choisies par l’utilisateur ;</li>
      <li>traiter les demandes légales, de retrait et d’exercice des droits.</li>
    </ul>

    <h2>Destinataires et prestataires</h2>
    <p>Les données nécessaires sont hébergées par <a href="https://render.com/privacy" rel="noreferrer">Render</a>, exploité par Render Services, Inc., et la base PostgreSQL est fournie par <a href="https://neon.com/platform-terms" rel="noreferrer">Neon, LLC</a>. Resend intervient uniquement lorsque l’envoi transactionnel est configuré.</p>

    <h2>Durées et sécurité</h2>
    <p>Les données sont conservées pendant la durée nécessaire au fonctionnement du compte, à la sécurité, au traitement des demandes et au respect des obligations applicables. Les mots de passe sont hachés, les accès sont contrôlés et les données techniques antiflood sont pseudonymisées.</p>

    <h2>Vos droits</h2>
    <p>Vous pouvez contacter OFID à l’adresse <a href={`mailto:${legalConfig.privacyContactEmail}`}>{legalConfig.privacyContactEmail}</a> en précisant l’objet de votre demande et les éléments nécessaires pour identifier votre compte.</p>
    <p>Vous pouvez aussi utiliser le <Link href="/contact?category=PERSONAL_DATA">formulaire sécurisé relatif aux données personnelles</Link>, accessible depuis votre compte.</p>
  </main>;
}
