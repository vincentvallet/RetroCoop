import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';

const mocks=vi.hoisted(()=>({create:vi.fn(),updateDelivery:vi.fn(),findUnique:vi.fn(),count:vi.fn(),updateNotification:vi.fn()}));
vi.mock('../lib/db',()=>({prisma:{
  emailDelivery:{create:mocks.create,update:mocks.updateDelivery,findUnique:mocks.findUnique,count:mocks.count},
  notification:{update:mocks.updateNotification},
}}));

import {sendAccountDeletedEmail,sendParticipantJoinedEmail,sendParticipantLeftEmail,sendWelcomeEmail} from '../lib/email';
import {accountDeletedTemplate,participantLeftTemplate,welcomeTemplate} from '../lib/email/templates';

const participation={notificationId:'n1',sessionId:'s1',participantId:'p1',participantName:'Alice',hostId:'h1',hostName:'Bob',hostEmail:'controlled@retrocoop.test',gameTitle:'Streets of Rage 2',startsAt:new Date('2030-07-15T18:00:00Z'),timezone:'Europe/Paris',participantCount:2,maximumCapacity:4,participationVersion:3,enabled:true};

describe('service transactionnel centralisé',()=>{
  beforeEach(()=>{
    let sequence=0;
    mocks.create.mockImplementation(async({data})=>({id:`delivery-${++sequence}`,...data}));
    mocks.updateDelivery.mockResolvedValue({});mocks.findUnique.mockResolvedValue(null);mocks.count.mockResolvedValue(0);mocks.updateNotification.mockResolvedValue({});
    process.env.RESEND_API_KEY='test-key';process.env.EMAIL_FROM='RetroCoop <test@example.com>';process.env.APP_URL='https://retrocoop.example';
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:200,json:async()=>({id:'provider-1'})}));
  });
  afterEach(()=>{vi.unstubAllGlobals();delete process.env.RESEND_API_KEY;delete process.env.EMAIL_FROM;delete process.env.APP_URL;vi.clearAllMocks()});

  it('teste les quatre événements avec HTML, texte et les clés attendues',async()=>{
    await sendWelcomeEmail({userId:'u1',email:'controlled@retrocoop.test'});
    await sendParticipantJoinedEmail(participation);
    await sendParticipantLeftEmail({...participation,participationVersion:4});
    await sendAccountDeletedEmail({userId:'u1',email:'controlled@retrocoop.test',deletionVersion:2});
    expect(mocks.create.mock.calls.map(call=>call[0].data.eventType)).toEqual(['WELCOME','PARTICIPANT_JOINED','PARTICIPANT_LEFT','ACCOUNT_DELETED']);
    expect(mocks.create.mock.calls.map(call=>call[0].data.idempotencyKey)).toEqual(['welcome:u1','session-participant-joined:s1:p1:3','session-participant-left:s1:p1:4','account-deleted:u1:2']);
    const bodies=(fetch as ReturnType<typeof vi.fn>).mock.calls.map(call=>JSON.parse(call[1].body));
    expect(bodies.every(body=>body.html&&body.text)).toBe(true);
  });

  it('contient les objets exacts, les deux langues et les liens canoniques',()=>{
    const welcome=welcomeTemplate('https://retrocoop.example'),left=participantLeftTemplate({hostUsername:'Bob',participantUsername:'Alice',game:'Sonic',startsAt:participation.startsAt,timezone:'Europe/Paris',participantCount:1,maximumCapacity:4,sessionUrl:'https://retrocoop.example/sessions/s1'}),deleted=accountDeletedTemplate();
    expect(welcome.subject).toBe('Bienvenue sur RetroCoop — Welcome to RetroCoop');
    expect(welcome.text).toContain('Bonjour et bienvenue');expect(welcome.text).toContain('ENGLISH VERSION');
    expect(welcome.html).toContain('https://vibecodeclub.fr');expect(welcome.html).toContain('https://www.youtube.com/@vassiou');expect(welcome.html).toContain('Découvrir RetroCoop');
    expect(left.subject).toBe('Un joueur a quitté votre session RetroCoop — A player left your RetroCoop session');
    expect(left.text).toContain('Il reste désormais 1 participant(s) sur 4.');expect(left.text).toContain('There are now 1 participant(s) out of 4.');
    expect(deleted.subject).toBe('Votre compte RetroCoop a été supprimé — Your RetroCoop account has been deleted');
  });

  it('ne contacte pas Resend sans configuration et conserve une trace SKIPPED',async()=>{
    delete process.env.RESEND_API_KEY;
    const result=await sendWelcomeEmail({userId:'u2',email:'controlled@retrocoop.test'});
    expect(result.status).toBe('SKIPPED');expect(fetch).not.toHaveBeenCalled();
    expect(mocks.updateDelivery).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({status:'SKIPPED',lastErrorCode:'EMAIL_DISABLED'})}));
  });

  it('absorbe une panne réseau et journalise FAILED sans adresse',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));const warning=vi.spyOn(console,'warn').mockImplementation(()=>undefined);
    const result=await sendParticipantLeftEmail(participation);
    expect(result.status).toBe('FAILED');expect(warning).toHaveBeenCalledWith('Transactional email failed.',expect.not.objectContaining({email:expect.anything()}));warning.mockRestore();
  });

  it('respecte la préférence et supprime les rafales persistantes',async()=>{
    const disabled=await sendParticipantLeftEmail({...participation,enabled:false});expect(disabled.status).toBe('SKIPPED');expect(fetch).not.toHaveBeenCalled();
    mocks.count.mockResolvedValue(6);const warning=vi.spyOn(console,'warn').mockImplementation(()=>undefined);const limited=await sendParticipantJoinedEmail({...participation,participationVersion:9});expect(limited.status).toBe('SKIPPED');expect(limited.errorCode).toBe('PARTICIPATION_RATE_LIMITED');warning.mockRestore();
  });
});
