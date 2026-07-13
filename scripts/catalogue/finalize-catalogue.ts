import fs from 'node:fs';
import path from 'node:path';

type Game={slug:string;title:string;description?:string|null;coverUrl?:string|null;gameplayImages?:Array<{path:string}>;[key:string]:unknown};
const root=process.cwd(),catalogueFile=path.join(root,'data/normalized/megadrive-games.json');
const games=JSON.parse(fs.readFileSync(catalogueFile,'utf8')) as Game[];
const decisions=[
  ['hardball-ii','HardBall II','https://en.wikipedia.org/wiki/HardBall_II','MS-DOS (et micro-ordinateurs), pas Mega Drive ; HardBall! est déjà présent.'],
  ['john-barnes-european-football','John Barnes European Football','https://www.mobygames.com/game/13068/john-barnes-european-football/releases/amiga/','Amiga, Amiga CD32 et Atari ST, pas Mega Drive.'],
  ['manchester-united-championship-soccer','Manchester United Championship Soccer','https://en.wikipedia.org/wiki/Manchester_United_Championship_Soccer','Jeu Super NES, pas Mega Drive.'],
  ['manchester-united-europe','Manchester United Europe','https://en.wikipedia.org/wiki/Manchester_United_Europe','Jeu micro-ordinateurs et Lynx ; European Club Soccer, déjà présent, est le jeu Mega Drive fondé sur ce titre.'],
  ['manchester-united-premier-league-champions','Manchester United Premier League Champions','https://www.mobygames.com/game/16109/manchester-united-premier-league-champions/credits/','Amiga, Amiga CD32 et DOS, pas Mega Drive.'],
  ['nfl-quarterback-club-97','NFL Quarterback Club 97','https://www.mobygames.com/game/39504/nfl-quarterback-club/','Sorti sur DOS, PlayStation et Saturn ; NFL Quarterback Club 96 est la dernière édition Mega Drive et existe déjà.'],
  ['olympic-hockey-98','Olympic Hockey 98','https://www.mobygames.com/game/55764/olympic-hockey-98/','Jeu Nintendo 64 uniquement, sans version Mega Drive.'],
  ['olympic-soccer','Olympic Soccer','https://www.segaretro.org/List_of_Saturn_games_in_Germany','Jeu Saturn (également paru sur PlayStation/3DO), sans version Mega Drive.'],
  ['trivial-pursuit-genus-edition','Trivial Pursuit: Genus Edition','https://www.mobygames.com/game/trivial-pursuit','Version Sega sur Master System, pas Mega Drive.'],
  ['wheel-of-fortune-deluxe-edition','Wheel of Fortune: Deluxe Edition','https://snescentral.com/article.php?id=0753','Deluxe Edition est une version Super NES ; Wheel of Fortune est déjà présent sur Mega Drive.'],
  ['wimbledon-championship-tennis-ii','Wimbledon Championship Tennis II','https://www.mobygames.com/group/10982/wimbledon-series/','Wimbledon II est Master System ; Wimbledon Championship Tennis est déjà présent sur Mega Drive.'],
] as const;
const removed=new Set<string>(decisions.map(item=>item[0]));
const kept=games.filter(game=>!removed.has(game.slug));
const artificial=/est un jeu de .* sur Mega Drive conçu pour|Son intérêt sur Retro Coop tient à|Cette fiche met en avant les conditions de jeu en groupe/i;
const descriptionAudit=kept.map(game=>{const oldDescription=game.description??null;const generated=Boolean(oldDescription&&artificial.test(oldDescription));if(generated){game.description=null;game.descriptionSourceType=null;game.descriptionSourceUrl=null;game.descriptionSourceLanguage=null;game.descriptionAdaptedToFrench=false;game.descriptionVerifiedPlatform=null;}return{title:game.title,slug:game.slug,coverUrl:game.coverUrl??null,oldDescription,newDescription:game.description??null,generatedDescriptionDetected:generated,sourceType:game.descriptionSourceType??null,sourceUrl:game.descriptionSourceUrl??null,warning:game.descriptionSourceUrl?null:'Source historique à rechercher et valider'};});
fs.writeFileSync(catalogueFile,JSON.stringify(kept,null,2)+'\n');
fs.mkdirSync(path.join(root,'reports/catalogue'),{recursive:true});fs.mkdirSync(path.join(root,'reports/media'),{recursive:true});
const titleReport={generatedAt:new Date().toISOString(),initialEntries:games.length,finalEntries:kept.length,decisions:decisions.map(([slug,title,sourceUrl,reason])=>({slug,title,decision:'wrong-platform-entry-removed',sourceUrl,reason}))};
fs.writeFileSync(path.join(root,'reports/catalogue/platform-title-decisions.json'),JSON.stringify(titleReport,null,2)+'\n');
fs.writeFileSync(path.join(root,'reports/catalogue/historical-descriptions-audit.json'),JSON.stringify(descriptionAudit,null,2)+'\n');
fs.writeFileSync(path.join(root,'reports/catalogue/historical-descriptions-missing.json'),JSON.stringify(descriptionAudit.filter(item=>!item.sourceUrl),null,2)+'\n');
const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
fs.writeFileSync(path.join(root,'reports/catalogue/historical-descriptions-review.html'),`<!doctype html><meta charset="utf-8"><title>Audit descriptions historiques</title><style>body{font:15px system-ui;max-width:1200px;margin:auto;padding:2rem}article{display:grid;grid-template-columns:100px 1fr 1fr;gap:1rem;border-bottom:1px solid #bbb;padding:1rem 0}img{max-width:90px}.warn{color:#9a3412}</style><h1>Audit des descriptions historiques</h1><p>${descriptionAudit.filter(x=>x.sourceUrl).length}/${kept.length} descriptions historiquement sourcées. Les textes artificiels ont été retirés du catalogue, sans fausse attribution.</p>${descriptionAudit.map(x=>`<article>${x.coverUrl?`<img src="../..${esc(x.coverUrl)}" alt="">`:'<span>Sans jaquette</span>'}<section><h2>${esc(x.title)}</h2><h3>Ancienne description</h3><p>${esc(x.oldDescription)}</p></section><section><h3>Nouvelle description</h3><p>${esc(x.newDescription)||'À sourcer'}</p><p>Source : ${x.sourceUrl?`<a href="${esc(x.sourceUrl)}">${esc(x.sourceType)}</a>`:'aucune'}</p><p class="warn">${esc(x.warning)}</p></section></article>`).join('')}`);
console.log(JSON.stringify({initialGames:games.length,finalGames:kept.length,wrongPlatformEntriesRemoved:games.length-kept.length,artificialDescriptionsRemoved:descriptionAudit.filter(x=>x.generatedDescriptionDetected).length,historicallySourcedDescriptions:descriptionAudit.filter(x=>x.sourceUrl).length},null,2));
