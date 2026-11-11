// Contenu psycho-éducatif général. À faire relire par une professionnelle
// de santé mentale avant publication.
//
// Les articles sont rédigés en paragraphes : une introduction, puis des
// sections titrées. Un paragraphe = une idée, deux à quatre phrases.

export type Fiche = {
  id: string;
  theme: string;
  vignette: number; // index dans VIGNETTES (src/components/Vignette.tsx)
  titre: string;
  resume: string;
  intro: string;
  sections: { titre: string; paragraphes: string[] }[];
  publieLe?: string; // ISO
  edition?: string | null; // édition spéciale, mise à la une dans Ressources
};

// Date de publication affichée : « 1 octobre 2026 » (ou « 1 oct. 2026 » en court).
export function datePublication(fiche: Fiche, court = false): string | null {
  if (!fiche.publieLe) return null;
  return new Date(fiche.publieLe).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: court ? 'short' : 'long',
    year: 'numeric',
  });
}

// Un article reste « nouveau » pendant 14 jours après sa publication.
const DUREE_NOUVEAUTE_MS = 14 * 86_400_000;

export function estNouvelle(fiche: Fiche, maintenant = Date.now()): boolean {
  if (!fiche.publieLe) return false;
  const age = maintenant - new Date(fiche.publieLe).getTime();
  return age >= 0 && age < DUREE_NOUVEAUTE_MS;
}

