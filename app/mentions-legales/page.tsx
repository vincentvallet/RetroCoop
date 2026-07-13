import {independenceNotice, legalConfig} from '@/lib/legal-config';

export const metadata = {title: 'Mentions légales'};

export default function LegalNotice() {
  return <main className="section wrap legal-page">
    <h1>Mentions légales</h1>
    <h2>Éditeur</h2>
    <p>RetroCoop est un service expérimental gratuit édité par OFID.</p>
    <p><strong>{legalConfig.publisherFullName}</strong><br/>SIRET : {legalConfig.siret}<br/>Numéro de déclaration d’activité : {legalConfig.activityDeclarationNumber}<br/>Numéro de TVA intracommunautaire : {legalConfig.vatNumber}</p>
    <p>Directeur de la publication : {legalConfig.publicationDirector}<br/>Contact : <a href={`mailto:${legalConfig.contactEmail}`}>{legalConfig.contactEmail}</a></p>

    <h2>Hébergement</h2>
    <p>L’application est hébergée par Render, service exploité par Render Services, Inc. Les informations actuelles de l’hébergeur sont publiées sur son <a href="https://render.com/terms" rel="noreferrer">site officiel</a>.</p>

    <h2>Propriété intellectuelle</h2>
    <p>Les éléments propres à RetroCoop, notamment son code spécifique, son interface, ses textes originaux et son identité visuelle propre, sont protégés conformément aux règles applicables.</p>
    <p>Les marques, titres de jeux, noms de plateformes, jaquettes, captures et autres contenus appartenant à des tiers restent la propriété de leurs ayants droit respectifs.</p>
    <p>Leur présence éventuelle dans le catalogue ne constitue pas une revendication de propriété, une affiliation, une autorisation, un partenariat ou une approbation par leurs titulaires.</p>

    <h2>Indépendance</h2>
    <p>{independenceNotice}</p>

    <h2>Absence de vente</h2>
    <p>RetroCoop est proposé gratuitement et ne vend aucune ROM, aucun BIOS, aucun jeu, aucune licence de jeu et aucun accès à des fichiers protégés.</p>
  </main>;
}
