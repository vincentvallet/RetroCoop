import {test, expect} from '@playwright/test';
import {PrismaClient} from '@prisma/client';

test('accueil et sélection éditoriale', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', {level: 1})).toHaveText('Proposez un jeu, fixez une date, jouez ensemble');
  await expect(page.getByText('Explorez 371 jeux Mega Drive multijoueurs')).toBeVisible();
  const cards = page.locator('.card h3');
  await expect(cards).toHaveCount(6);
  await expect(cards.first()).toHaveText('Streets of Rage 3');
  const covers = page.locator('.card img[alt^="Jaquette de "]');
  await expect(covers).toHaveCount(6);
  await expect(page.locator('img[src^="http"]')).toHaveCount(0);
});

test('navigation renommée et page d’organisation sur ordinateur et mobile', async ({page}) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({width, height: 844});
    await page.goto('/');
    const navigation = page.getByRole('navigation', {name: 'Navigation principale'});
    await expect(navigation.getByRole('link', {name: 'Jeux coop MD'})).toHaveAttribute('href', '/catalogue');
    await expect(navigation.getByRole('link', {name: 'Organiser une session'})).toHaveAttribute('href', '/comment-jouer');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }

  await page.goto('/catalogue');
  await expect(page.getByRole('heading', {level: 1, name: 'Jeux coop MD'})).toBeVisible();
  await expect(page).toHaveTitle(/Jeux coop MD/);

  await page.goto('/comment-jouer');
  await expect(page.getByRole('heading', {level: 1, name: 'Organiser une session'})).toBeVisible();
  await expect(page).toHaveTitle(/Organiser une session/);
  await expect(page.getByText('RetroCoop ne fournit et n’héberge aucun jeu, aucune ROM et aucun BIOS.', {exact: false})).toBeVisible();
  const externalLink = page.getByRole('link', {name: /Découvrir l’interface/});
  await expect(externalLink).toHaveAttribute('href', 'https://partigo-retro-online.onrender.com');
  await expect(externalLink).toHaveAttribute('target', '_blank');
  await expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
});

