import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {inventoryBoxarts,SOURCE_REPOSITORY,syncLibretro,excludedMarkers} from './libretro';
import {CoverGame,loadJson,matchGame,MatchResult} from './matcher';

type StoredGame=CoverGame&{[key:string]:unknown;coverPath?:string|null;coverSourceFilename?:string|null;coverRegion?:string|null;coverMatchConfidence?:number|null;coverImportedAt?:string|null};
type ManifestItem={internalId:string;title:string;slug:string;region:string;source:'libretro';sourceFilename:string;coverPath:string;matchConfidence:number;matchReasons:string[];importedAt:string};
type Options={dryRun:boolean;syncOnly:boolean;limit:number;game?:string;force:boolean;resume:boolean;onlyMissing:boolean;reportOnly:boolean};
const catalogFile=path.resolve('data/normalized/megadrive-games.json');
const outputRoot=path.resolve('public/covers/megadrive');
const manifestFile=path.join(outputRoot,'covers-manifest.json');
const reportsRoot=path.resolve('reports/covers');
const aliasesFile=path.resolve('config/megadrive-cover-aliases.json');
const overridesFile=path.resolve('config/megadrive-cover-overrides.json');

export function parseCoverOptions(argv:string[]):Options {const get=(name:string)=>argv.find(v=>v.startsWith(`--${name}=`))?.slice(name.length+3);return{dryRun:argv.includes('--dry-run'),syncOnly:argv.includes('--sync-only'),reportOnly:argv.includes('--report-only'),limit:Number(get('limit')||0),game:get('game'),force:argv.includes('--force'),resume:!argv.includes('--no-resume'),onlyMissing:!argv.includes('--all')};}
function renameWithRetry(from:string,to:string){let last:unknown;for(let attempt=0;attempt<10;attempt++){try{fs.renameSync(from,to);return;}catch(error){last=error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,25);}}throw last;}
function writeAtomic(file:string,data:string|Buffer){fs.mkdirSync(path.dirname(file),{recursive:true});const temporary=`${file}.${process.pid}.${Date.now()}.tmp`,backup=`${file}.${process.pid}.bak`;fs.writeFileSync(temporary,data);if(!fs.existsSync(file)){renameWithRetry(temporary,file);return;}renameWithRetry(file,backup);try{renameWithRetry(temporary,file);fs.rmSync(backup,{force:true,maxRetries:5,retryDelay:25});}catch(error){if(fs.existsSync(backup)&&!fs.existsSync(file))renameWithRetry(backup,file);throw error;}}
function json(file:string,value:unknown){writeAtomic(file,`${JSON.stringify(value,null,2)}\n`);}
function localCoverValid(cover?:string|null){if(!cover||!cover.startsWith('/'))return false;const file=path.join('public',cover.replace(/^\//,''));return fs.existsSync(file)&&fs.statSync(file).size>0;}
export function isProtectedCover(game:StoredGame){return game.coverOrigin==='manual'||game.coverOrigin==='editorial'||(localCoverValid(game.coverUrl)&&game.coverOrigin!=='libretro');}
function escapeHtml(value:unknown){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));}

export async function convertCover(source:string,destination:string){
  let quality=80,buffer=await sharp(source).rotate().resize({width:480,withoutEnlargement:true}).webp({quality}).toBuffer();
  while(buffer.length>350*1024&&quality>55){quality-=10;buffer=await sharp(source).rotate().resize({width:480,withoutEnlargement:true}).webp({quality}).toBuffer();}
  const meta=await sharp(buffer).metadata();if(meta.format!=='webp'||!meta.width||!meta.height)throw new Error('WebP produit invalide');writeAtomic(destination,buffer);return{width:meta.width,height:meta.height,sizeBytes:buffer.length,quality};
}

function buildReview(matches:MatchResult[],ambiguous:MatchResult[],missing:MatchResult[]){
  const cards=matches.map(match=>{const cover=`../../public/covers/megadrive/${match.game.slug}.webp`;return`<article><img src="${escapeHtml(cover)}" alt="Jaquette de ${escapeHtml(match.game.title)}"><h2>${escapeHtml(match.game.title)}</h2><p>${escapeHtml(match.candidate?.sourceFilename)}<br>${escapeHtml(match.candidate?.regions.join(', ')||'Région inconnue')} · score ${match.confidence.toFixed(3)}</p></article>`}).join('');
  const ambiguousHtml=ambiguous.map(match=>`<li><strong>${escapeHtml(match.game.title)}</strong> — ${match.alternatives.map(c=>`${escapeHtml(c.sourceFilename)} (${c.confidence.toFixed(3)})`).join(', ')}</li>`).join('');
  const missingHtml=missing.map(match=>`<li>${escapeHtml(match.game.title)}</li>`).join('');
  return`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Retro Coop — Revue des jaquettes</title><style>body{font:16px system-ui;margin:2rem;background:#f5f7fb;color:#171b24}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem}article{background:white;padding:1rem;border:1px solid #ccd5e5;border-radius:.5rem}img{width:100%;aspect-ratio:5/7;object-fit:contain;background:#111}h2{font-size:1rem}section{margin:3rem 0}</style><h1>Retro Coop — Revue locale des jaquettes</h1><p>${matches.length} correspondances sûres, ${ambiguous.length} ambiguës, ${missing.length} manquantes.</p><main>${cards}</main><section><h2>Ambiguës</h2><ul>${ambiguousHtml}</ul></section><section><h2>Manquantes</h2><ul>${missingHtml}</ul></section></html>`;
}

export async function runCoverPipeline(argv=process.argv.slice(2)){
  const options=parseCoverOptions(argv);if(options.syncOnly){const dir=syncLibretro();console.log(`Named_Boxarts synchronisé: ${dir}`);return;}
  if(!fs.existsSync(catalogFile))throw new Error('Catalogue Mega Drive introuvable.');
  const games=JSON.parse(fs.readFileSync(catalogFile,'utf8')) as StoredGame[];
  const aliases=loadJson<Record<string,string[]>>(aliasesFile,{}),overrides=loadJson<Record<string,{sourceFilename:string;reason:string}>>(overridesFile,{});
  const inventory=await inventoryBoxarts();
  let selected=games.filter(game=>!options.game||game.title.toLocaleLowerCase('fr')===options.game.toLocaleLowerCase('fr'));
  if(options.limit)selected=selected.slice(0,options.limit);
  const skippedProtected:StoredGame[]=[];const skippedExisting:StoredGame[]=[];const results:MatchResult[]=[];
  for(const game of selected){if(isProtectedCover(game)){skippedProtected.push(game);continue;}if(!options.dryRun&&!options.reportOnly&&options.onlyMissing&&!options.force&&localCoverValid(game.coverUrl)){skippedExisting.push(game);continue;}results.push(matchGame(game,inventory,aliases,overrides));}
  const matched=results.filter(v=>v.status==='matched'),ambiguous=results.filter(v=>v.status==='ambiguous'),missing=results.filter(v=>v.status==='missing');
  const invalid:{sourceFilename:string;reason:string}[]=inventory.filter(v=>!v.validImage).map(v=>({sourceFilename:v.sourceFilename,reason:'image PNG illisible ou dimensions nulles'}));
  const existingManifest=loadJson<{games:ManifestItem[]}>(manifestFile,{games:[]});const bySlug=new Map(existingManifest.games.map(item=>[item.slug,item]));const imported:MatchResult[]=[];
  if(!options.dryRun&&!options.reportOnly){fs.mkdirSync(outputRoot,{recursive:true});for(const match of matched){if(!match.candidate)continue;const game=games.find(g=>g.slug===match.game.slug)!;const destination=path.join(outputRoot,`${game.slug}.webp`);try{if(!(options.resume&&fs.existsSync(destination)&&bySlug.has(game.slug)))await convertCover(match.candidate.sourcePath,destination);const now=new Date().toISOString(),coverPath=`/covers/megadrive/${game.slug}.webp`;Object.assign(game,{coverUrl:coverPath,coverPath,coverOrigin:'libretro',coverSourceFilename:match.candidate.sourceFilename,coverRegion:match.candidate.regions.join(', ')||null,coverMatchConfidence:match.confidence,coverImportedAt:now,coverSource:'libretro-thumbnails',coverAttribution:'Jaquette issue de Libretro Thumbnails; droits aux ayants droit respectifs'});bySlug.set(game.slug,{internalId:game.slug,title:game.title,slug:game.slug,region:match.candidate.regions.join(', ')||'Non précisée',source:'libretro',sourceFilename:match.candidate.sourceFilename,coverPath,matchConfidence:match.confidence,matchReasons:match.reasons,importedAt:now});imported.push(match);}catch(error){invalid.push({sourceFilename:match.candidate.sourceFilename,reason:error instanceof Error?error.message:String(error)});}}
    json(catalogFile,games);json(manifestFile,{generatedAt:new Date().toISOString(),source:'libretro-thumbnails',sourceRepository:SOURCE_REPOSITORY,games:[...bySlug.values()].sort((a,b)=>a.slug.localeCompare(b.slug,'en'))});
  }
  fs.mkdirSync(reportsRoot,{recursive:true});
  const simplify=(match:MatchResult)=>({internalId:match.game.slug,catalogueTitle:match.game.title,sourceFilename:match.candidate?.sourceFilename??null,region:match.candidate?.regions??[],revision:match.candidate?.revision??null,confidence:match.confidence,reasons:match.reasons,coverPath:match.status==='matched'?`/covers/megadrive/${match.game.slug}.webp`:null,candidates:match.alternatives});
  json(path.join(reportsRoot,'matched-covers.json'),matched.map(simplify));json(path.join(reportsRoot,'ambiguous-covers.json'),ambiguous.map(simplify));json(path.join(reportsRoot,'missing-covers.json'),missing.map(simplify));json(path.join(reportsRoot,'invalid-covers.json'),invalid);
  const finalCount=games.filter(game=>localCoverValid(game.coverUrl)).length;
  const summary={generatedAt:new Date().toISOString(),dryRun:options.dryRun,totalGames:games.length,selectedGames:selected.length,filesAnalyzed:inventory.length,validSourceImages:inventory.filter(v=>v.validImage).length,excludedVariants:inventory.filter(v=>v.excludedVariant).length,revisionFilesAvoided:inventory.filter(v=>v.revision).length,matched:matched.length,imported:imported.length,ambiguous:ambiguous.length,missing:missing.length,invalid:invalid.length,skippedProtected:skippedProtected.length,skippedExisting:skippedExisting.length,finalCovers:finalCount,coverage:Number((finalCount/games.length*100).toFixed(2)),regions:{europe:matched.filter(v=>v.candidate?.regions.includes('Europe')).length,usa:matched.filter(v=>v.candidate?.regions.includes('USA')).length,japan:matched.filter(v=>v.candidate?.regions.includes('Japan')).length},excludedMarkers};
  json(path.join(reportsRoot,'cover-import-summary.json'),summary);writeAtomic(path.join(reportsRoot,'cover-review.html'),buildReview(matched,ambiguous,missing));console.log(JSON.stringify(summary,null,2));return{summary,matched,ambiguous,missing,invalid};
}

if(import.meta.url===new URL(`file://${process.argv[1].replaceAll('\\','/')}`).href)runCoverPipeline().catch(error=>{console.error(error);process.exitCode=1;});
