import Image from 'next/image';
import Link from 'next/link';
import {listPublicSessions} from '@/lib/sessions';
export const dynamic='force-dynamic';

export default async function Sessions({searchParams}:{searchParams:Promise<{created?:string}>}){
  const [{created},sessions]=await Promise.all([searchParams,listPublicSessions()]);
  return <main className="section wrap"><div className="sessions-heading"><div><h1>Prochaines sessions</h1><p>Retrouvez les parties publiées par la communauté.</p></div><Link className="btn" href="/sessions/nouvelle">Créer une session</Link></div>
    {sessions.length?<div className="session-list">{sessions.map(session=><article className={`session-card${created===session.id?' newly-created':''}`} key={session.id} data-session-id={session.id}>{session.game.coverUrl&&<Image src={session.game.coverUrl} alt="" width={72} height={100}/>}<div><h2>{session.game.title}</h2><p><time dateTime={session.startsAt}>{new Intl.DateTimeFormat('fr-FR',{dateStyle:'full',timeStyle:'short',timeZone:session.timezone}).format(new Date(session.startsAt))}</time></p><p>Organisée par <strong>{session.creator.username||session.creator.email}</strong> · {session.participantCount}/{session.maxPlayers} joueurs</p><span className="badge">Ouverte</span></div></article>)}</div>:<p className="empty-state">Aucune session publique à venir. Soyez la première personne à proposer une partie.</p>}
  </main>;
}
