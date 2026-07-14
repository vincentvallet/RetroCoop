export const legalConfig = {
  publisherName: 'OFID',
  publisherFullName: "OFID — Organisme de Formation à l’Intelligence Artificielle et au Digital",
  siret: '939 818 126 00012',
  activityDeclarationNumber: '32591338859',
  vatNumber: 'FR10939818126',
  publicationDirector: 'Vincent Vallet',
  contactEmail: process.env.LEGAL_CONTACT_EMAIL?.trim() || 'contact@ofid.fr',
  privacyContactEmail: process.env.PRIVACY_CONTACT_EMAIL?.trim() || 'contact@ofid.fr',
  rightsContactEmail: process.env.RIGHTS_CONTACT_EMAIL?.trim() || 'contact@ofid.fr',
  publicPostalAddress: null,
  defaultEmailFrom: process.env.EMAIL_FROM?.trim() || 'RetroCoop <contact@ofid.fr>',
} as const;

export const independenceNotice =
  'Les marques, titres et visuels appartiennent à leurs ayants droit respectifs. RetroCoop est un projet expérimental gratuit indépendant et sans affiliation.';

export const legalContactPublicAllowlist = [
  'GLOBAL_LAYOUT_FOOTER',
  '/cgu',
  '/contact',
  '/mentions-legales',
  '/confidentialite',
  '/respect-droits-auteur',
  '/sources-et-droits',
  '/api/legal-config',
] as const;
