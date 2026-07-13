'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';
import LogoutButton from '@/components/LogoutButton';

type Account={id:string;username:string|null;email:string};
export default function AccountNav(){
  const pathname=usePathname(),[user,setUser]=useState<Account|null|undefined>(undefined);
  useEffect(()=>{const controller=new AbortController();fetch('/api/auth/me',{cache:'no-store',credentials:'include',signal:controller.signal}).then(response=>response.ok?response.json():null).then(result=>setUser(result?.user??null)).catch(error=>{if(error?.name!=='AbortError')setUser(null)});return()=>controller.abort()},[pathname]);
  if(user===undefined)return <span className="account-loading" aria-label="Vérification de la connexion">Compte…</span>;
  return user?<div className="account-nav" aria-label={`Connecté en tant que ${user.username||user.email}`}><span>{user.username||user.email}</span><Link href="/sessions/mes-sessions">Mes sessions</Link><LogoutButton/></div>:<Link href="/connexion">Connexion / Inscription</Link>;
}
