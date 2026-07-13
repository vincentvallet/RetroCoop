import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {currentUser} from '@/lib/auth';
import {sessionById} from '@/lib/sessions';
import SessionDetailClient from '@/components/SessionDetailClient';
export const dynamic='force-dynamic';
export default async function SessionDetail({params}:{params:Promise<{id:string}>}){const {id}=await params,user=await currentUser(),session=await sessionById(id,user?.id);if(!session)notFound();return <main className="section wrap session-detail"><Link href="/sessions">← Toutes les sessions</Link><div className="session-title">{session.game.coverUrl&&<Image src={session.game.coverUrl} alt="" width={100} height={140}/>}<div><h1>{session.game.title}</h1><p>Organisée par <strong>{session.creator.username}</strong></p></div></div><SessionDetailClient initialSession={session} authenticated={Boolean(user)}/></main>}
