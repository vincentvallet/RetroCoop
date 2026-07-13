import {afterEach,describe,expect,it,vi} from 'vitest';
import {currentSessionCover} from '../lib/session-media';
import {publicUsername} from '../lib/public-user';
import {serializeSession} from '../lib/sessions';
afterEach(()=>{delete process.env.NEXT_PUBLIC_MEDIA_BASE_URL;vi.resetModules()});
describe('médias des sessions',()=>{
  it('résout une ancienne session vers la jaquette hachée actuelle',()=>expect(currentSessionCover({slug:'world-of-illusion-starring-mickey-mouse-and-donald-duck',title:'ancienne valeur ignorée'})).toMatch(/world-of-illusion-starring-mickey-mouse-and-donald-duck-[a-f0-9]{8}\.webp$/));
  it('gère une base médias sans double slash',async()=>{process.env.NEXT_PUBLIC_MEDIA_BASE_URL='https://media.example.test/';const {resolveGameMediaUrl}=await import('../lib/media');expect(resolveGameMediaUrl('/covers/megadrive/test-deadbeef.webp')).toBe('https://media.example.test/covers/megadrive/test-deadbeef.webp')});
});
describe('identités publiques',()=>{
  it('conserve un pseudo et remplace un email par un alias neutre stable',()=>{expect(publicUsername('Alice','user-1')).toBe('Alice');const alias=publicUsername('alice@example.com','user-1');expect(alias).toMatch(/^Joueur-[A-F0-9]{8}$/);expect(publicUsername('alice@example.com','user-1')).toBe(alias);expect(alias).not.toContain('@')});
  it('ne sérialise aucun secret, email complet ou email masqué',()=>{const now=new Date(),session={id:'s',gameId:'g',hostId:'u',status:'OPEN',visibility:'PUBLIC',startsAtUtc:new Date(now.getTime()+60000),createdAt:now,updatedAt:now,durationMinutes:60,timezoneAtCreation:'Europe/Paris',locationType:'online',privateJoinUrl:null,message:null,minPlayers:2,maxPlayers:4,game:{id:'g',title:'Zoom!',slug:'zoom'},host:{id:'u',username:'owner@example.com'},participants:[{userId:'u',joinedAt:now,user:{id:'u',username:'owner@example.com'}}]} as never;const json=JSON.stringify(serializeSession(session,'x'));expect(json).not.toMatch(/owner@example\.com|\*{3}@|password|authSecret/);expect(json).toMatch(/Joueur-[A-F0-9]{8}/)});
});
