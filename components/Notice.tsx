'use client';
import {useSearchParams} from 'next/navigation';
const notices:Record<string,string>={registered:'Votre compte a bien été créé. Vous êtes maintenant connecté.',login:'Connexion réussie.',logout:'Vous êtes déconnecté.','session-published':'Votre session a bien été publiée.'};
export default function Notice(){const value=notices[useSearchParams().get('notice')??''];return value?<p className="global-notice" role="status">{value}</p>:null}
