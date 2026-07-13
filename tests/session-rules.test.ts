import {describe,expect,it} from 'vitest';
import {capacityStatus,joinRejection} from '../lib/session-rules';
const future=new Date('2030-07-13T18:00:00Z'),now=new Date('2030-07-13T12:00:00Z');
const base={hostId:'owner',status:'OPEN',startsAtUtc:future,maxPlayers:4,participantIds:['owner']};
describe('règles de participation',()=>{
  it('autorise un utilisateur connecté sur une session ouverte future',()=>expect(joinRejection(base,'alice',now)).toBeNull());
  it('refuse le créateur déjà comptabilisé',()=>expect(joinRejection(base,'owner',now)?.code).toBe('OWNER_ALREADY_JOINED'));
  it('refuse un doublon avant de signaler une session pleine',()=>expect(joinRejection({...base,status:'FULL',participantIds:['owner','alice']},'alice',now)?.code).toBe('ALREADY_JOINED'));
  it('refuse une session pleine',()=>expect(joinRejection({...base,status:'FULL'},'alice',now)?.code).toBe('SESSION_FULL'));
  it('refuse une session fermée',()=>expect(joinRejection({...base,status:'CLOSED'},'alice',now)?.code).toBe('REGISTRATIONS_CLOSED'));
  it('refuse une session annulée',()=>expect(joinRejection({...base,status:'CANCELLED'},'alice',now)?.code).toBe('SESSION_CANCELLED'));
  it('refuse une session passée en comparant les instants UTC',()=>expect(joinRejection({...base,startsAtUtc:new Date('2030-07-13T10:00:00Z')},'alice',now)?.code).toBe('SESSION_PAST'));
  it('refuse lorsque le compteur atteint la capacité malgré un statut incohérent',()=>expect(joinRejection({...base,maxPlayers:2,participantIds:['owner','bob']},'alice',now)?.code).toBe('SESSION_FULL'));
});
describe('statut de capacité',()=>{
  it('passe à FULL à la dernière place',()=>expect(capacityStatus('OPEN',2,2)).toBe('FULL'));
  it('rouvre après un départ',()=>expect(capacityStatus('FULL',1,2)).toBe('OPEN'));
  it('préserve une fermeture manuelle',()=>expect(capacityStatus('CLOSED',1,4)).toBe('CLOSED'));
});
