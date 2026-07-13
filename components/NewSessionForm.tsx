'use client';
import {FormEvent,useState} from 'react';
import {useRouter} from 'next/navigation';
import {GameAutocomplete} from '@/components/GameAutocomplete';
import {CatalogueGame} from '@/lib/games';

export default function NewSessionForm({games,initialSlug}:{games:CatalogueGame[];initialSlug?:string}){
  const router=useRouter();const [gameSlug,setGameSlug]=useState(initialSlug??'');const [error,setError]=useState('');const [loading,setLoading]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setLoading(true);setError('');const form=new FormData(event.currentTarget);const localDateTime=`${form.get('date')}T${form.get('time')}`;const startsAt=new Date(localDateTime);const response=await fetch('/api/sessions',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({gameSlug,startsAtUtc:startsAt.toISOString(),timezone:form.get('timezone'),durationMinutes:Number(form.get('durationMinutes')),maximumPlayers:Number(form.get('maximumPlayers'))})});const result=await response.json();setLoading(false);if(response.ok&&result.session?.id){router.push(`/sessions?notice=session-published&created=${encodeURIComponent(result.session.id)}`);router.refresh()}else setError(result.error??'Impossible de publier la session. Vérifiez la date et réessayez.')}
  return <form className="session-form" onSubmit={submit}>
    <GameAutocomplete games={games} initialSlug={initialSlug} required onSelect={game=>setGameSlug(game.slug)}/>
    <div className="form-row"><label>Date<input type="date" name="date" required/></label><label>Heure<input type="time" name="time" required/></label></div>
    <label>Fuseau horaire<input name="timezone" defaultValue="Europe/Paris" required/></label>
    <label>Durée de la partie<select name="durationMinutes" defaultValue="120"><option value="30">30 minutes</option><option value="60">1 heure</option><option value="90">1 h 30</option><option value="120">2 heures</option><option value="180">3 heures</option></select></label>
    <label>Nombre maximum de joueurs<input type="number" name="maximumPlayers" min="2" max="16" defaultValue="2" required/></label>
    {error&&<p className="form-error" role="alert">{error}</p>}<button className="btn" disabled={loading||!gameSlug}>{loading?'Publication…':'Publier la session'}</button>
  </form>
}
