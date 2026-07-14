import {legalConfig} from '@/lib/legal-config';

export const metadata = {title: 'Respect des droits d’auteur'};

export default function CopyrightRespect() {
  return <main className="section wrap legal-page">
    <h1>Respect des droits d’auteur</h1>
    <p>RetroCoop respecte les droits des auteurs, éditeurs, marques et autres titulaires. Les contenus de tiers restent la propriété de leurs ayants droit.</p>
    <p>Un ayant droit peut demander l’examen ou le retrait d’une jaquette, d’une capture, d’un titre, d’un logo, d’une marque, d’un texte, d’une fiche, d’une URL précise ou de tout autre contenu susceptible de porter atteinte à ses droits.</p>
    <p>Contact relatif aux droits d’auteur : <a href={`mailto:${legalConfig.rightsContactEmail}`}>{legalConfig.rightsContactEmail}</a>.</p>
    <p>Objet recommandé : <code>[RETROCOOP — DEMANDE DE RETRAIT] Nom du jeu ou URL concernée</code>.</p>
  </main>;
}
