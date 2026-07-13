'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';
import LogoutButton from '@/components/LogoutButton';
import NotificationBell from '@/components/NotificationBell';

type Account={id:string;username:string;role:'USER'|'MODERATOR'|'ADMIN'};
export default function AccountNav(){
  const pathname=usePathname(),[user,setUser]=useState<Account|null|undefined>(undefined);
  useEffect(()=>{let controller=new AbortController();const load=()=>{controller.abort();controller=new AbortController();fetch('/api/auth/me',{cache:'no-store',credentials:'include',signal:controller.signal}).then(response=>response.ok?response.json():null).then(result=>setUser(result?.user??null)).catch(error=>{if(error?.name!=='AbortError')setUser(null)})};load();window.addEventListener('retrocoop-account-updated',load);return()=>{controller.abort();window.removeEventListener('retrocoop-account-updated',load)}},[pathname]);
  if(user===undefined)return <span className="account-loading" aria-label="Vérification de la connexion">Compte…</span>;
  return user?<div className="account-nav" aria-label={`Connecté en tant que ${user.username}`}><span>{user.username}</span><NotificationBell/><Link href="/sessions/mes-sessions">Mes sessions</Link><Link href="/compte">Compte</Link>{user.role==='ADMIN'&&<Link href="/admin/moderation/chat">Modération</Link>}<LogoutButton/></div>:<Link href="/connexion">Connexion / Inscription</Link>;
}
