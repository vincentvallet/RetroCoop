import Link from 'next/link';
import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/auth';
import {publicUsername} from '@/lib/public-user';
import AccountProfileForm from '@/components/AccountProfileForm';
import PasswordChangeForm from '@/components/PasswordChangeForm';
import EmailPreference from '@/components/EmailPreference';
import DeleteAccountForm from '@/components/DeleteAccountForm';

export default async function AccountPage(){const user=await currentUser();if(!user)redirect('/connexion?returnTo=/compte');const username=publicUsername(user.username,user.id);return <main className="section wrap account-page"><h1>Mon compte</h1><section><h2>Mon profil</h2><p>Identité publique actuelle : <strong>{username}</strong></p><AccountProfileForm initialUsername={username}/><p><Link href="/contact?category=PERSONAL_DATA">Exercer mes droits sur mes données</Link></p></section><section><h2>Sécurité</h2><PasswordChangeForm/></section><section><h2>Préférences de notifications</h2><EmailPreference initialJoin={user.joinEmailEnabled} initialLeave={user.leaveEmailEnabled}/><p>Les notifications internes restent actives indépendamment de ces choix.</p></section><section><h2>Zone sensible</h2><DeleteAccountForm/></section></main>}
