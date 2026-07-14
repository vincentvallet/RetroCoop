'use client';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import {useCallback,useEffect,useMemo,useState} from 'react';
import gamesData from '@/data/normalized/megadrive-games.json';
import {CatalogueGame,toCatalogueGame} from '@/lib/games';
import {mediaUrl} from '@/lib/media';
import {GameplayGallery} from '@/components/GameplayGallery';

const navigationKey='retrocoop:game-navigation';
const games=(gamesData as CatalogueGame[]).map(toCatalogueGame);

function storedOrder(games:CatalogueGame[],slug:string){
  const fallback=games.map(game=>game.slug);
  try{
    const value=JSON.parse(sessionStorage.getItem(navigationKey)??'null') as {slugs?:string[];savedAt?:number}|null;
    if(!value?.slugs?.includes(slug)||!value.savedAt||Date.now()-value.savedAt>30*60_000)return fallback;
    const available=new Set(fallback),slugs=value.slugs.filter(item=>available.has(item));
    return slugs.includes(slug)?slugs:fallback;
  }catch{return fallback}
}

export function GameDetailNavigator({initialSlug}:{initialSlug:string}){
  const bySlug=useMemo(()=>new Map(games.map(game=>[game.slug,game])),[]);
  const [slug,setSlug]=useState(initialSlug),[order,setOrder]=useState(()=>games.map(game=>game.slug));
  const index=Math.max(0,order.indexOf(slug));
  const game=bySlug.get(slug)??bySlug.get(initialSlug)!;
  const adjacent=useCallback((offset:number)=>order[(index+offset+order.length)%order.length],[index,order]);
  const previous=bySlug.get(adjacent(-1))!,next=bySlug.get(adjacent(1))!;

  const show=useCallback((nextSlug:string,push=true)=>{
    if(!bySlug.has(nextSlug))return;
    setSlug(nextSlug);
    if(push)history.pushState({retroCoopGame:true},'',`/jeux/megadrive/${nextSlug}`);
    window.scrollTo({top:0,behavior:'instant'});
  },[bySlug]);

  useEffect(()=>{
    const remembered=storedOrder(games,initialSlug);queueMicrotask(()=>setOrder(remembered));
    const onPop=()=>{const candidate=location.pathname.split('/').filter(Boolean).at(-1);if(candidate&&bySlug.has(candidate))setSlug(candidate)};
    addEventListener('popstate',onPop);return()=>removeEventListener('popstate',onPop);
  },[bySlug,initialSlug]);

  useEffect(()=>{
    const targets=new Set<string>();
    for(const offset of [-1,1]){const item=bySlug.get(adjacent(offset));if(item?.coverUrl)targets.add(mediaUrl(item.coverUrl));if(item?.gameplayImages?.[0]?.path)targets.add(mediaUrl(item.gameplayImages[0].path))}
    targets.forEach(src=>{const image=new window.Image();image.decoding='async';image.src=src});
  },[adjacent,bySlug]);

  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      const target=event.target as HTMLElement|null;
      if(target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(target?.tagName??'')||document.querySelector('[role="dialog"]'))return;
      event.preventDefault();show(event.key==='ArrowLeft'?adjacent(-1):adjacent(1));
    };
    addEventListener('keydown',onKey);return()=>removeEventListener('keydown',onKey);
  },[adjacent,show]);

  if(!game)return null;
  return <main className="section wrap game-navigator" data-testid="game-navigator" data-game-slug={game.slug} data-context-size={order.length}>
    <div className="game-nav-top"><Link href="/catalogue">← Jeux coop MD</Link><span aria-live="polite">{index+1} / {order.length}</span></div>
    <div className="game-nav-shell">
      <button className="game-nav-arrow previous" type="button" onClick={()=>show(previous.slug)} aria-label={`Jeu précédent : ${previous.title}`} title="Jeu précédent (flèche gauche)">‹</button>
      <div className="game-detail">
        <div className="cover">{game.coverUrl?<img key={game.coverUrl} src={mediaUrl(game.coverUrl)} alt={game.coverAlt??`Jaquette de ${game.title}`} width="500" height="700" loading="eager" decoding="async" fetchPriority="high"/>:<span className="cover-placeholder"><span className="pixel">RETRO<br/>COOP</span><small>Jaquette indisponible</small></span>}</div>
        <article><h1>{game.title}</h1><p>{game.releaseYear??'Année à vérifier'} · {game.region??'Région à vérifier'} · {game.playerMax?`jusqu’à ${game.playerMax} joueurs`:'nombre de joueurs à vérifier'}</p>{game.genres.map(genre=><span className="badge" key={genre}>{genre}</span>)}<p><Link className="btn" href={`/sessions/nouvelle?jeu=${game.slug}`}>Proposer une partie</Link></p></article>
      </div>
      <button className="game-nav-arrow next" type="button" onClick={()=>show(next.slug)} aria-label={`Jeu suivant : ${next.title}`} title="Jeu suivant (flèche droite)">›</button>
    </div>
    <nav className="game-nav-labels" aria-label="Navigation entre les jeux"><button type="button" onClick={()=>show(previous.slug)}>← {previous.title}</button><button type="button" onClick={()=>show(next.slug)}>{next.title} →</button></nav>
    <GameplayGallery key={game.slug} title={game.title} images={game.gameplayImages??[]}/>
  </main>;
}
