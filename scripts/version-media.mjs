import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),publicRoot=path.join(root,'public'),mediaRoots=[path.join(publicRoot,'covers'),path.join(publicRoot,'gameplay')];
const jsonFiles=[path.join(root,'data/normalized/megadrive-games.json'),path.join(publicRoot,'covers/megadrive/covers-manifest.json'),path.join(publicRoot,'gameplay/megadrive/gameplay-manifest.json')];
const versionPattern=/-[a-f0-9]{8}\.webp$/i,pathMap=new Map();

function webpFiles(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{const target=path.join(directory,entry.name);return entry.isDirectory()?webpFiles(target):entry.isFile()&&entry.name.endsWith('.webp')?[target]:[]})}
function publicPath(file){return`/${path.relative(publicRoot,file).replaceAll('\\','/')}`}
for(const directory of mediaRoots){
  for(const source of webpFiles(directory)){
    const buffer=fs.readFileSync(source),hash=crypto.createHash('sha256').update(buffer).digest('hex').slice(0,8),extension=path.extname(source),base=path.basename(source,extension),versionedBase=versionPattern.test(path.basename(source))?base.replace(/-[a-f0-9]{8}$/i,`-${hash}`):`${base}-${hash}`,destination=path.join(path.dirname(source),`${versionedBase}${extension}`);
    const before=publicPath(source),after=publicPath(destination);pathMap.set(before,after);
    if(source!==destination){if(fs.existsSync(destination))throw new Error(`Collision média: ${destination}`);fs.renameSync(source,destination)}
  }
}
function replacePaths(value){if(typeof value==='string')return pathMap.get(value)??value;if(Array.isArray(value))return value.map(replacePaths);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,replacePaths(item)]));return value}
for(const file of jsonFiles){if(!fs.existsSync(file))continue;const data=replacePaths(JSON.parse(fs.readFileSync(file,'utf8')));fs.writeFileSync(file,`${JSON.stringify(data,null,2)}\n`)}
console.log(JSON.stringify({versionedMedia:pathMap.size,updatedJson:jsonFiles.filter(fs.existsSync).length},null,2));
