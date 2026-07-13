import {describe,expect,it} from 'vitest';
import {digest,normalizeIdentity,safeEqual,sign} from '../lib/registration-security';
describe('sécurité de l’inscription',()=>{
  it('normalise email et pseudo sans ambiguïté de casse',()=>expect(normalizeIdentity('  ÉQUIPE@Test.FR ')).toBe('équipe@test.fr'));
  it('compare les signatures en temps constant',()=>{const signature=sign('payload');expect(safeEqual(signature,sign('payload'))).toBe(true);expect(safeEqual(signature,sign('autre'))).toBe(false)});
  it('ne stocke qu’une empreinte du jeton',()=>expect(digest('jeton')).toMatch(/^[a-f0-9]{64}$/));
});
