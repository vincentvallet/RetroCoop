import {expect,test} from '@playwright/test';
import {PrismaClient} from '@prisma/client';

test('navigation instantanée, circulaire, filtrée et tactile',async({page})=>{
  const documentRequests:string[]=[],apiRequests:string[]=[],imageRequests:string[]=[];
  page.on('request',request=>{if(request.resourceType()==='document')documentRequests.push(request.url());if(request.url().includes('/api/games'))apiRequests.push(request.url());if(request.resourceType()==='image')imageRequests.push(request.url())});
  await page.goto('/jeux/megadrive/2020-super-baseball');
  const documentsAfterLoad=documentRequests.length;
  await expect(page.getByTestId('game-navigator')).toHaveAttribute('data-context-size','371');
  await expect.poll(()=>imageRequests.some(url=>url.endsWith('/covers/megadrive/zoom.webp'))).toBeTruthy();await expect.poll(()=>imageRequests.some(url=>url.endsWith('/gameplay/megadrive/zoom-gameplay-1.webp'))).toBeTruthy();
  await page.keyboard.press('ArrowLeft');await expect(page).toHaveURL(/\/jeux\/megadrive\/zoom$/);await expect(page.getByRole('heading',{level:1,name:'Zoom!'})).toBeVisible();
  await page.keyboard.press('ArrowRight');await expect(page).toHaveURL(/\/jeux\/megadrive\/2020-super-baseball$/);
  const average=await page.evaluate(async()=>{
    const button=document.querySelector<HTMLButtonElement>('.game-nav-arrow.next')!;let total=0;
    for(let index=0;index<20;index++){
      const heading=document.querySelector('h1')!,before=heading.textContent,start=performance.now();button.click();
      while(heading.textContent===before)await new Promise(resolve=>setTimeout(resolve,0));
      total+=performance.now()-start;
    }
    return total/20;
  });
  expect(average).toBeLessThan(150);expect(documentRequests).toHaveLength(documentsAfterLoad);expect(apiRequests).toHaveLength(0);

  await page.goto('/catalogue');await page.getByTestId('year-filter').selectOption('1994');
  const filteredCount=await page.locator('.catalogue-grid .card').count();expect(filteredCount).toBeGreaterThan(1);expect(filteredCount).toBeLessThan(371);
  await page.locator('.catalogue-grid .card a').first().click();await expect(page.getByTestId('game-navigator')).toHaveAttribute('data-context-size',String(filteredCount));
  await page.setViewportSize({width:390,height:844});await expect(page.locator('.game-nav-arrow.previous')).toBeVisible();await expect(page.locator('.game-nav-arrow.next')).toBeVisible();
  const sizes=await page.locator('.game-nav-arrow').evaluateAll(buttons=>buttons.map(button=>({width:button.getBoundingClientRect().width,height:button.getBoundingClientRect().height})));
  expect(sizes.every(size=>size.width>=44&&size.height>=44)).toBeTruthy();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('session : réponse 201, PostgreSQL, listes, rechargement et reconnexion',async({page})=>{
  const stamp=Date.now(),email=`session-${stamp}@retrocoop.test`,username=`session${stamp}`.slice(0,32),password='Test-pass-2026!';
  await page.goto('/inscription');const question=await page.getByText(/Combien font \d+ \+ \d+/).textContent(),values=question!.match(/\d+/g)!.map(Number);
  await page.getByLabel('Email').fill(email);await page.getByLabel('Pseudo').fill(username);await page.getByLabel('Mot de passe').fill(password);await page.getByLabel(/Combien font/).fill(String(values[0]+values[1]));await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Créer mon compte'}).click();await expect(page).toHaveURL(/\/catalogue\?notice=registered/);
  await page.goto('/sessions/nouvelle');await page.getByLabel('Jeu').pressSequentially('Streets of Rage 3');await page.getByRole('option',{name:/Streets of Rage 3/}).click();
  const future=new Date(Date.now()+2*86400000).toISOString().slice(0,10);await page.getByLabel('Date',{exact:true}).fill(future);await page.getByLabel('Heure',{exact:true}).fill('20:00');
  const createdResponse=page.waitForResponse(response=>response.url().endsWith('/api/sessions')&&response.request().method()==='POST');await page.getByRole('button',{name:'Publier la session'}).click();
  const response=await createdResponse;expect(response.status()).toBe(201);const created=await response.json();expect(created.success).toBe(true);expect(created.session.id).toBeTruthy();expect(created.session.status).toBe('OPEN');expect(created.session.visibility).toBe('PUBLIC');expect(created.session.timezone).toBe('Europe/Paris');
  await expect(page.locator(`[data-session-id="${created.session.id}"]`)).toBeVisible();await page.reload();await expect(page.locator(`[data-session-id="${created.session.id}"]`)).toBeVisible();
  const prisma=new PrismaClient(),stored=await prisma.gameSession.findUnique({where:{id:created.session.id},include:{participants:true,host:true}});await prisma.$disconnect();expect(stored?.host.email).toBe(email);expect(stored?.status).toBe('OPEN');expect(stored?.timezoneAtCreation).toBe('Europe/Paris');expect(stored?.participants).toHaveLength(1);
  const publicList=await page.request.get('/api/sessions'),mineList=await page.request.get('/api/sessions?mine=1');expect(publicList.ok()).toBeTruthy();expect(mineList.ok()).toBeTruthy();expect((await publicList.json()).sessions.some((item:{id:string})=>item.id===created.session.id)).toBeTruthy();expect((await mineList.json()).sessions.some((item:{id:string})=>item.id===created.session.id)).toBeTruthy();
  await page.getByRole('button',{name:'Se déconnecter'}).click();await page.goto('/connexion');await page.getByLabel('Email').fill(email);await page.getByLabel('Mot de passe').fill(password);await page.getByRole('button',{name:'Se connecter'}).click();await page.goto('/sessions');await expect(page.locator(`[data-session-id="${created.session.id}"]`)).toBeVisible();
});
