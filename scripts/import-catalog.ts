import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

export type Game={platform:string;title:string;sortTitle:string;slug:string;aliases:string[];region:string|null;releaseYear:number|null;releaseDate:null;genres:string[];playerMin:number|null;playerMax:number|null;simultaneous:boolean|null;alternating:boolean|null;coop:boolean|null;versus:boolean|null;dropIn:boolean|null;splitScreen:boolean|null;multitap:boolean|null;teamPlayerCompatible:boolean|null;verificationStatus:'VERIFIED'|'PROBABLE'|'TO_REVIEW';sourceConfidence:string|null;sourceName:string;sourceLine:number;[key:string]:unknown};
export const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,' ').replace(/[^a-zA-Z0-9]+/g,' ').trim().toLowerCase();
export const slugify=(value:string)=>normalize(value).replace(/\s+/g,'-');
export const bool=(value?:string):boolean|null=>!value||/non document|inconnu/i.test(value)?null:/^(oui|coop|simultan)/i.test(value)?true:/^non$/i.test(value)?false:null;
export function parseCsv(text:string){const first=text.replace(/^\uFEFF/,'').split(/\r?\n/,1)[0];const delimiter=[';',',','\t'].sort((a,b)=>first.split(b).length-first.split(a).length)[0];return Papa.parse<Record<string,string>>(text.replace(/^\uFEFF/,''),{header:true,delimiter,skipEmptyLines:true}).data;}

export function run(root=process.cwd()){
  const csv=fs.readdirSync(root).find(file=>file.endsWith('.csv'))!;
  const txt=fs.readdirSync(root).find(file=>file.endsWith('.txt'))!;
  const rows=parseCsv(fs.readFileSync(path.join(root,csv),'utf8'));
  const existingFile=path.join(root,'data/normalized/megadrive-games.json');
  const existing=fs.existsSync(existingFile)?JSON.parse(fs.readFileSync(existingFile,'utf8')) as Game[]:[];
  const existingBySlug=new Map(existing.map(game=>[game.slug,game]));
  const seen=new Map<string,Game>(),conflicts:string[]=[],unparsed:string[]=[];
  rows.forEach((row,index)=>{
    const title=(row['Titre']||row['Title']||'').trim(),maximum=Number.parseInt(row['Joueurs max']||'');
    if(!title){unparsed.push(`${csv},${index+2},titre absent`);return;}if(maximum===1)return;
    const year=/^(19|20)\d{2}$/.test(row['Année']||'')?Number(row['Année']):null;
    const game:Game={platform:'megadrive',title,sortTitle:title.replace(/^(le|la|les|the|a|an)\s+/i,''),slug:slugify(title),aliases:[],region:row['Région']||null,releaseYear:year,releaseDate:null,genres:(row['Genre / famille']||'').split('/').map(value=>value.trim()).filter(Boolean),playerMin:maximum>=2?2:null,playerMax:Number.isFinite(maximum)?maximum:null,simultaneous:bool(row['Déroulement']),alternating:/altern/i.test(row['Déroulement']||'')?true:null,coop:/coop/i.test(row['Type multijoueur']||'')?true:null,versus:/compét|versus/i.test(row['Type multijoueur']||'')?true:null,dropIn:bool(row['Drop-in']),splitScreen:/scind|split/i.test(row['Affichage']||'')?true:null,multitap:bool(row['Multitap']),teamPlayerCompatible:null,verificationStatus:/confirm/i.test(row['Validation']||'')?'VERIFIED':'TO_REVIEW',sourceConfidence:row['Confiance']||null,sourceName:csv,sourceLine:index+2};
    const old=seen.get(normalize(title));if(old){if(old.playerMax!==game.playerMax)conflicts.push(`${title},playerMax,${old.playerMax},${game.playerMax},${old.sourceLine},${game.sourceLine}`);}else seen.set(normalize(title),game);
  });
  const preservedFields=['coverUrl','coverPath','coverOrigin','coverSourceFilename','coverRegion','coverMatchConfidence','coverImportedAt','coverSource','coverAttribution','gameplayImages','description','tags','metadataSource','metadataExternalId','metadataUpdatedAt','externalRating','externalRatingCount','externalRatingProvider','externalRatingType','externalRatingUpdatedAt'];
  const games=[...seen.values()].map(game=>{const old=existingBySlug.get(game.slug);if(old)for(const field of preservedFields)if(old[field]!==undefined)game[field]=old[field];return game;}).sort((a,b)=>a.sortTitle.localeCompare(b.sortTitle,'fr'));
  fs.mkdirSync(path.join(root,'data/normalized'),{recursive:true});fs.mkdirSync(path.join(root,'data/reports'),{recursive:true});
  fs.writeFileSync(existingFile,JSON.stringify(games,null,2));
  fs.writeFileSync(path.join(root,'data/reports/import-report.csv'),`metric,value\nsource_csv,${csv}\nsource_txt,${txt}\ncsv_rows,${rows.length}\nunique_games,${games.length}\nconflicts,${conflicts.length}\nunparsed,${unparsed.length}\n`);
  fs.writeFileSync(path.join(root,'data/reports/conflicts-to-review.csv'),'title,field,first,second,firstLine,secondLine\n'+conflicts.join('\n'));
  fs.writeFileSync(path.join(root,'data/reports/duplicates-to-review.csv'),'title,candidate,score\n');fs.writeFileSync(path.join(root,'data/reports/unparsed-rows.csv'),'source,line,reason\n'+unparsed.join('\n'));
  console.log(`Import terminé: ${games.length} jeux uniques; TXT analysé (${fs.readFileSync(path.join(root,txt),'utf8').split(/\r?\n/).length} lignes).`);return games;
}
if(import.meta.url===new URL(`file://${process.argv[1].replaceAll('\\','/')}`).href)run();
