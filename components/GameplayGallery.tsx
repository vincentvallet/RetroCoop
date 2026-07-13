'use client';
import Image from 'next/image';
import {useEffect,useState} from 'react';
import {GameplayImage} from '@/lib/games';

export function GameplayGallery({title,images}:{title:string;images:GameplayImage[]}){
  const [active,setActive]=useState<number|null>(null);
  useEffect(()=>{if(active===null)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setActive(null);if(event.key==='ArrowRight')setActive(value=>value===null?null:(value+1)%images.length);if(event.key==='ArrowLeft')setActive(value=>value===null?null:(value-1+images.length)%images.length)};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close)},[active,images.length]);
  if(!images.length)return null;
  return <section className="gameplay-gallery" aria-labelledby="gameplay-title"><h2 id="gameplay-title">Aperçu du gameplay</h2><div className="gameplay-grid">{images.slice(0,3).map((image,index)=><button type="button" key={image.path} onClick={()=>setActive(index)} aria-label={`Agrandir la capture ${index+1} de ${title}`}><Image src={image.path} alt={`Capture de gameplay ${images.length>1?`${index+1} `:''}de ${title} sur Mega Drive`} width={image.width} height={image.height} loading="lazy"/></button>)}</div>{active!==null&&<div className="media-modal" role="dialog" aria-modal="true" aria-label={`Capture de gameplay de ${title}`} onClick={()=>setActive(null)}><button className="modal-close" type="button" onClick={()=>setActive(null)} aria-label="Fermer">×</button><Image src={images[active].path} alt={`Capture de gameplay ${active+1} de ${title} sur Mega Drive`} width={images[active].width} height={images[active].height} priority onClick={event=>event.stopPropagation()}/>{images.length>1&&<div className="modal-nav"><button type="button" onClick={event=>{event.stopPropagation();setActive((active-1+images.length)%images.length)}}>Précédente</button><button type="button" onClick={event=>{event.stopPropagation();setActive((active+1)%images.length)}}>Suivante</button></div>}</div>}</section>;
}
