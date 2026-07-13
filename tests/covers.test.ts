import {afterAll,describe,expect,it} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {normalizeCoverTitle,stableCoverSlug} from '../scripts/covers/normalize-game-title';
import {BoxartEntry,parseBoxartFilename} from '../scripts/covers/libretro';
import {matchGame,regionRank,scoreCandidate} from '../scripts/covers/matcher';
import {convertCover,isProtectedCover,parseCoverOptions} from '../scripts/covers/pipeline';

const temp=fs.mkdtempSync(path.join(os.tmpdir(),'retrocoop-covers-'));
afterAll(async()=>{sharp.cache(false);await new Promise(resolve=>setTimeout(resolve,100));fs.rmSync(temp,{recursive:true,force:true,maxRetries:10,retryDelay:50});});
const entry=(filename:string,overrides:Partial<BoxartEntry>={}):BoxartEntry=>({...parseBoxartFilename(filename),sourcePath:filename,width:500,height:700,sizeBytes:1000,validImage:true,...overrides});

describe('noms Libretro',()=>{
  it('extrait une région multiple sans la décomposer arbitrairement',()=>expect(parseBoxartFilename('Sonic the Hedgehog (USA, Europe).png').regions).toEqual(['USA','Europe']));
  it('détecte une révision',()=>expect(parseBoxartFilename('Game Name (Europe) (Rev A).png').revision).toBe('Rev A'));
  it.each(['Prototype','Proto','Beta','Hack','Unlicensed','Genesis Mini'])('exclut la variante %s',marker=>expect(parseBoxartFilename(`Game (${marker}).png`).excludedVariant).toBe(true));
  it('reconnaît la région Chine',()=>expect(parseBoxartFilename('Smart Mouse (China) (Unl).png').regions).toEqual(['China']));
  it('conserve un sous-titre entre parenthèses',()=>expect(parseBoxartFilename('Chaos Engine (Soldiers of Fortune) (Europe).png').baseTitle).toBe('Chaos Engine (Soldiers of Fortune)'));
});

describe('normalisation',()=>{
  it('normalise accents et apostrophes',()=>expect(normalizeCoverTitle("L’Été '95")).toBe('l ete 95'));
  it('rapproche chiffres romains et arabes',()=>expect(normalizeCoverTitle('Streets of Rage III')).toBe(normalizeCoverTitle('Streets of Rage 3')));
  it('rapproche FIFA avec apostrophe',()=>expect(normalizeCoverTitle("FIFA Soccer '95")).toBe(normalizeCoverTitle('FIFA Soccer 95')));
  it('normalise la ponctuation du sous-titre',()=>expect(normalizeCoverTitle('NBA Jam: Tournament Edition')).toBe(normalizeCoverTitle('NBA Jam Tournament Edition')));
  it('gère The placé à la fin',()=>expect(normalizeCoverTitle('Punisher, The')).toBe(normalizeCoverTitle('The Punisher')));
  it('ne traite pas le slash d’un titre comme un chemin',()=>expect(normalizeCoverTitle('Battletoads / Double Dragon')).toContain('battletoads'));
  it('génère un slug stable',()=>expect(stableCoverSlug('FIFA Soccer 95')).toBe('fifa-soccer-95'));
});

describe('matching sûr',()=>{
  it('accepte un titre exact européen',()=>expect(scoreCandidate({slug:'s',title:'Streets of Rage 3'},entry('Streets of Rage III (Europe).png')).confidence).toBeGreaterThanOrEqual(.92));
  it('distingue les suites NBA Jam',()=>expect(scoreCandidate({slug:'n',title:'NBA Jam'},entry('NBA Jam - Tournament Edition (Europe).png')).confidence).toBeLessThan(.72));
  it('distingue Super Street Fighter II',()=>expect(scoreCandidate({slug:'sf',title:'Street Fighter II'},entry('Super Street Fighter II (Europe).png')).confidence).toBeLessThan(.72));
  it('préfère Europe à USA, Europe puis USA puis Japon',()=>expect([regionRank(['Europe']),regionRank(['USA','Europe']),regionRank(['USA']),regionRank(['Japan'])]).toEqual([0,3,4,5]));
  it('préfère une édition standard',()=>expect(scoreCandidate({slug:'g',title:'Game'},entry('Game (Europe).png')).confidence).toBeGreaterThan(scoreCandidate({slug:'g',title:'Game'},entry('Game (Europe) (Rev A).png')).confidence));
  it('applique un override explicite',()=>expect(matchGame({slug:'g',title:'Wrong'},[entry('Right (Europe).png')],{}, {g:{sourceFilename:'Right (Europe).png',reason:'validé'}}).confidence).toBe(1));
  it('autorise une variante exclue uniquement par override explicite',()=>expect(matchGame({slug:'g',title:'Game'},[entry('Game (USA) (Unl).png')],{}, {g:{sourceFilename:'Game (USA) (Unl).png',reason:'face avant vérifiée'}}).status).toBe('matched'));
});

describe('protection et images',()=>{
  it('protège une jaquette manuelle',()=>expect(isProtectedCover({slug:'g',title:'G',coverOrigin:'manual'})).toBe(true));
  it('active reprise et only-missing par défaut',()=>expect(parseCoverOptions([])).toMatchObject({resume:true,onlyMissing:true,force:false}));
  it('convertit en WebP sans agrandir',async()=>{const source=path.join(temp,'source.png'),dest=path.join(temp,'cover.webp');await sharp({create:{width:120,height:180,channels:3,background:'#075de8'}}).png().toFile(source);await convertCover(source,dest);const meta=await sharp(dest).metadata();expect(meta).toMatchObject({format:'webp',width:120,height:180});});
  it('rejette une image invalide',async()=>{const bad=path.join(temp,'bad.png');fs.writeFileSync(bad,'not an image');await expect(sharp(bad).metadata()).rejects.toThrow();});
  it('produit une conversion idempotente',async()=>{const source=path.join(temp,'idempotent.png'),dest=path.join(temp,'idempotent.webp');await sharp({create:{width:100,height:140,channels:3,background:'#000'}}).png().toFile(source);await convertCover(source,dest);const first=fs.readFileSync(dest);await convertCover(source,dest);expect(fs.readFileSync(dest)).toEqual(first);});
});
