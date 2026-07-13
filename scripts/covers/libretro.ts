import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';

export const CACHE_ROOT = path.resolve('.cache/libretro-megadrive-thumbnails');
export const BOXARTS_ROOT = path.join(CACHE_ROOT, 'Named_Boxarts');
export const SOURCE_REPOSITORY = 'libretro-thumbnails/Sega_-_Mega_Drive_-_Genesis';
export const SOURCE_URL = `https://github.com/${SOURCE_REPOSITORY}.git`;
export const excludedMarkers = ['Beta','Proto','Prototype','Sample','Demo','Sega Channel','Mega Drive Mini','Genesis Mini','Aftermarket','Unl','Unlicensed','Hack'];
const regionNames = ['Europe','France','World','USA','Japan','Brazil','Australia','Asia','Canada','Korea','China','Hong Kong','Taiwan'];

export type BoxartEntry = {sourceFilename:string;sourcePath:string;baseTitle:string;regions:string[];languages:string[];revision:string|null;edition:string|null;year:number|null;excludedVariant:boolean;excludedReasons:string[];extension:string;width:number|null;height:number|null;sizeBytes:number;validImage:boolean};

export function parseBoxartFilename(filename: string): Omit<BoxartEntry,'sourcePath'|'width'|'height'|'sizeBytes'|'validImage'> {
  const extension = path.extname(filename).toLowerCase();
  const stem = path.basename(filename, extension);
  const groups = [...stem.matchAll(/\(([^()]*)\)/g)].map(match => match[1].trim());
  const regions: string[] = [];
  const languages: string[] = [];
  let revision: string|null = null, edition: string|null = null, year: number|null = null;
  const excludedReasons = excludedMarkers.filter(marker => new RegExp(`\\b${marker.replace(/ /g,'\\s+')}\\b`,'i').test(filename));
  for (const group of groups) {
    for (const token of group.split(',').map(value=>value.trim())) { const region=regionNames.find(name=>name.toLowerCase()===token.toLowerCase()); if(region&&!regions.includes(region))regions.push(region); }
    if (/^(Rev(?:ision)?\s*[A-Z0-9]+)$/i.test(group)) revision = group;
    if (/^(En|Fr|De|Es|It|Ja|Pt|Nl|Sv|No|Da)(,[A-Za-z]{2})*$/i.test(group)) languages.push(...group.split(','));
    if (/^(19|20)\d{2}$/.test(group)) year = Number(group);
    if (/^(Alt|Edition|Limited|Special|Deluxe|Gold)/i.test(group)) edition = group;
  }
  const metadataGroup = (group: string) => regionNames.some(region => new RegExp(`(^|,\\s*)${region}($|,)`,'i').test(group)) || /^(Rev(?:ision)?\s*[A-Z0-9]+)$/i.test(group) || /^(En|Fr|De|Es|It|Ja|Pt|Nl|Sv|No|Da)(,[A-Za-z]{2})*$/i.test(group) || /^(19|20)\d{2}$/.test(group) || /^(J-Cart|Genesis|Mega Drive)$/i.test(group) || /^[A-Z]{2,}[A-Z0-9]*\d[A-Z0-9]*$/i.test(group) || excludedMarkers.some(marker => group.toLowerCase().includes(marker.toLowerCase()));
  const baseTitle = stem.replace(/\(([^()]*)\)/g, (full, group: string) => metadataGroup(group.trim()) ? '' : full).replace(/\s+/g,' ').trim();
  return {sourceFilename:filename,baseTitle,regions,languages,revision,edition,year,excludedVariant:excludedReasons.length>0,excludedReasons,extension};
}

function git(args: string[]) { return spawnSync('git', args, {encoding:'utf8',stdio:'pipe'}); }

export function syncLibretro() {
  fs.mkdirSync(path.dirname(CACHE_ROOT),{recursive:true});
  if (!fs.existsSync(path.join(CACHE_ROOT,'.git'))) {
    const clone=git(['clone','--depth','1','--filter=blob:none','--sparse',SOURCE_URL,CACHE_ROOT]);
    if(clone.status!==0) throw new Error(`Clone Libretro impossible: ${clone.stderr.trim()}`);
    const sparse=git(['-C',CACHE_ROOT,'sparse-checkout','set','Named_Boxarts']);
    if(sparse.status!==0) throw new Error(`Sparse checkout impossible: ${sparse.stderr.trim()}`);
  } else {
    const pull=git(['-C',CACHE_ROOT,'pull','--ff-only']);
    if(pull.status!==0 && !fs.existsSync(BOXARTS_ROOT)) throw new Error(`Mise à jour Libretro impossible et cache absent: ${pull.stderr.trim()}`);
    if(!fs.existsSync(BOXARTS_ROOT)) {
      const sparse=git(['-C',CACHE_ROOT,'sparse-checkout','set','Named_Boxarts']);
      if(sparse.status!==0) throw new Error(`Sparse checkout impossible: ${sparse.stderr.trim()}`);
    }
  }
  if(!fs.existsSync(BOXARTS_ROOT)) throw new Error('Named_Boxarts est absent du cache Libretro.');
  return BOXARTS_ROOT;
}

export async function inventoryBoxarts(): Promise<BoxartEntry[]> {
  if(!fs.existsSync(BOXARTS_ROOT)) throw new Error('Named_Boxarts absent. Lancez npm run covers:sync.');
  const files=fs.readdirSync(BOXARTS_ROOT).filter(file=>file.toLowerCase().endsWith('.png')).sort((a,b)=>a.localeCompare(b,'en'));
  const entries: BoxartEntry[]=[];
  for(let i=0;i<files.length;i+=24) {
    const batch=files.slice(i,i+24);
    entries.push(...await Promise.all(batch.map(async sourceFilename=>{
      const sourcePath=path.join(BOXARTS_ROOT,sourceFilename); const stat=fs.statSync(sourcePath); const parsed=parseBoxartFilename(sourceFilename);
      try { const meta=await sharp(sourcePath).metadata(); return {...parsed,sourcePath,width:meta.width??null,height:meta.height??null,sizeBytes:stat.size,validImage:meta.format==='png'&&Boolean(meta.width&&meta.height)}; }
      catch { return {...parsed,sourcePath,width:null,height:null,sizeBytes:stat.size,validImage:false}; }
    })));
  }
  return entries;
}
