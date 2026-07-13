import fs from 'node:fs';
import {BoxartEntry} from './libretro';
import {normalizeCoverTitle,titleTokens} from './normalize-game-title';

export type CoverGame={slug:string;title:string;aliases?:string[];region?:string|null;releaseYear?:number|null;coverUrl?:string|null;coverOrigin?:string|null};
export type MatchResult={game:CoverGame;candidate:BoxartEntry|null;confidence:number;reasons:string[];status:'matched'|'ambiguous'|'missing';alternatives:{sourceFilename:string;confidence:number;regions:string[];reasons:string[]}[]};
const distinctive=new Set(['2','3','special','champion','tournament','deluxe','ultimate','plus','gold','world','championship']);

export function regionRank(regions:string[]) {
  const lower=regions.map(v=>v.toLowerCase());
  if(lower.includes('usa')&&lower.includes('europe')) return 3;
  for(const [i,name] of ['europe','france','world'].entries()) if(lower.includes(name)) return i;
  if(lower.includes('usa')) return 4; if(lower.includes('japan')) return 5; return 6;
}
function similarity(a:Set<string>,b:Set<string>){const intersection=[...a].filter(v=>b.has(v)).length;return intersection/Math.max(1,new Set([...a,...b]).size);}
function distinctiveEqual(a:Set<string>,b:Set<string>){const aa=[...a].filter(v=>distinctive.has(v)).sort().join('|');const bb=[...b].filter(v=>distinctive.has(v)).sort().join('|');return aa===bb;}

export function scoreCandidate(game:CoverGame,candidate:BoxartEntry,confirmedAliases:string[]=[]){
  const title=normalizeCoverTitle(game.title), source=normalizeCoverTitle(candidate.baseTitle); const gt=titleTokens(game.title),ct=titleTokens(candidate.baseTitle); const reasons:string[]=[]; let score=0;
  const exact=title===source; const alias=[...(game.aliases??[]),...confirmedAliases].some(value=>normalizeCoverTitle(value)===source);
  if(exact){score+=.78;reasons.push('titre normalisé exact');} else if(alias){score+=.84;reasons.push('alias confirmé exact');}
  const tokenScore=similarity(gt,ct);score+=tokenScore*.08;if(tokenScore===1)reasons.push('tokens distinctifs identiques');
  if(distinctiveEqual(gt,ct)||alias){score+=.02;}else{score-=.35;reasons.push('termes d’édition ou de suite incompatibles');}
  const rank=regionRank(candidate.regions);score+=Math.max(0,.08-rank*.012);if(rank<6)reasons.push(`région prioritaire: ${candidate.regions.join(', ')}`);
  if(!candidate.revision&&!candidate.edition){score+=.04;reasons.push('version standard');}else if(candidate.revision)reasons.push(`révision: ${candidate.revision}`);
  if(game.releaseYear&&candidate.year){if(game.releaseYear===candidate.year){score+=.04;reasons.push('année identique');}else{score-=.12;reasons.push('année incompatible');}}
  if(candidate.excludedVariant||!candidate.validImage)score=0;
  return {confidence:Math.max(0,Math.min(1,Number(score.toFixed(4)))),reasons};
}

export function matchGame(game:CoverGame,entries:BoxartEntry[],aliases:Record<string,string[]>,overrides:Record<string,{sourceFilename:string;reason:string}>):MatchResult {
  const override=overrides[game.slug];
  if(override){const candidate=entries.find(e=>e.sourceFilename===override.sourceFilename);if(candidate&&candidate.validImage)return{game,candidate,confidence:1,reasons:[`validation manuelle: ${override.reason}`,...(candidate.excludedVariant?[`variante explicitement validée: ${candidate.excludedReasons.join(', ')}`]:[])],status:'matched',alternatives:[]};}
  const usable=entries.filter(entry=>entry.validImage&&!entry.excludedVariant);
  const scored=usable.map(candidate=>({candidate,...scoreCandidate(game,candidate,aliases[game.slug]??[])})).filter(v=>v.confidence>=.3)
    .sort((a,b)=>b.confidence-a.confidence||regionRank(a.candidate.regions)-regionRank(b.candidate.regions)||Number(Boolean(a.candidate.revision))-Number(Boolean(b.candidate.revision))||(b.candidate.width??0)-(a.candidate.width??0)||a.candidate.sourceFilename.localeCompare(b.candidate.sourceFilename,'en'));
  const best=scored[0];if(!best)return{game,candidate:null,confidence:0,reasons:[],status:'missing',alternatives:[]};
  const alternatives=scored.slice(0,5).map(value=>({sourceFilename:value.candidate.sourceFilename,confidence:value.confidence,regions:value.candidate.regions,reasons:value.reasons}));
  const confirmed=new Set([...(game.aliases??[]),...(aliases[game.slug]??[])].map(normalizeCoverTitle));
  const tooClose=Boolean(scored[1]&&best.confidence-scored[1].confidence<.015&&normalizeCoverTitle(best.candidate.baseTitle)!==normalizeCoverTitle(scored[1].candidate.baseTitle)&&!(confirmed.has(normalizeCoverTitle(best.candidate.baseTitle))&&confirmed.has(normalizeCoverTitle(scored[1].candidate.baseTitle))));
  const status=best.confidence>=.92&&!tooClose?'matched':best.confidence>=.72?'ambiguous':'missing';
  return{game,candidate:status==='missing'?null:best.candidate,confidence:best.confidence,reasons:best.reasons,status,alternatives};
}

export function loadJson<T>(file:string,fallback:T):T{return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')) as T:fallback;}
