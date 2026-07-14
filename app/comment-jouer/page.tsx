export const metadata = {
  title: 'Organiser une session',
  description: 'Découvrez comment convenir d’une date et organiser une session de jeu rétro multijoueur avec RetroCoop.',
};

export default function HowToPlay() {
  return <main className="section wrap how-to">
    <h1>Organiser une session</h1>
    <p>RetroCoop est un lieu de rencontre destiné aux passionnés de jeux rétro multijoueurs. Le site permet de convenir ensemble d’une date pour jouer à un jeu.</p>
    <p>RetroCoop ne fournit et n’héberge aucun jeu, aucune ROM et aucun BIOS. Les participants choisissent librement le matériel, le logiciel ou la plateforme qu’ils souhaitent utiliser pour leur session.</p>
    <p>RetroCoop propose une interface web gratuite et facultative codée en quelques heures par IA. L’hôte peut y charger localement, dans la mémoire de son navigateur, un fichier compatible qu’il est légalement autorisé à utiliser. Ce fichier reste sur son appareil : il n’est ni téléversé sur un serveur, ni transmis à l’autre participant. L’autre participant reçoit uniquement le flux de la partie et peut envoyer ses commandes à distance.</p>
    <p>Avant de lancer une session, l’hôte doit confirmer disposer des droits nécessaires pour utiliser le fichier sélectionné. Chaque participant reste responsable du respect des droits et des conditions d’utilisation applicables au jeu concerné. Les deux participants peuvent également communiquer par micro dans cette même interface.</p>
    <p className="external-link-line"><a href="https://partigo-retro-online.onrender.com" target="_blank" rel="noopener noreferrer" aria-label="Découvrir l’interface — lien externe, nouvel onglet">Découvrir l’interface</a></p>
  </main>;
}