test('jaquette locale reste lisible en mobile', async ({page}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/jeux/megadrive/streets-of-rage-3');
  await expect(page.getByRole('img', {name: 'Jaquette de Streets of Rage 3'})).toBeVisible();
  await expect(page.locator('img[src^="http"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('une jaquette rattrapée est servie localement', async ({page}) => {
  await page.goto('/jeux/megadrive/action-52');
  await expect(page.getByRole('img', {name: 'Jaquette de Action 52'})).toBeVisible();
  await expect(page.locator('img[src^="http"]')).toHaveCount(0);
});

test('catalogue : recherche, année et fiche', async ({page}) => {
  await page.goto('/catalogue');
  await expect(page.getByLabel('Décennie')).toHaveCount(0);
  await expect(page.getByLabel('Année')).toBeVisible();
  await page.getByLabel('Rechercher').pressSequentially('stre');
  await expect(page.getByRole('option', {name: /Streets of Rage 3/})).toBeVisible();
  await page.getByLabel('Rechercher').press('Escape');
  await page.getByLabel('Rechercher').fill('');
  await page.getByTestId('year-filter').selectOption('1994');
  await expect(page.getByText(/jeux affichés sur 371/)).toBeVisible();
  await page.getByLabel('Rechercher').pressSequentially('Streets of Rage 3');
  await page.getByRole('option', {name: /Streets of Rage 3/}).click();
  await expect(page).toHaveURL(/\/jeux\/megadrive\/streets-of-rage-3/);
});

test('création de session exclusivement en ligne', async ({page}) => {
  await page.goto('/sessions/nouvelle?jeu=streets-of-rage-3');
  await expect(page.getByText('La connexion est requise pour publier une session.')).toBeVisible();
  await expect(page.getByText('Local', {exact: true})).toHaveCount(0);
  await expect(page.getByRole('link',{name:'Se connecter pour publier'})).toHaveAttribute('href','/connexion?returnTo=/sessions/nouvelle');
});

test('health', async ({page}) => expect((await page.request.get('/api/health')).ok()).toBeTruthy());

test('catalogue complet, galerie et redirection du classement', async ({page}) => {
  await page.goto('/catalogue');
  await expect(page.locator('.catalogue-grid .card')).toHaveCount(371);
  await expect(page.getByRole('button',{name:/charger/i})).toHaveCount(0);
  await page.goto('/jeux/megadrive/streets-of-rage-3');
  await expect(page.getByRole('heading',{name:'Aperçu du gameplay'})).toBeVisible();
  await page.getByRole('button',{name:'Agrandir la capture 1 de Streets of Rage 3'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/classement');
  await expect(page).toHaveURL(/\/catalogue\?sort=most-played/);
});

test('inscription lisible aux quatre largeurs demandées',async({page})=>{for(const width of [320,375,768,1440]){await page.setViewportSize({width,height:900});await page.goto('/inscription');await expect(page.locator('.auth-card')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)}});

test('parcours complet : inscription, persistance, publication, déconnexion et reconnexion', async ({page}) => {
  const stamp=Date.now();
  const email=`e2e-${stamp}@retrocoop.test`,username=`e2e${stamp}`.slice(0,24);
  await page.goto('/');
  await expect(page.getByRole('link',{name:'Connexion / Inscription'})).toBeVisible();
  await page.getByRole('link',{name:'Connexion / Inscription'}).click();
  await expect(page.getByRole('link',{name:'Créer un compte'})).toBeVisible();
  await page.getByRole('link',{name:'Créer un compte'}).click();
  await expect(page.getByLabel('Nom affiché')).toHaveCount(0);
  const card=page.locator('.auth-card');await expect(card).toBeVisible();
  const colors=await card.evaluate(element=>{const style=getComputedStyle(element);return{color:style.color,background:style.backgroundColor,width:element.getBoundingClientRect().width}});
  expect(colors.color).not.toBe(colors.background);expect(colors.width).toBeLessThanOrEqual(448);
  const question=await page.getByText(/Combien font \d+ \+ \d+/).textContent();
  const values=question!.match(/\d+/g)!.map(Number);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Pseudo').fill(username);
  await page.getByLabel('Mot de passe').fill('Test-pass-2026!');
  await page.getByLabel(/Combien font/).fill(String(values[0]+values[1]));
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:'Créer mon compte'}).click();
  await expect(page).toHaveURL(/\/catalogue\?notice=registered/);
  await expect(page.getByText('Votre compte a bien été créé. Vous êtes maintenant connecté.')).toBeVisible();
  await expect(page.getByText(username,{exact:true})).toBeVisible();
  await page.reload();await expect(page.getByText(username,{exact:true})).toBeVisible();
  await page.goto('/sessions/nouvelle');await expect(page.getByRole('button',{name:'Publier la session'})).toBeVisible();
  await page.getByLabel('Jeu').pressSequentially('Streets of Rage 3');await page.getByRole('option',{name:/Streets of Rage 3/}).click();
  const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);await page.getByLabel('Date',{exact:true}).fill(tomorrow);await page.getByLabel('Heure',{exact:true}).fill('20:00');
  await page.getByRole('button',{name:'Publier la session'}).click();await expect(page).toHaveURL(/\/sessions\/[^/]+\?notice=session-published/);await expect(page.getByText('Votre session a bien été publiée.')).toBeVisible();await expect(page.getByText('Vous organisez cette session.')).toBeVisible();
  const prisma=new PrismaClient();const stored=await prisma.gameSession.findFirst({where:{host:{email}},include:{participants:true}});await prisma.$disconnect();expect(stored?.participants).toHaveLength(1);
  await page.getByRole('button',{name:'Se déconnecter'}).click();await expect(page.getByRole('link',{name:'Connexion / Inscription'})).toBeVisible();
  await page.goto('/connexion?returnTo=/sessions/nouvelle');await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mot de passe').fill('Test-pass-2026!');
  await page.getByRole('button',{name:'Se connecter'}).click();
  await expect(page).toHaveURL(/\/sessions\/nouvelle\?notice=login/);await expect(page.locator('.account-nav').getByText(username,{exact:true})).toBeVisible();
});
