import {Suspense} from 'react';
import LoginForm from '@/components/LoginForm';
export default function Login(){return <main className="section wrap auth-page"><h1>Connexion</h1><Suspense fallback={<p>Chargement…</p>}><LoginForm/></Suspense></main>}