export const fiches: Fiche[] = [
  {
    id: 'anxiete',
    theme: 'Anxiété',
    vignette: 0,
    publieLe: '2026-10-01T08:00:00.000Z',
    titre: 'Anxiété',
    resume: 'Comprendre l’anxiété et la calmer au quotidien.',
    intro:
      'L’anxiété est une réaction normale du corps face à ce qu’il perçoit comme un danger. Elle nous prépare à agir. Elle devient un problème quand elle revient trop souvent, qu’elle dure ou qu’elle prend trop de place dans ta journée.',
    sections: [
      {
        titre: 'Ce qui peut se passer',
        paragraphes: [
          'Dans la tête, l’anxiété prend souvent la forme d’inquiétudes difficiles à arrêter : on imagine le pire, on a l’impression que quelque chose de grave va arriver, on tourne en boucle sur les mêmes pensées.',
          'Le corps suit. Le cœur s’accélère, le souffle devient court, les épaules et la mâchoire se crispent. Beaucoup de femmes remarquent aussi un sommeil plus léger ou des réveils au milieu de la nuit. Ces sensations sont désagréables, mais elles ne sont pas dangereuses et finissent toujours par redescendre.',
        ],
      },
      {
        titre: 'Ce qui peut aider sur le moment',
        paragraphes: [
          'La respiration est l’outil le plus rapide. Inspire lentement pendant 5 secondes, puis expire pendant 5 secondes, et recommence pendant quelques minutes. En ralentissant ton souffle, tu envoies à ton corps le signal que tout va bien. L’exercice « Respirer » de l’app te guide pas à pas.',
          'Tu peux aussi revenir au moment présent avec l’ancrage 5-4-3-2-1 : nomme 5 choses que tu vois, 4 que tu peux toucher, 3 que tu entends, 2 odeurs que tu sens et 1 goût dans ta bouche. Cet exercice occupe ton attention et coupe le fil des pensées anxieuses.',
          'Quand l’inquiétude se calme un peu, écris-la. Puis pose-toi deux questions : quelle est la probabilité réelle que cela arrive ? Et que dirais-je à une amie qui vivrait la même chose ? Souvent, on est bien plus douce avec les autres qu’avec soi-même.',
        ],
      },
      {
        titre: 'Au quotidien',
        paragraphes: [
          'Certaines habitudes entretiennent l’anxiété sans qu’on s’en rende compte. Le café, le thé fort, les boissons énergisantes et l’alcool peuvent l’augmenter : essaie de les réduire, surtout l’après-midi.',
          'Bouger chaque jour aide aussi beaucoup. Pas besoin de sport intense : une marche de vingt minutes suffit à faire baisser la tension. Enfin, des horaires de sommeil réguliers rendent le corps plus solide face au stress.',
          'Si l’anxiété t’empêche de vivre normalement, de travailler ou de dormir, parles-en à une médecin ou à une psychologue. L’anxiété se soigne très bien.',
        ],
      },
    ],
  },
  {
    id: 'depression',
    theme: 'Humeur',
    vignette: 2,
    publieLe: '2026-10-01T08:00:00.000Z',
    titre: 'Humeur basse et dépression',
    resume: 'Repérer les signes et faire de petits pas.',
    intro:
      'Tout le monde traverse des jours sans énergie ni envie. Mais quand la tristesse s’installe et ne repart pas, il peut s’agir d’une dépression. Ce n’est ni de la paresse ni un manque de volonté : c’est une maladie, et elle se soigne.',
    sections: [
      {
        titre: 'Les signes à surveiller',
        paragraphes: [
          'La dépression se manifeste souvent par une tristesse ou une sensation de vide présente la plupart du temps, et par une perte d’intérêt pour ce qui faisait plaisir avant. Les journées semblent lourdes, même les choses simples demandent un effort.',
          'Le corps est touché lui aussi : fatigue persistante, appétit ou sommeil qui changent, difficulté à se concentrer. Beaucoup de femmes ressentent aussi de la culpabilité ou l’impression de ne rien valoir.',
          'Si ces signes durent depuis plus de deux semaines, parles-en à une médecin ou à une psychologue. Demander de l’aide n’est pas un aveu de faiblesse, c’est le premier pas vers le mieux.',
        ],
      },
      {
        titre: 'Avancer à petits pas',
        paragraphes: [
          'Quand l’énergie manque, les grands objectifs découragent. Choisis plutôt une seule petite action par jour, agréable ou utile : prendre une douche, sortir dix minutes, appeler une personne que tu aimes.',
          'Fais-la même sans en avoir envie. Avec l’humeur basse, l’envie revient souvent après l’action, rarement avant. Chaque petit pas compte, même s’il paraît insignifiant.',
          'Le soir, note dans ton journal ce que tu as fait et comment tu t’es sentie ensuite. Avec le temps, ces notes te montreront ce qui t’aide vraiment.',
        ],
      },
      {
        titre: 'Si tu as des pensées sombres',
        paragraphes: [
          'Si tu penses à la mort ou à te faire du mal, ne reste pas seule avec ces pensées. Ouvre l’onglet SOS et appelle un numéro d’aide, ou parle tout de suite à une personne de confiance. Tu mérites d’être aidée maintenant.',
        ],
      },
    ],
  },
  {
    id: 'travail',
    theme: 'Travail',
    vignette: 3,
    publieLe: '2026-10-01T08:00:00.000Z',
    titre: 'Stress au travail',
    resume: 'Prévenir l’épuisement et poser des limites.',
    intro:
      'Un peu de pression peut motiver. Mais quand le stress devient permanent, il use le corps et le moral, jusqu’à l’épuisement. Le repérer tôt permet d’agir avant de tomber.',
    sections: [
      {
        titre: 'Les signes d’alerte',
        paragraphes: [
          'Le premier signe est souvent une fatigue qui ne passe plus, même après un week-end ou des congés. On se lève déjà épuisée, avec l’impression de ne jamais récupérer.',
          'Peu à peu, une distance s’installe avec le travail : on devient cynique, on se sent moins efficace, on doute de ses compétences. L’irritabilité augmente, le sommeil se dégrade, et les maux de tête ou de ventre deviennent fréquents.',
        ],
      },
      {
        titre: 'Reprendre de l’air',
        paragraphes: [
          'Les vraies pauses font une grande différence. Environ toutes les heures et demie, accorde-toi quelques minutes loin de l’écran : marcher, boire un verre d’eau, regarder dehors.',
          'Le soir, fixe-toi une heure de fin de journée et un petit rituel pour marquer la coupure : fermer l’ordinateur, changer de tenue, sortir marcher. Ton esprit a besoin de savoir que la journée de travail est terminée.',
          'Quand tout semble urgent, fais la liste de tes tâches et classe-les : ce qui est vraiment urgent, ce qui est important mais peut attendre, et ce qui pourrait être confié à quelqu’un d’autre ou refusé.',
        ],
      },
      {
        titre: 'Poser des limites',
        paragraphes: [
          'Dire non est difficile, surtout quand on a peur de décevoir. Pourtant, une limite posée calmement est souvent bien reçue. Tu peux dire par exemple : « Je ne peux pas prendre ce dossier cette semaine, mais je peux m’en occuper la semaine prochaine. »',
          'Si la pression ne baisse pas, parles-en à ta médecin, et si c’est possible à ta hiérarchie ou aux ressources humaines. Un arrêt de travail est parfois nécessaire pour récupérer : ce n’est pas un échec, c’est un soin.',
        ],
      },
    ],
  },
  {
    id: 'sommeil',
    theme: 'Sommeil',
    vignette: 4,
    publieLe: '2026-10-01T08:00:00.000Z',
    titre: 'Sommeil',
    resume: 'Des habitudes simples pour mieux dormir.',
    intro:
      'Le sommeil et le moral sont étroitement liés : quand on dort mal, tout paraît plus lourd, et quand on est inquiète, on dort mal. Quelques habitudes simples peuvent aider à casser ce cercle.',
    sections: [
      {
        titre: 'Un rythme régulier',
        paragraphes: [
          'Ton corps fonctionne avec une horloge interne. Pour la régler, le plus efficace est de te lever à la même heure chaque jour, même le week-end, même après une mauvaise nuit. L’heure du coucher suivra plus facilement.',
          'Le soir, essaie de laisser les écrans de côté trente à soixante minutes avant de dormir. Leur lumière et ce qu’ils nous font lire gardent le cerveau en éveil.',
        ],
      },
      {
        titre: 'Quand le sommeil ne vient pas',
        paragraphes: [
          'Si tu ne dors toujours pas au bout d’une vingtaine de minutes, ne reste pas à te tourner dans ton lit. Lève-toi, fais une activité calme sous une lumière douce, puis retourne te coucher quand tu sens le sommeil revenir.',
          'Si ce sont tes pensées qui te tiennent éveillée, prends l’habitude de les écrire sur papier avant de te coucher. Les poser quelque part aide ta tête à les lâcher pour la nuit.',
        ],
      },
    ],
  },
  {
    id: 'charge-mentale',
    theme: 'Charge mentale',
    vignette: 1,
    publieLe: '2026-10-01T08:00:00.000Z',
    titre: 'Charge mentale',
    resume: 'Quand tout repose sur toi.',
    intro:
      'La charge mentale, c’est le fait de penser, prévoir et organiser en permanence pour les autres : la maison, les enfants, la famille élargie, le travail. Même quand quelqu’un d’autre fait les tâches, c’est souvent toi qui dois y penser. Ce n’est pas un manque d’organisation, c’est un poids réel, souvent invisible.',
    sections: [
      {
        titre: 'Rendre visible ce qui ne se voit pas',
        paragraphes: [
          'Une grande partie de la charge mentale vient du fait qu’elle reste dans ta tête. Prends un moment pour écrire tout ce à quoi tu penses : les courses, les rendez-vous, les anniversaires, les factures, les devoirs des enfants. Mettre ces choses sur papier soulage déjà, et rend le partage possible.',
        ],
      },
      {
        titre: 'Partager vraiment',
        paragraphes: [
          'Partager ne veut pas dire seulement déléguer des tâches ponctuelles. Le plus efficace est de confier des domaines entiers, comme les repas de la semaine ou le suivi de l’école : la personne qui s’en charge doit y penser ET le faire, sans attendre tes rappels.',
          'Cela demande d’accepter que certaines choses soient faites autrement que toi. Ce n’est pas toujours facile, mais c’est le prix de ta tranquillité d’esprit.',
        ],
      },
      {
        titre: 'Garder un temps pour toi',
        paragraphes: [
          'Enfin, réserve chaque semaine un moment qui n’appartient qu’à toi, même court. Ce n’est pas un luxe ni de l’égoïsme : c’est ce qui te permet de continuer à prendre soin des autres sans t’oublier.',
        ],
      },
    ],
  },
  {
    id: 'hormones',
    theme: 'Cycle',
    vignette: 5,
    publieLe: '2026-10-01T08:00:00.000Z',
    titre: 'Cycle, grossesse et humeur',
    resume: 'Les étapes hormonales peuvent influencer le moral.',
    intro:
      'Les hormones ne font pas tout, mais elles jouent sur l’humeur à plusieurs moments de la vie d’une femme. Les connaître aide à mieux comprendre ce que tu ressens, et à savoir quand demander de l’aide.',
    sections: [
      {
        titre: 'Avant les règles',
        paragraphes: [
          'Dans les jours qui précèdent les règles, certaines femmes ressentent une humeur très basse, de l’irritabilité ou de l’anxiété. Quand ces symptômes sont intenses au point de gêner la vie quotidienne, on parle de trouble dysphorique prémenstruel. C’est un vrai trouble, et il se traite.',
        ],
      },
      {
        titre: 'Après un accouchement',
        paragraphes: [
          'La dépression post-partum est fréquente. Elle peut apparaître dans les semaines qui suivent la naissance, mais aussi plusieurs mois après. Elle ne signifie en aucun cas un manque d’amour pour ton bébé. En parler à une sage-femme ou à une médecin permet d’être accompagnée et de se sentir mieux.',
        ],
      },
      {
        titre: 'Autour de la ménopause',
        paragraphes: [
          'Pendant la périménopause, les années qui précèdent la ménopause, les hormones varient beaucoup. Cela peut entraîner de l’anxiété, des troubles du sommeil et une humeur changeante, parfois difficile à comprendre pour soi comme pour l’entourage.',
        ],
      },
      {
        titre: 'Ce que tu peux faire',
        paragraphes: [
          'Noter ton humeur chaque jour dans ton journal t’aidera à repérer un éventuel lien avec ton cycle. Ces notes sont précieuses : montre-les à ta médecin, ta gynécologue ou ta sage-femme, elles l’aideront à te proposer la bonne solution.',
        ],
      },
    ],
  },
];

