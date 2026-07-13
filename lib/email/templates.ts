export type EmailTemplate = {subject: string; text: string; html: string};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]!));
const link = (url: string, label = url) => `<a href="${escapeHtml(url)}" style="color:#075de8">${escapeHtml(label)}</a>`;

function layout(title: string, french: string, english: string, action?: {label: string; url: string}) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f3f6fb;color:#171b24;font-family:Arial,sans-serif"><div style="max-width:680px;margin:auto;padding:24px"><div style="background:#090b10;color:white;padding:20px;border-radius:12px 12px 0 0"><h1 style="margin:0;font-size:26px">RetroCoop</h1></div><main style="background:white;padding:28px;border:1px solid #d5dfed"><h2>${escapeHtml(title)}</h2><section lang="fr" style="white-space:pre-line">${french}</section>${action?`<p style="margin:28px 0"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:#075de8;color:white;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:bold">${escapeHtml(action.label)}</a></p>`:''}<hr style="border:0;border-top:1px solid #d5dfed;margin:28px 0"><section lang="en" style="white-space:pre-line">${english}</section></main></div></body></html>`;
}

export function welcomeTemplate(appUrl: string): EmailTemplate {
  const vibe='https://vibecodeclub.fr',youtube='https://www.youtube.com/@vassiou';
  const french=`Bonjour et bienvenue sur RetroCoop ! 🎮

Je m’appelle Vincent Vallet. Je suis formateur, créateur d’applications et passionné par les possibilités offertes par l’intelligence artificielle et le vibecoding, c’est-à-dire le fait de concevoir et de coder des projets avec l’aide des IA.

J’ai créé RetroCoop avec une idée simple : permettre aux passionnés de jeux rétro de se retrouver facilement, d’organiser des sessions et de jouer en ligne avec leurs amis, mais aussi avec de nouvelles personnes partageant la même passion.

Ce site a été conçu et mis en ligne en seulement une journée de travail grâce au vibecoding, sans avoir dépensé un seul centime pour son hébergement. Ce projet montre qu’il est aujourd’hui possible de transformer très rapidement une idée en une véritable application fonctionnelle, même avec des moyens limités.

J’espère sincèrement que RetroCoop vous permettra de redécouvrir vos jeux préférés, de rencontrer d’autres joueurs et, surtout, de passer de bons moments ensemble.

Vous pouvez également rejoindre ma communauté consacrée au vibecoding, à l’intelligence artificielle et à la création de projets :

VibeCode Club :
${vibe}

Vous pouvez aussi découvrir les coulisses de mes projets, mes expérimentations et mes vidéos sur ma chaîne YouTube :

YouTube — @vassiou :
${youtube}

⚠️ Important concernant les jeux

RetroCoop ne fournit et n’héberge aucune ROM ni aucun BIOS.

Vous devez toujours charger uniquement une ROM correspondant à un jeu physique que vous possédez légalement, et que vous êtes légalement autorisé à copier et à utiliser. La possession d’un jeu physique ne vous autorise pas à télécharger une ROM provenant d’une source non autorisée.

Vous restez responsable de la provenance et de l’utilisation des fichiers que vous chargez dans votre navigateur.

Merci de faire partie de l’aventure RetroCoop.

Bon jeu et belles rencontres !

Vincent Vallet
Créateur de RetroCoop
${vibe}
${youtube}`;
  const english=`ENGLISH VERSION

Hello and welcome to RetroCoop! 🎮

My name is Vincent Vallet. I am a trainer, application creator, and enthusiast of the possibilities offered by artificial intelligence and vibe coding—that is, designing and coding projects with the help of AI.

I created RetroCoop with a simple idea: to help retro gaming enthusiasts find each other, organize gaming sessions, and play online with friends or with new people who share the same passion.

This website was designed and launched in just one day of work thanks to vibe coding, without spending a single cent on hosting. This project shows that it is now possible to turn an idea into a real, functional online application very quickly, even with limited resources.

I sincerely hope RetroCoop will help you rediscover your favorite games, meet other players, and, most importantly, enjoy great moments together.

You can also join my community dedicated to vibe coding, artificial intelligence, and creative projects:

VibeCode Club:
${vibe}

You can discover behind-the-scenes content about my projects, experiments, and creations on my YouTube channel:

YouTube — @vassiou:
${youtube}

⚠️ Important information about games

RetroCoop does not provide or host any ROMs or BIOS files.

You must only load a ROM corresponding to a physical game that you legally own and that you are legally authorized to copy and use. Owning a physical copy of a game does not automatically authorize you to download a ROM from an unauthorized source.

You remain responsible for the origin and use of any files loaded into your browser.

Thank you for being part of the RetroCoop adventure.

Have fun and enjoy meeting other players!

Vincent Vallet
Creator of RetroCoop
${vibe}
${youtube}`;
  const htmlFrench=escapeHtml(french).replaceAll('\n','<br>').replaceAll(vibe,link(vibe)).replaceAll(youtube,link(youtube,'YouTube — @vassiou'));
  const htmlEnglish=escapeHtml(english).replaceAll('\n','<br>').replaceAll(vibe,link(vibe)).replaceAll(youtube,link(youtube,'YouTube — @vassiou'));
  return{subject:'Bienvenue sur RetroCoop — Welcome to RetroCoop',text:`${french}\n\n${english}`,html:layout('Bienvenue sur RetroCoop',htmlFrench,htmlEnglish,{label:'Découvrir RetroCoop',url:appUrl})};
}

