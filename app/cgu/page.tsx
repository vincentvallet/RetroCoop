import {legalConfig} from '@/lib/legal-config';

export const metadata = {title: 'Conditions d’utilisation'};

export default function Terms() {
  return <main className="section wrap legal-page">
    <h1>Conditions d’utilisation</h1>
    <p>RetroCoop est un service expérimental gratuit fourni par <strong>OFID, éditeur de RetroCoop</strong>. Son utilisation implique le respect des présentes conditions, de la loi et des autres utilisateurs.</p>

    <h2>Utilisation légale des jeux</h2>
    <p>RetroCoop ne distribue aucune ROM, aucun BIOS, aucun jeu, aucune licence de jeu et ne propose aucun téléchargement de fichier protégé. Aucun fichier de jeu n’est stocké sur les serveurs de RetroCoop.</p>
    <p>L’utilisateur doit employer uniquement des fichiers qu’il est légalement autorisé à utiliser. Il lui est interdit de partager des ROM ou BIOS, de publier des liens illicites ou d’encourager leur téléchargement. Il reste responsable de la provenance et de l’utilisation de ses fichiers.</p>

    <h2>Comportement et contenus</h2>
    <p>Le harcèlement, le spam, les contenus illicites, les atteintes aux droits de tiers et les tentatives de contournement des protections sont interdits. Les messages et signalements peuvent être modérés. OFID peut supprimer un contenu litigieux, suspendre les fonctions de communication ou désactiver un compte lorsque cela est nécessaire.</p>

    <h2>Retrait et suppression</h2>
    <p>OFID traite les signalements relatifs aux contenus et peut procéder rapidement à leur retrait lorsqu’une demande suffisamment précise le justifie. Un utilisateur peut demander la suppression de son compte et des données associées, sous réserve des obligations de conservation applicables.</p>

    <h2>Contact</h2>
    <p>Pour toute question relative au fonctionnement du service, à un compte, à la protection des données ou à un contenu susceptible de porter atteinte à des droits, l’utilisateur peut contacter OFID à l’adresse <a href={`mailto:${legalConfig.contactEmail}`}>{legalConfig.contactEmail}</a>.</p>
  </main>;
}
