import {afterAll,describe,expect,it} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {convertGameplay,hammingDistance,perceptualHash} from '../scripts/media/gameplay-pipeline';
import {inspectCover} from '../scripts/media/check-invalid-images';

const temp=fs.mkdtempSync(path.join(os.tmpdir(),'retrocoop-media-'));
const publicTemp=path.join(process.cwd(),'public','test-black-cover.png');
afterAll(async()=>{sharp.cache(false);await new Promise(resolve=>setTimeout(resolve,100));fs.rmSync(temp,{recursive:true,force:true,maxRetries:10,retryDelay:50});fs.rmSync(publicTemp,{force:true,maxRetries:10,retryDelay:50})});
describe('médias de jeu',()=>{
  it('convertit une capture en WebP local sans agrandissement',async()=>{const source=path.join(temp,'source.png'),destination=path.join(temp,'screen.webp');await sharp({create:{width:320,height:224,channels:3,background:'#4c68c7'}}).png().toFile(source);const result=await convertGameplay(source,destination);expect(result).toMatchObject({width:320,height:224});expect((await sharp(destination).metadata()).format).toBe('webp');expect(result.fileSize).toBeLessThanOrEqual(220*1024)});
  it('produit des empreintes perceptuelles stables',async()=>{const image=await sharp({create:{width:32,height:32,channels:3,background:'#fff'}}).png().toBuffer();const first=await perceptualHash(image),second=await perceptualHash(image);expect(first).toBe(second);expect(hammingDistance(first,second)).toBe(0)});
  it('détecte une jaquette entièrement noire',async()=>{await sharp({create:{width:100,height:140,channels:3,background:'#000'}}).png().toFile(publicTemp);const audit=await inspectCover({slug:'test-black',title:'Test noir',coverUrl:'/test-black-cover.png'});expect(audit.problemType).toBe('black-image')});
});