export const conseilsDuJour = [
  'Une émotion n’est pas un fait. Elle passe, comme une vague.',
  'Te reposer n’est pas de la paresse : c’est une condition pour continuer.',
  'Parle-toi comme tu parlerais à ta meilleure amie.',
  'Bois un verre d’eau et regarde par la fenêtre pendant une minute.',
  'Demander de l’aide est un signe de force, pas de faiblesse.',
  'Fais une seule chose à la fois aujourd’hui, autant que possible.',
  'Tu n’as pas besoin de tout régler aujourd’hui.',
];

// Idées reçues pour la carte « Vrai ou faux ? » de l'onglet Ressources. Toutes sont fausses.
export type IdeeRecue = { affirmation: string; explication: string };

export const ideesRecues: IdeeRecue[] = [
  {
    affirmation: 'La dépression, c’est juste de la fatigue. Il suffit de se reposer.',
    explication:
      'La dépression est une maladie, pas un manque de volonté ni de repos. Elle se soigne, et en parler à une professionnelle est un vrai premier pas.',
  },
  {
    affirmation: 'Voir une psychologue, c’est réservé aux personnes « folles ».',
    explication:
      'Consulter, c’est prendre soin de sa santé, comme on le fait pour le corps. Beaucoup de femmes consultent pour du stress, un deuil ou un épuisement.',
  },
  {
    affirmation: 'Une bonne mère ne se sent jamais dépassée.',
    explication:
      'Se sentir dépassée arrive à toutes les mères. Le reconnaître et demander du soutien protège ta santé et celle de ta famille.',
  },
  {
    affirmation: 'Si je parle de mes difficultés, je vais embêter les autres.',
    explication:
      'Partager ce que tu vis renforce souvent les liens. Tu as le droit d’avoir besoin des autres, comme ils ont parfois besoin de toi.',
  },
];

// Tout le texte d'une fiche, dans l'ordre de lecture.
function texteComplet(fiche: Fiche): string[] {
  return [fiche.intro, ...fiche.sections.flatMap((s) => [s.titre, ...s.paragraphes])];
}

// Temps de lecture estimé, à 200 mots par minute.
export function minutesDeLecture(fiche: Fiche): number {
  return Math.max(1, Math.round(texteComplet(fiche).join(' ').split(/\s+/).length / 200));
}

// Version texte pour le partage.
export function texteAPartager(fiche: Fiche): string {
  const corps = [fiche.intro, ...fiche.sections.map((s) => `${s.titre}\n${s.paragraphes.join('\n\n')}`)];
  return `${titreArticle(fiche)}\n\n${corps.join('\n\n')}\n\nPartagé depuis Sereine`;
}

// Le résumé sert de titre d'article (sans le point final).
export function titreArticle(fiche: Fiche): string {
  return fiche.resume.replace(/\.$/, '');
}
