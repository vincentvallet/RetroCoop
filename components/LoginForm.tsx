'use client';
import Link from 'next/link';
import {FormEvent,useState} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';

export default function LoginForm(){
  const router=useRouter(),params=useSearchParams();
  const [error,setError]=useState(''),[loading,setLoading]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setLoading(true);setError('');const form=new FormData(event.currentTarget);
    const response=await fetch('/api/auth/login',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.get('email'),password:form.get('password')})});
    const result=await response.json();setLoading(false);
    if(response.ok){const requested=params.get('returnTo');const target=requested?.startsWith('/')&&!requested.startsWith('//')?requested:'/catalogue';router.push(`${target}${target.includes('?')?'&':'?'}notice=login`);router.refresh()}else setError(result.error??'Connexion impossible.');
  }
  return <form className="auth-card" onSubmit={submit}>
    <label>Email<input name="email" type="email" autoComplete="email" required/></label>
    <label>Mot de passe<input name="password" type="password" autoComplete="current-password" minLength={1} maxLength={128} required/></label>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <button className="btn" disabled={loading}>{loading?'Connexion…':'Se connecter'}</button>
    <aside className="register-callout"><strong>Vous n’avez pas encore de compte ?</strong><Link className="btn secondary" href="/inscription">Créer un compte</Link></aside>
  </form>;
}
