import fs from 'node:fs';
import path from 'node:path';
import {inventoryBoxarts} from './libretro';
import {regionRank} from './matcher';
import {normalizeCoverTitle,titleTokens} from './normalize-game-title';

type CatalogueGame={slug:string;title:string;aliases?:string[];releaseYear?:number|null;region?:string|null;coverUrl?:string|null;coverOrigin?:string|null;coverSourceFilename?:string|null;coverRegion?:string|null;coverMatchConfidence?:number|null};
type InitialMissing={internalId:string;catalogueTitle:string;candidates?:unknown[]};
const root=path.resolve('reports/covers');
const candidatesFile=path.join(root,'remaining-cover-candidates.json');
const manualFile=path.join(root,'manual-cover-search.json');
const catalogueFile=path.resolve('data/normalized/megadrive-games.json');
const missingFile=path.join(root,'missing-covers.json');
const aliasesFile=path.resolve('config/megadrive-cover-aliases.json');
const overridesFile=path.resolve('config/megadrive-cover-overrides.json');
const distinctive=new Set(['2','3','4','5','6','7','8','9','94','95','96','97','98','special','champion','championship','tournament','deluxe','ultimate','plus','gold']);

function writeJson(file:string,value:unknown){fs.writeFileSync(file,`${JSON.stringify(value,null,2)}\n`,'utf8');}
function escapeHtml(value:unknown){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));}
function set(input:string){return titleTokens(input);}
function intersection(a:Set<string>,b:Set<string>){return [...a].filter(token=>b.has(token));}
function difference(a:Set<string>,b:Set<string>){return [...a].filter(token=>!b.has(token));}
function jaccard(a:Set<string>,b:Set<string>){return intersection(a,b).length/Math.max(1,new Set([...a,...b]).size);}
function conflict(left:Set<string>,right:Set<string>){return difference(new Set([...left].filter(token=>distinctive.has(token))),new Set([...right].filter(token=>distinctive.has(token)))).length>0;}