type ParticipationTemplateInput={hostUsername:string;participantUsername:string;game:string;startsAt:Date;timezone:string;participantCount:number;maximumCapacity:number;sessionUrl:string};
function dates(input:ParticipationTemplateInput){return{fr:new Intl.DateTimeFormat('fr-FR',{dateStyle:'long',timeStyle:'short',timeZone:input.timezone}).format(input.startsAt),en:new Intl.DateTimeFormat('en-GB',{dateStyle:'long',timeStyle:'short',timeZone:input.timezone}).format(input.startsAt)}}

export function participantJoinedTemplate(input:ParticipationTemplateInput): EmailTemplate {
  const date=dates(input),fr=`Bonjour ${input.hostUsername},\n\n${input.participantUsername} a rejoint votre session pour jouer à ${input.game}, prévue le ${date.fr}.\n\nVoir la session :\n${input.sessionUrl}\n\nÀ bientôt sur RetroCoop.`,en=`ENGLISH VERSION\n\nHello ${input.hostUsername},\n\n${input.participantUsername} joined your session for ${input.game}, scheduled for ${date.en}.\n\nView the session:\n${input.sessionUrl}\n\nSee you soon on RetroCoop.`;
  return{subject:'Un joueur a rejoint votre session RetroCoop — A player joined your RetroCoop session',text:`${fr}\n\n---\n\n${en}`,html:layout('Un joueur a rejoint votre session',escapeHtml(fr).replaceAll('\n','<br>'),escapeHtml(en).replaceAll('\n','<br>'),{label:'Voir la session',url:input.sessionUrl})};
}

export function participantLeftTemplate(input:ParticipationTemplateInput): EmailTemplate {
  const date=dates(input),fr=`Bonjour ${input.hostUsername},\n\n${input.participantUsername} a quitté votre session pour jouer à ${input.game}, prévue le ${date.fr}.\n\nIl reste désormais ${input.participantCount} participant(s) sur ${input.maximumCapacity}.\n\nVoir la session :\n${input.sessionUrl}\n\nÀ bientôt sur RetroCoop.`,en=`ENGLISH VERSION\n\nHello ${input.hostUsername},\n\n${input.participantUsername} has left your session for ${input.game}, scheduled for ${date.en}.\n\nThere are now ${input.participantCount} participant(s) out of ${input.maximumCapacity}.\n\nView the session:\n${input.sessionUrl}\n\nSee you soon on RetroCoop.`;
  return{subject:'Un joueur a quitté votre session RetroCoop — A player left your RetroCoop session',text:`${fr}\n\n---\n\n${en}`,html:layout('Un joueur a quitté votre session',escapeHtml(fr).replaceAll('\n','<br>'),escapeHtml(en).replaceAll('\n','<br>'),{label:'Voir la session',url:input.sessionUrl})};
}

export function accountDeletedTemplate(): EmailTemplate {
  const french=`Bonjour,\n\nNous vous confirmons que votre compte RetroCoop a été supprimé.\n\nVos informations de connexion et vos données personnelles actives ont été supprimées ou anonymisées conformément à la politique de confidentialité de RetroCoop.\n\nVous avez été déconnecté de tous les appareils et vous ne pouvez plus vous connecter avec ce compte.\n\nCertaines traces techniques ou données strictement nécessaires à la sécurité, à la modération, à la défense de droits ou aux sauvegardes peuvent être conservées temporairement pendant la durée indiquée dans notre politique de confidentialité.\n\nMerci d’avoir utilisé RetroCoop.\n\nVincent Vallet\nCréateur de RetroCoop\nhttps://vibecodeclub.fr\nhttps://www.youtube.com/@vassiou`;
  const english=`ENGLISH VERSION\n\nHello,\n\nThis email confirms that your RetroCoop account has been deleted.\n\nYour active login information and personal data have been deleted or anonymized in accordance with the RetroCoop Privacy Policy.\n\nYou have been signed out from all devices and can no longer log in with this account.\n\nSome technical records or data strictly required for security, moderation, legal claims, or backups may be temporarily retained for the period described in our Privacy Policy.\n\nThank you for using RetroCoop.\n\nVincent Vallet\nCreator of RetroCoop\nhttps://vibecodeclub.fr\nhttps://www.youtube.com/@vassiou`;
  return{subject:'Votre compte RetroCoop a été supprimé — Your RetroCoop account has been deleted',text:`${french}\n\n---\n\n${english}`,html:layout('Compte RetroCoop supprimé',escapeHtml(french).replaceAll('\n','<br>'),escapeHtml(english).replaceAll('\n','<br>'))};
}
