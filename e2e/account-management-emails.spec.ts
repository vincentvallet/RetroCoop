import {expect,test,type BrowserContext,type Page} from '@playwright/test';
import {Prisma,PrismaClient} from '@prisma/client';

test.describe.configure({mode:'serial',timeout:120_000});

async function register(context:BrowserContext,prefix:string){
  const page=await context.newPage(),stamp=`${Date.now()}${Math.floor(Math.random()*10000)}`,email=`${prefix}-${stamp}@retrocoop.test`,username=`${prefix}${stamp}`.slice(0,24),password='Test-pass-2026!';
  await page.goto('/inscription');const question=await page.getByText(/Combien font \d+ \+ \d+/).textContent(),values=question!.match(/\d+/g)!.map(Number);
  await page.getByLabel('Email').fill(email);await page.getByLabel('Pseudo').fill(username);await page.getByLabel('Mot de passe').fill(password);await page.getByLabel(/Combien font/).fill(String(values[0]+values[1]));await page.getByRole('checkbox').check();const pending=page.waitForResponse(response=>response.url().endsWith('/api/auth/register')&&response.request().method()==='POST');await page.getByRole('button',{name:'Créer mon compte'}).click();const response=await pending,body=await response.json();expect(response.status(),JSON.stringify(body)).toBe(201);await expect(page).toHaveURL(/\/catalogue\?notice=registered/);
  return{page,email,username,password};
}

async function login(page:Page,email:string,password:string){await page.goto('/connexion');await page.getByLabel('Email').fill(email);await page.getByLabel('Mot de passe').fill(password);await page.getByRole('button',{name:'Se connecter'}).click()}

async function createSession(page:Page){
  await page.goto('/sessions/nouvelle');await page.getByLabel('Jeu').pressSequentially('Streets of Rage 3');await page.getByRole('option',{name:/Streets of Rage 3/}).click();
  await page.getByLabel('Date',{exact:true}).fill(new Date(Date.now()+4*86400000).toISOString().slice(0,10));await page.getByLabel('Heure',{exact:true}).fill('20:00');await page.getByLabel('Nombre maximum de joueurs').fill('4');
  const pending=page.waitForResponse(response=>response.url().endsWith('/api/sessions')&&response.request().method()==='POST');await page.getByRole('button',{name:'Publier la session'}).click();const response=await pending;expect(response.status()).toBe(201);return(await response.json()).session.id as string;
}

async function expectDelivery(prisma:PrismaClient,where:Prisma.EmailDeliveryWhereInput,count=1){await expect.poll(()=>prisma.emailDelivery.count({where}),{timeout:15_000}).toBe(count)}

