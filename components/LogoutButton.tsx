'use client';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
export default function LogoutButton() { const router=useRouter(),[loading,setLoading]=useState(false); return <button className="nav-button" disabled={loading} onClick={async()=>{setLoading(true);await fetch('/api/auth/logout',{method:'POST',credentials:'include'});router.push('/connexion?notice=logout');router.refresh()}}>{loading?'Déconnexion…':'Se déconnecter'}</button>; }
