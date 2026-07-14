import {expect, test} from '@playwright/test';

test('pages OFID, footer et confidentialité', async ({page}) => {
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
  for (const label of ['Conditions d’utilisation', 'Confidentialité', 'Mentions légales', 'Respect des droits d’auteur']) await expect(footer.getByRole('link', {name: label})).toBeVisible();

  await page.goto('/confidentialite');
  await expect(page.getByRole('main').getByText(/Contact relatif aux données personnelles : contact@ofid\.fr/)).toBeVisible();
  await expect(page.getByText(/PostgreSQL est fournie par Neon/)).toBeVisible();

  const deletedPage = await page.goto('/signalement-droits');
  expect(deletedPage?.status()).toBe(404);
});
