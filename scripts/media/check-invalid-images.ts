import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

type Game={slug:string;title:string;coverUrl?:string|null};
export type ImageAudit={internalId:string;title:string;coverPath:string|null;problemType:string|null;fileExists:boolean;validImage:boolean;width:number|null;height:number|null;hasAlpha:boolean;transparentPixelRatio:number;averageBrightness:number|null;darkPixelRatio:number|null;luminanceStdDev:number|null;entropy:number|null;dominantColor:string|null};
const catalogueFile=path.resolve('data/normalized/megadrive-games.json');
const reportFile=path.resolve('reports/media/problematic-covers-before.json');
const fullReportFile=path.resolve('reports/media/cover-image-audit.json');

function round(value:number){return Number(value.toFixed(3));}
function entropy(histogram:number[],total:number){return -histogram.reduce((sum,count)=>{if(!count)return sum;const probability=count/total;return sum+probability*Math.log2(probability);},0);}
function dominantColor(rgb:Array<[number,number,number]>) {const buckets=new Map<string,number>();for(const [r,g,b] of rgb){const key=`${Math.round(r/32)*32},${Math.round(g/32)*32},${Math.round(b/32)*32}`;buckets.set(key,(buckets.get(key)??0)+1);}const key=[...buckets].sort((a,b)=>b[1]-a[1])[0]?.[0];if(!key)return null;const [r,g,b]=key.split(',').map(Number);return `#${[r,g,b].map(value=>Math.min(255,value).toString(16).padStart(2,'0')).join('')}`;}

export async function inspectCover(game:Game):Promise<ImageAudit>{
  const empty:ImageAudit={internalId:game.slug,title:game.title,coverPath:game.coverUrl??null,problemType:null,fileExists:false,validImage:false,width:null,height:null,hasAlpha:false,transparentPixelRatio:0,averageBrightness:null,darkPixelRatio:null,luminanceStdDev:null,entropy:null,dominantColor:null};
  if(!game.coverUrl){return{...empty,problemType:'missing-cover'};}
  if(/^https?:\/\//i.test(game.coverUrl))return{...empty,problemType:'remote-cover'};
  const file=path.resolve('public',game.coverUrl.replace(/^\//,''));
  if(!fs.existsSync(file)||fs.statSync(file).size===0)return{...empty,problemType:fs.existsSync(file)?'zero-byte-file':'missing-file'};
  try{
    const image=sharp(file,{failOn:'error'});const metadata=await image.metadata();
    const {data}=await image.rotate().resize({width:96,height:96,fit:'inside',withoutEnlargement:true}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const luminances:number[]=[],histogram=Array.from({length:256},()=>0),pixels:Array<[number,number,number]>=[];let transparent=0;
    for(let index=0;index<data.length;index+=4){const r=data[index],g=data[index+1],b=data[index+2],a=data[index+3];if(a<16)transparent++;const luminance=.2126*r+.7152*g+.0722*b;luminances.push(luminance);histogram[Math.max(0,Math.min(255,Math.round(luminance)))]++;pixels.push([r,g,b]);}
    const count=luminances.length,average=luminances.reduce((sum,value)=>sum+value,0)/count,variance=luminances.reduce((sum,value)=>sum+(value-average)**2,0)/count,stdDev=Math.sqrt(variance),dark=luminances.filter(value=>value<20).length/count,transparentRatio=transparent/count;
    const looksBlack=average<12&&dark>.95&&stdDev<10;const looksNearBlack=average<24&&dark>.88&&stdDev<18;const looksTransparent=transparentRatio>.9;
    return{...empty,fileExists:true,validImage:Boolean(metadata.width&&metadata.height),width:metadata.width??null,height:metadata.height??null,hasAlpha:Boolean(metadata.hasAlpha),transparentPixelRatio:round(transparentRatio),averageBrightness:round(average),darkPixelRatio:round(dark),luminanceStdDev:round(stdDev),entropy:round(entropy(histogram,count)),dominantColor:dominantColor(pixels),problemType:!metadata.width||!metadata.height?'invalid-dimensions':looksTransparent?'transparent-image':looksBlack?'black-image':looksNearBlack?'near-black-image':null};
  }catch{return{...empty,fileExists:true,problemType:'corrupt-image'};}
}

async function main(){const games=JSON.parse(fs.readFileSync(catalogueFile,'utf8')) as Game[];const audits:ImageAudit[]=[];for(let index=0;index<games.length;index+=16)audits.push(...await Promise.all(games.slice(index,index+16).map(inspectCover)));fs.mkdirSync(path.dirname(reportFile),{recursive:true});fs.writeFileSync(fullReportFile,`${JSON.stringify(audits,null,2)}\n`);const problematic=audits.filter(item=>item.problemType);fs.writeFileSync(reportFile,`${JSON.stringify(problematic,null,2)}\n`);console.log(JSON.stringify({totalGames:games.length,validCovers:audits.filter(item=>!item.problemType).length,problematic:problematic.length,missing:problematic.filter(item=>item.problemType==='missing-cover').length,blackOrNearBlack:problematic.filter(item=>item.problemType==='black-image'||item.problemType==='near-black-image').length,corrupt:problematic.filter(item=>item.problemType==='corrupt-image').length},null,2));}
if(import.meta.url===new URL(`file://${process.argv[1].replaceAll('\\','/')}`).href)main().catch(error=>{console.error(error);process.exitCode=1;});
