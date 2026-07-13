'use client';
import {useMemo,useState} from 'react';
import {useRouter} from 'next/navigation';
import {GameAutocomplete} from '@/components/GameAutocomplete';
import {GameCard} from '@/components/GameCard';
import {CatalogueGame,normalizeGameTitle} from '@/lib/games';

export function CatalogueClient({games,initialSort='az'}:{games:CatalogueGame[];initialSort?:string}){
  const router=useRouter();
  const [query,setQuery]=useState(''),[players,setPlayers]=useState(''),[year,setYear]=useState(''),[sort,setSort]=useState(initialSort);
  const [coop,setCoop]=useState(false),[versus,setVersus]=useState(false),[rated,setRated]=useState(false),[tags,setTags]=useState<string[]>([]);
  const years=useMemo(()=>[...new Set(games.map(game=>game.releaseYear).filter((value):value is number=>Boolean(value)))].sort((a,b)=>b-a),[games]);
  const availableTags=useMemo(()=>[...new Set(games.flatMap(game=>game.tags?.length?game.tags:game.genres??[]))].sort((a,b)=>a.localeCompare(b,'fr')),[games]);
  const list=useMemo(()=>{
    const needle=normalizeGameTitle(query);
    return games
      .filter(game=>!needle||normalizeGameTitle(game.title).includes(needle))
      .filter(game=>!players||(game.playerMax??0)>=Number(players))
      .filter(game=>!year||game.releaseYear===Number(year))
      .filter(game=>!coop||game.coop).filter(game=>!versus||game.versus).filter(game=>!rated||game.externalRating!=null)
      .filter(game=>!tags.length||tags.every(tag=>(game.tags?.length?game.tags:game.genres).includes(tag)))
      .sort((a,b)=>{if(sort==='za')return b.sortTitle.localeCompare(a.sortTitle,'fr');if(sort==='newest')return(b.releaseYear??0)-(a.releaseYear??0)||a.sortTitle.localeCompare(b.sortTitle,'fr');if(sort==='oldest')return(a.releaseYear??9999)-(b.releaseYear??9999)||a.sortTitle.localeCompare(b.sortTitle,'fr');if(sort==='most-played')return(b.organizedSessionCount??0)-(a.organizedSessionCount??0)||a.sortTitle.localeCompare(b.sortTitle,'fr');if(sort==='best-rated')return(b.externalRating??-1)-(a.externalRating??-1)||a.sortTitle.localeCompare(b.sortTitle,'fr');if(sort==='players')return(b.playerMax??0)-(a.playerMax??0)||a.sortTitle.localeCompare(b.sortTitle,'fr');return a.sortTitle.localeCompare(b.sortTitle,'fr')});
  },[games,query,players,year,sort,coop,versus,rated,tags]);
  const reset=()=>{setQuery('');setPlayers('');setYear('');setSort('az');setCoop(false);setVersus(false);setRated(false);setTags([])};
  const rememberNavigation=(game:CatalogueGame)=>{try{sessionStorage.setItem('retrocoop:game-navigation',JSON.stringify({slugs:list.map(item=>item.slug),current:game.slug,savedAt:Date.now()}))}catch{}}
  return <>
    <p aria-live="polite">{list.length===games.length?`${games.length} jeux affichés`:`${list.length} jeux affichés sur ${games.length}`}</p>
    <details className="filter-panel" open><summary>Filtres et tri</summary><div className="filters">
      <GameAutocomplete games={games} label="Rechercher" placeholder="Rechercher un jeu" onQueryChange={setQuery} onSelect={game=>{rememberNavigation(game);router.push(`/jeux/megadrive/${game.slug}`)}}/>
      <label>Joueurs<select aria-label="Joueurs" value={players} onChange={event=>setPlayers(event.target.value)}><option value="">Tous</option><option value="2">2 joueurs et plus</option><option value="4">4 joueurs et plus</option></select></label>
      <label>Année<select data-testid="year-filter" aria-label="Année" value={year} onChange={event=>setYear(event.target.value)}><option value="">Toutes</option>{years.map(value=><option key={value} value={value}>{value}</option>)}</select></label>
      <label>Tri<select aria-label="Tri" value={sort} onChange={event=>setSort(event.target.value)}><option value="az">Ordre alphabétique</option><option value="za">Ordre alphabétique inversé</option><option value="newest">Plus récents</option><option value="oldest">Plus anciens</option><option value="most-played">Les plus joués sur Retro Coop</option><option value="best-rated">Meilleurs jeux selon IGDB</option><option value="players">Nombre de joueurs</option></select></label>
      <div className="check-filters"><label><input type="checkbox" checked={coop} onChange={event=>setCoop(event.target.checked)}/> Coopération</label><label><input type="checkbox" checked={versus} onChange={event=>setVersus(event.target.checked)}/> Versus</label><label><input type="checkbox" checked={rated} onChange={event=>setRated(event.target.checked)}/> Jeux avec note</label></div>
      <fieldset className="tag-filters"><legend>Tags</legend>{availableTags.map(tag=><label key={tag}><input type="checkbox" checked={tags.includes(tag)} onChange={event=>setTags(values=>event.target.checked?[...values,tag]:values.filter(value=>value!==tag))}/>{tag}</label>)}</fieldset>
      <button className="btn secondary" type="button" onClick={reset}>Réinitialiser les filtres</button>
    </div></details>
    <div className="grid catalogue-grid" onClick={event=>{const link=(event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/jeux/megadrive/"]');const game=link&&list.find(item=>link.pathname.endsWith(`/${item.slug}`));if(game)rememberNavigation(game)}}>{list.map(game=><GameCard key={game.slug} game={game}/>)}</div>
    {!list.length&&<p className="empty-state">Aucun jeu ne correspond à ces filtres.</p>}
  </>;
}
