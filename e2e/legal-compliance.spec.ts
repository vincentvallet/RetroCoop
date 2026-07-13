import {expect, test} from '@playwright/test';
import {PrismaClient} from '@prisma/client';

test('pages OFID, footer, confidentialité et formulaire de retrait', async ({page}) => {
  await page.goto('/mentions-legales');
  await expect(page.getByRole('heading', {name: 'Mentions légales'})).toBeVisible();
  await expect(page.getByText('OFID — Organisme de Formation à l’Intelligence Artificielle et au Digital')).toBeVisible();
  await expect(page.getByText('SIRET : 939 818 126 00012')).toBeVisible();
  await expect(page.getByText('Numéro de déclaration d’activité : 32591338859')).toBeVisible();
  await expect(page.getByText('Numéro de TVA intracommunautaire : FR10939818126')).toBeVisible();
  await expect(page.getByText('Directeur de la publication : Vincent Vallet')).toBeVisible();
  await expect(page.getByText('Contact : contact@ofid.fr', {exact: true}).first()).toBeVisible();
  await expect(page.getByText(/Adresse disponible sur demande/i)).toHaveCount(0);

  const footer = page.locator('footer');
  await expect(footer.getByText('Les marques, titres et visuels appartiennent à leurs ayants droit respectifs. RetroCoop est un projet expérimental gratuit indépendant et sans affiliation.')).toBeVisible();
  for (const label of ['Conditions d’utilisation', 'Confidentialité', 'Mentions légales', 'Respect des droits d’auteur', 'Signaler une atteinte aux droits']) await expect(footer.getByRole('link', {name: label})).toBeVisible();

  await page.goto('/confidentialite');
  await expect(page.getByRole('main').getByText(/Contact relatif aux données personnelles : contact@ofid\.fr/)).toBeVisible();
  await expect(page.getByText(/PostgreSQL est fournie par Neon/)).toBeVisible();

  const requesterEmail = `rights-${Date.now()}@example.test`;
  const prisma = new PrismaClient();
  try {
    await page.goto('/signalement-droits');
    await page.getByLabel('Email de réponse').fill(requesterEmail);
    await page.getByLabel('URL concernée').fill('https://retrocoop.onrender.com/jeux/megadrive/streets-of-rage-3');
    await page.getByLabel('Votre demande').fill('Je demande l’examen de cette fiche et de sa jaquette pour vérifier mes droits.');
    await page.getByRole('button', {name: 'Envoyer la demande'}).click();
    await expect(page.getByRole('status')).toContainText('Votre demande a été enregistrée.');
    const stored = await prisma.legalRequest.findFirst({where: {requesterEmail}});
    expect(stored?.category).toBe('COPYRIGHT');
    expect(stored?.subject).toContain('[RETROCOOP — DEMANDE DE RETRAIT]');
  } finally {
    await prisma.legalRequest.deleteMany({where: {requesterEmail}});
    await prisma.$disconnect();
  }
});
