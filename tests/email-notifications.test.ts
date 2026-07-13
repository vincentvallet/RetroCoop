import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({update:vi.fn(),findFirst:vi.fn()}));
vi.mock('../lib/db',()=>({prisma:{notification:{update:mocks.update,findFirst:mocks.findFirst}}}));
import {sendJoinEmail} from '../lib/email';
const input={notificationId:'n1',sessionId:'s1',participantId:'p1',participantName:'Alice',hostName:'Bob',hostEmail:'bob@example.com',gameTitle:'Streets of Rage 2',startsAt:new Date('2030-07-15T18:00:00Z'),timezone:'Europe/Paris',enabled:true};
describe('email de participation',()=>{
  beforeEach(()=>{mocks.update.mockResolvedValue({});mocks.findFirst.mockResolvedValue(null);process.env.RESEND_API_KEY='test-key';process.env.EMAIL_FROM='RetroCoop <test@example.com>';process.env.APP_URL='https://retrocoop.example'});
  afterEach(()=>{vi.unstubAllGlobals();delete process.env.RESEND_API_KEY;delete process.env.EMAIL_FROM;delete process.env.APP_URL;vi.clearAllMocks()});
  it('appelle Resend uniquement côté serveur quand il est configuré',async()=>{const fetchMock=vi.fn().mockResolvedValue({ok:true});vi.stubGlobal('fetch',fetchMock);await sendJoinEmail(input);expect(fetchMock).toHaveBeenCalledOnce();expect(JSON.parse(fetchMock.mock.calls[0][1].body).to).toEqual(['bob@example.com']);expect(mocks.update).toHaveBeenLastCalledWith({where:{id:'n1'},data:{emailStatus:'SENT',emailSentAt:expect.any(Date)}})});
  it('ne propage jamais un échec Resend',async()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('Resend indisponible')));await expect(sendJoinEmail(input)).resolves.toBeUndefined();expect(mocks.update).toHaveBeenLastCalledWith({where:{id:'n1'},data:{emailStatus:'FAILED'}})});
  it('respecte la préférence désactivée',async()=>{const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);await sendJoinEmail({...input,enabled:false});expect(fetchMock).not.toHaveBeenCalled();expect(mocks.update).toHaveBeenCalledWith({where:{id:'n1'},data:{emailStatus:'PREFERENCE_DISABLED'}})});
  it('limite un même participant et une même session à un email sur 30 minutes',async()=>{mocks.findFirst.mockResolvedValue({id:'old'});const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);await sendJoinEmail(input);expect(fetchMock).not.toHaveBeenCalled();expect(mocks.update).toHaveBeenLastCalledWith({where:{id:'n1'},data:{emailStatus:'RATE_LIMITED'}})});
});
