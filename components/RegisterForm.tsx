'use client';
import {FormEvent,useCallback,useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
type Challenge={question:string;token:string};
export default function RegisterForm(){
  const router=useRouter();const challengeLoaded=useRef(false);const [challenge,setChallenge]=useState<Challenge|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(false);
  const loadChallenge=useCallback(async()=>{const response=await fetch('/api/auth/challenge',{cache:'no-store',credentials:'include'});if(response.ok)setChallenge(await response.json());else setError('Impossible de charger la vérification anti-spam.');},[]);
  // Chargement initial unique, y compris sous le double montage de React en développement.
  useEffect(()=>{if(challengeLoaded.current)return;challengeLoaded.current=true;void loadChallenge()},[loadChallenge]);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!challenge)return;setLoading(true);setError('');const form=new FormData(event.currentTarget);const response=await fetch('/api/auth/register',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.get('email'),username:form.get('username'),password:form.get('password'),answer:form.get('answer'),website:form.get('website'),challengeToken:challenge.token})});const result=await response.json();setLoading(false);if(response.ok){router.push('/catalogue?notice=registered');router.refresh();return}setError(result.error??'Inscription impossible.');setChallenge(null);void loadChallenge()}
  return <form className="auth-card" onSubmit={submit}>
    <label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required/></label>
    <label>Pseudo<input name="username" autoComplete="username" minLength={3} maxLength={24} required/></label>
    <label>Mot de passe<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required/></label>
    <label className="honeypot" aria-hidden="true">Site web<input name="website" tabIndex={-1} autoComplete="off"/></label>
    <label>{challenge?.question??'Chargement de la vérification…'}<input name="answer" inputMode="numeric" disabled={!challenge} required/></label>
    <label className="check"><input type="checkbox" required/> J’accepte les CGU et la politique de confidentialité.</label>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <button className="btn" disabled={loading||!challenge}>{loading?'Création…':'Créer mon compte'}</button>
  </form>;
}