test('compte, sessions révoquées et quatre emails transactionnels',async({browser,browserName})=>{
  test.skip(browserName!=='chromium','Parcours transactionnel exécuté une fois sur Chromium.');
  const prisma=new PrismaClient(),contextA=await browser.newContext(),otherA=await browser.newContext(),contextB=await browser.newContext();let sessionId:string|undefined,userAId:string|undefined,userBId:string|undefined;let aEmail='',bEmail='';
  try{
    const a=await register(contextA,'accthost');aEmail=a.email;const userA=await prisma.user.findUniqueOrThrow({where:{email:a.email}});userAId=userA.id;
    await expectDelivery(prisma,{eventType:'WELCOME',idempotencyKey:`welcome:${userA.id}`});
    const otherPage=await otherA.newPage();await login(otherPage,a.email,a.password);await expect(otherPage).toHaveURL(/\/catalogue/);await expectDelivery(prisma,{eventType:'WELCOME',userId:userA.id});

    await a.page.goto('/compte');await expect(a.page.getByRole('heading',{name:'Mon profil'})).toBeVisible();const renamed=`Hôte${Date.now()}`.slice(0,24);await a.page.getByLabel('Changer mon pseudo').fill(renamed);await a.page.getByRole('button',{name:'Mettre à jour le pseudo'}).click();await expect(a.page.getByText('Votre pseudo a été mis à jour.')).toBeVisible();
    const preferences=a.page.locator('section').filter({has:a.page.getByRole('heading',{name:'Préférences de notifications'})});await preferences.getByLabel(/rejoint/).uncheck();await preferences.getByLabel(/quitte/).uncheck();await preferences.getByRole('button',{name:'Enregistrer les préférences'}).click();await expect(preferences.getByText('Vos préférences de notifications ont été enregistrées.')).toBeVisible();expect(await prisma.user.findUnique({where:{id:userA.id},select:{joinEmailEnabled:true,leaveEmailEnabled:true}})).toEqual({joinEmailEnabled:false,leaveEmailEnabled:false});await preferences.getByLabel(/rejoint/).check();await preferences.getByLabel(/quitte/).check();await preferences.getByRole('button',{name:'Enregistrer les préférences'}).click();

    const security=a.page.locator('section').filter({has:a.page.getByRole('heading',{name:'Sécurité'})}),newPassword='Nouveau-pass-2026!';await security.getByLabel('Mot de passe actuel').fill(a.password);await security.getByLabel('Nouveau mot de passe',{exact:true}).fill(newPassword);await security.getByLabel('Confirmer le nouveau mot de passe',{exact:true}).fill(newPassword);await security.getByRole('button',{name:'Changer mon mot de passe'}).click();await expect(security.getByText(/Vos autres sessions ont été déconnectées/)).toBeVisible();expect((await otherPage.request.get('/api/sessions?mine=1')).status()).toBe(401);await login(otherPage,a.email,a.password);await expect(otherPage.getByText('Identifiants incorrects.')).toBeVisible();await login(otherPage,a.email,newPassword);await expect(otherPage).toHaveURL(/\/catalogue/);

    sessionId=await createSession(a.page);const b=await register(contextB,'acctplayer');bEmail=b.email;const userB=await prisma.user.findUniqueOrThrow({where:{email:b.email}});userBId=userB.id;await expectDelivery(prisma,{eventType:'WELCOME',userId:userB.id});
    expect((await b.page.request.post(`/api/sessions/${sessionId}/join`)).status()).toBe(201);await expectDelivery(prisma,{eventType:'PARTICIPANT_JOINED',sessionId,userId:userA.id});expect((await b.page.request.post(`/api/sessions/${sessionId}/join`)).status()).toBe(409);await expectDelivery(prisma,{eventType:'PARTICIPANT_JOINED',sessionId,userId:userA.id});
    const message=await b.page.request.post(`/api/sessions/${sessionId}/messages`,{data:{content:'Message conservé pour modération',clientRequestId:crypto.randomUUID()}});expect(message.status()).toBe(201);
    expect((await b.page.request.delete(`/api/sessions/${sessionId}/join`)).status()).toBe(200);await expectDelivery(prisma,{eventType:'PARTICIPANT_LEFT',sessionId,userId:userA.id});expect((await b.page.request.delete(`/api/sessions/${sessionId}/join`)).status()).toBe(409);await expectDelivery(prisma,{eventType:'PARTICIPANT_LEFT',sessionId,userId:userA.id});expect(await prisma.notification.count({where:{type:'SESSION_PARTICIPANT_LEFT',sessionId,actorId:userB.id,recipientId:userA.id}})).toBe(1);
    expect((await b.page.request.post(`/api/sessions/${sessionId}/join`)).status()).toBe(201);await b.page.goto('/compte');const sensitive=b.page.locator('section').filter({has:b.page.getByRole('heading',{name:'Zone sensible'})});await sensitive.getByLabel('Mot de passe actuel').fill(b.password);await sensitive.getByLabel('Saisissez SUPPRIMER').fill('SUPPRIMER');await sensitive.getByRole('checkbox').check();b.page.once('dialog',dialog=>dialog.accept());await sensitive.getByRole('button',{name:'Supprimer définitivement mon compte'}).click();await expect(b.page).toHaveURL(/\/?notice=account-deleted/);
    const deleted=await prisma.user.findUniqueOrThrow({where:{id:userB.id}});expect(deleted.status).toBe('DELETED');expect(deleted.email).not.toBe(b.email);expect(deleted.email).toMatch(/@invalid\.local$/);expect(deleted.username).toMatch(/^__deleted__/);await expectDelivery(prisma,{eventType:'ACCOUNT_DELETED',userId:userB.id});await login(b.page,b.email,b.password);await expect(b.page.getByText('Identifiants incorrects.')).toBeVisible();
    const messages=await a.page.request.get(`/api/sessions/${sessionId}/messages`).then(response=>response.json());expect(JSON.stringify(messages)).not.toContain(b.email);expect(messages.messages.some((item:{author:{username:string}})=>item.author.username==='Utilisateur supprimé')).toBe(true);
  }finally{
    if(sessionId)await prisma.gameSession.deleteMany({where:{id:sessionId}});const ids=[userAId,userBId].filter(Boolean) as string[];if(ids.length){await prisma.emailDelivery.deleteMany({where:{userId:{in:ids}}});await prisma.accountSecurityEvent.deleteMany({where:{userId:{in:ids}}});await prisma.user.deleteMany({where:{id:{in:ids}}})}if(aEmail||bEmail)await prisma.registrationAttempt.deleteMany({where:{emailNormalized:{in:[aEmail,bEmail].filter(Boolean)}}});await prisma.$disconnect();await Promise.all([contextA.close(),otherA.close(),contextB.close()]);
  }
});
