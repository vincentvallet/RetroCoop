export const legalRequestCategories = {
  GENERAL: 'Question générale',
  ACCOUNT: 'Problème de compte',
  PERSONAL_DATA: 'Données personnelles',
  CONTENT_REPORT: 'Signalement de contenu',
  COPYRIGHT: 'Atteinte aux droits d’auteur',
  SECURITY: 'Problème de sécurité',
  OTHER: 'Autre',
} as const;

export type LegalRequestCategory = keyof typeof legalRequestCategories;

export function isLegalRequestCategory(value: unknown): value is LegalRequestCategory {
  return typeof value === 'string' && value in legalRequestCategories;
}
