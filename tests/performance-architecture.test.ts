import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';

const root=process.cwd(),games=JSON.parse(fs.readFileSync(path.join(root,'data/normalized/megadrive-games.json'),'utf8')) as Array<{coverUrl?:string|null;gameplayImages?:Array<{path:string}>}>;
const mediaPaths=games.flatMap(game=>[game.coverUrl,...(game.gameplayImages??[]).map(image=>image.path)]).filter((value):value is string=>Boolean(value));

describe('architecture de performance',()=>{
  it('versionne chaque média référencé avec son hash',()=>{expect(mediaPaths).toHaveLength(742);for(const mediaPath of mediaPaths)expect(mediaPath).toMatch(/^\/(covers|gameplay)\/.+-[a-f0-9]{8}\.webp$/)});
  it('ne passe aucun média préparé par next/image',()=>{for(const file of ['components/GameCard.tsx','components/GameDetailNavigator.tsx','components/GameplayGallery.tsx','components/GameAutocomplete.tsx','app/sessions/page.tsx','app/sessions/[id]/page.tsx'])expect(fs.readFileSync(path.join(root,file),'utf8')).not.toContain("next/image")});
  it('ne lie plus le catalogue ou le layout à Prisma et aux cookies',()=>{for(const file of ['app/layout.tsx','app/catalogue/page.tsx']){const source=fs.readFileSync(path.join(root,file),'utf8');expect(source).not.toMatch(/currentUser|cookies\(|prisma\./)}});
  it('configure un cache immutable limité aux WebP versionnés',()=>{const config=fs.readFileSync(path.join(root,'next.config.ts'),'utf8');expect(config).toContain("/covers/:path*.webp");expect(config).toContain('max-age=31536000, immutable')});
});
