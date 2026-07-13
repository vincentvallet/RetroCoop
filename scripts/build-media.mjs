import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd(),publicRoot=path.join(root,'public'),destinationRoot=path.join(root,'dist-media');
if(path.dirname(destinationRoot)!==root)throw new Error('Destination média invalide.');
fs.rmSync(destinationRoot,{recursive:true,force:true});fs.mkdirSync(destinationRoot,{recursive:true});
const games=JSON.parse(fs.readFileSync(path.join(root,'data/normalized/megadrive-games.json'),'utf8')),paths=new Set();
for(const game of games){for(const value of [game.coverUrl,game.coverPath,...(game.gameplayImages??[]).map(image=>image.path)])if(typeof value==='string'&&/^\/(covers|gameplay)\//.test(value))paths.add(value)}
for(const publicPath of paths){const source=path.join(publicRoot,publicPath.slice(1)),destination=path.join(destinationRoot,publicPath.slice(1));if(!fs.existsSync(source))throw new Error(`Média référencé introuvable: ${publicPath}`);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(source,destination)}
fs.writeFileSync(path.join(destinationRoot,'_headers'),'/covers/*\n  Cache-Control: public, max-age=31536000, immutable\n/gameplay/*\n  Cache-Control: public, max-age=31536000, immutable\n');
console.log(JSON.stringify({files:paths.size,destination:'dist-media'},null,2));