async function main(){
  fs.mkdirSync(root,{recursive:true});
  const catalogue=JSON.parse(fs.readFileSync(catalogueFile,'utf8')) as CatalogueGame[];
  const aliases=fs.existsSync(aliasesFile)?JSON.parse(fs.readFileSync(aliasesFile,'utf8')) as Record<string,string[]>:{};
  const overrides=fs.existsSync(overridesFile)?JSON.parse(fs.readFileSync(overridesFile,'utf8')) as Record<string,{sourceFilename:string;reason:string}>:{};
  const currentMissing=JSON.parse(fs.readFileSync(missingFile,'utf8')) as InitialMissing[];
  const previous=fs.existsSync(candidatesFile)?JSON.parse(fs.readFileSync(candidatesFile,'utf8')) as {games:Array<{internalId:string}>}:null;
  const initialIds=previous?.games.map(game=>game.internalId)??currentMissing.map(game=>game.internalId);
  const entries=await inventoryBoxarts();
  const games=initialIds.map(internalId=>catalogue.find(game=>game.slug===internalId)).filter((game):game is CatalogueGame=>Boolean(game)).map(game=>{
    const gameTokens=set(game.title),knownAliases=[...(game.aliases??[]),...(aliases[game.slug]??[])];
    const candidates=entries.map(entry=>{
      const candidateTokens=set(entry.baseTitle),matchingTokens=intersection(gameTokens,candidateTokens),missingTokens=difference(gameTokens,candidateTokens),extraTokens=difference(candidateTokens,gameTokens);
      const exact=normalizeCoverTitle(game.title)===normalizeCoverTitle(entry.baseTitle);
      const alias=knownAliases.some(value=>normalizeCoverTitle(value)===normalizeCoverTitle(entry.baseTitle));
      const score=Math.min(1,Number((jaccard(gameTokens,candidateTokens)*.72+(exact ? .22 : 0)+(alias ? .28 : 0)+(entry.regions.length&&regionRank(entry.regions)<3 ? .04 : 0)+(entry.revision ? -.03 : .02)).toFixed(4)));
      return{sourceFilename:entry.sourceFilename,candidateTitle:entry.baseTitle,normalizedTitle:normalizeCoverTitle(entry.baseTitle),region:entry.regions,revision:entry.revision,excludedVariant:entry.excludedVariant,excludedReasons:entry.excludedReasons,validImage:entry.validImage,width:entry.width,height:entry.height,score,matchingTokens,missingTokens,extraTokens,editionConflict:conflict(gameTokens,candidateTokens),sequelConflict:conflict(gameTokens,candidateTokens),exactTitle:exact,confirmedAlias:alias};
    }).filter(candidate=>candidate.score>=.12||candidate.exactTitle||candidate.confirmedAlias)
      .sort((a,b)=>Number(a.sequelConflict)-Number(b.sequelConflict)||Number(a.editionConflict)-Number(b.editionConflict)||Number(b.confirmedAlias)-Number(a.confirmedAlias)||Number(b.exactTitle)-Number(a.exactTitle)||regionRank(a.region)-regionRank(b.region)||Number(Boolean(a.revision))-Number(Boolean(b.revision))||b.score-a.score||a.sourceFilename.localeCompare(b.sourceFilename,'en')).slice(0,10);
    const finalSourceFilename=game.coverSourceFilename??null;
    const method=game.coverUrl?(overrides[game.slug]?'override':knownAliases.some(alias=>normalizeCoverTitle(alias)===normalizeCoverTitle(entries.find(entry=>entry.sourceFilename===finalSourceFilename)?.baseTitle??''))?'alias':'automatique'):null;
    return{internalId:game.slug,catalogueTitle:game.title,slug:game.slug,year:game.releaseYear??null,alternativeTitles:knownAliases,reason:game.coverUrl?'résolu depuis le rapport initial':'aucun candidat automatique sûr',currentCover:game.coverUrl??null,coverOrigin:game.coverOrigin??null,finalSourceFilename,finalRegion:game.coverRegion??null,finalConfidence:game.coverMatchConfidence??null,method,candidates};
  });
  writeJson(candidatesFile,{generatedAt:new Date().toISOString(),sourceDirectory:'.cache/libretro-megadrive-thumbnails/Named_Boxarts',games});
  const manual=games.filter(game=>!game.currentCover).map(game=>({internalId:game.internalId,title:game.catalogueTitle,aliases:game.alternativeTitles,year:game.year,region:catalogue.find(item=>item.slug===game.slug)?.region??null,edition:null,suggestedQueries:[`${game.catalogueTitle} Mega Drive Europe box art`,`${game.catalogueTitle} Sega Genesis front cover`,...game.alternativeTitles.slice(0,2).map(alias=>`${alias} Mega Drive box art`)],expectedOutputFilename:`${game.slug}.webp`,expectedOutputPath:`public/covers/megadrive/${game.slug}.webp`,warning:'Valider la plateforme Mega Drive/Genesis et la face avant avant tout import manuel.'}));
  writeJson(manualFile,{generatedAt:new Date().toISOString(),games:manual});
  const manualHtml=manual.map(game=>`<article><h2>${escapeHtml(game.title)}</h2><p><code>${escapeHtml(game.internalId)}</code> · ${escapeHtml(game.year??'année inconnue')} · ${escapeHtml(game.region??'région inconnue')}</p><ul>${game.suggestedQueries.map(query=>`<li>${escapeHtml(query)}</li>`).join('')}</ul><p>Sortie : <code>${escapeHtml(game.expectedOutputPath)}</code></p></article>`).join('');
  fs.writeFileSync(path.join(root,'manual-cover-search.html'),`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Retro Coop — recherches manuelles</title><style>body{font:16px system-ui;max-width:1100px;margin:2rem auto;padding:0 1rem;background:#f4f6fb;color:#171b24}article{background:#fff;border:1px solid #ccd5e5;border-radius:10px;padding:1rem;margin:1rem 0}code{overflow-wrap:anywhere}</style><h1>Jaquettes nécessitant une recherche manuelle</h1><p>${manual.length} jeu(x), sans téléchargement automatique ni hotlink.</p>${manualHtml}`,'utf8');
  const review=games.map(game=>{const best=game.candidates[0];const finalImage=game.currentCover?`../../public${game.currentCover}`:null;const refused=game.candidates.filter(candidate=>candidate.sourceFilename!==game.finalSourceFilename).slice(0,3).map(candidate=>`<li>${escapeHtml(candidate.sourceFilename)} — ${candidate.score.toFixed(3)}${candidate.excludedVariant?` — exclu: ${escapeHtml(candidate.excludedReasons.join(', '))}`:''}</li>`).join('');return`<article class="${game.currentCover?'resolved':'missing'}"><div class="visual">${finalImage?`<img src="${escapeHtml(finalImage)}" alt="Jaquette de ${escapeHtml(game.catalogueTitle)}">`:'<div class="placeholder">Sans jaquette validée</div>'}</div><div><h2>${escapeHtml(game.catalogueTitle)}</h2><p><code>${escapeHtml(game.internalId)}</code></p><p>État : <strong>${game.currentCover?'résolu':'validation manuelle requise'}</strong><br>Source : ${escapeHtml(game.coverOrigin??'aucune')}<br>Méthode : ${escapeHtml(game.method??'aucune')}<br>Fichier source : ${escapeHtml(game.finalSourceFilename??'—')}<br>Fichier final : ${escapeHtml(game.currentCover??'—')}<br>Région : ${escapeHtml(game.finalRegion??(best?.region.join(', ')||'—'))} · score ${game.finalConfidence?.toFixed(3)??best?.score.toFixed(3)??'—'}</p><h3>Candidats refusés ou à vérifier</h3><ul>${refused||'<li>Aucun</li>'}</ul></div></article>`}).join('');
  fs.writeFileSync(path.join(root,'remaining-22-review.html'),`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Retro Coop — revue des 22 jaquettes</title><style>body{font:15px system-ui;max-width:1200px;margin:2rem auto;padding:0 1rem;background:#eef2f8;color:#171b24}article{display:grid;grid-template-columns:190px 1fr;gap:1.5rem;background:#fff;border:1px solid #ccd5e5;border-radius:12px;padding:1rem;margin:1rem 0}.missing{border-color:#ba6b55}.visual img,.placeholder{width:180px;aspect-ratio:5/7;object-fit:contain;background:#101522;border-radius:8px}.placeholder{display:grid;place-items:center;color:#fff;text-align:center}code{overflow-wrap:anywhere}@media(max-width:600px){article{grid-template-columns:1fr}.visual img,.placeholder{width:150px}}</style><h1>Retro Coop — contrôle des 22 jaquettes initialement manquantes</h1><p>${games.filter(game=>game.currentCover).length} résolue(s), ${games.filter(game=>!game.currentCover).length} restante(s).</p>${review}`,'utf8');
  console.log(`Rapports générés: ${games.length} jeux initiaux, ${manual.length} encore manquants.`);
}

main().catch(error=>{console.error(error);process.exitCode=1;});
