// Parcours de conversation de Sena, la compagne d'écoute.
// Sena n'est pas une IA : elle suit ces étapes écrites à l'avance.
// À faire relire par une professionnelle de santé mentale avant publication.

export type Action =
  | { type: 'etape'; vers: EtapeId }
  | { type: 'respirer' }
  | { type: 'journal' }
  | { type: 'sos' }
  | { type: 'fiche'; id: string }
  | { type: 'appel'; numero: string };

export type Choix = { label: string; action: Action };

export type Etape = { messages: string[]; choix: Choix[] };

// Identifiant d'étape. Les parcours venant du dashboard peuvent en ajouter.
export type EtapeId = string;

export type Etapes = Record<EtapeId, Etape>;

// Étapes de la version intégrée.
type EtapeIntegree =
  | 'debut'
  | 'stress'
  | 'tri'
  | 'triste'
  | 'anxieuse'
  | 'ancrage'
  | 'mieux'
  | 'pareil'
  | 'colere'
  | 'bien'
  | 'danger'
  | 'texteLibre'
  | 'fin';

const vers = (etape: EtapeIntegree): Action => ({ type: 'etape', vers: etape });

// Les ressentis proposés au début, et après un message libre.
const RESSENTIS: Choix[] = [
  { label: 'Stressée, débordée', action: vers('stress') },
  { label: 'Triste, sans énergie', action: vers('triste') },
  { label: 'Anxieuse', action: vers('anxieuse') },
  { label: 'En colère', action: vers('colere') },
  { label: 'Ça va plutôt bien', action: vers('bien') },
  { label: 'J’ai des idées noires', action: vers('danger') },
];

const RECOMMENCER: Choix = { label: 'Parler d’autre chose', action: vers('debut') };

export const ETAPES: Record<EtapeIntegree, Etape> = {
  debut: {
    messages: ['Je suis là pour t’écouter, sans jugement.', 'Comment te sens-tu en ce moment ?'],
    choix: RESSENTIS,
  },
  stress: {
    messages: [
      'Ça fait beaucoup à porter. Quand tout s’accumule, la tête et le corps finissent par saturer.',
      'Tu veux qu’on souffle ensemble 2 minutes, ou qu’on essaie de mettre de l’ordre dans ce qui t’occupe l’esprit ?',
    ],
    choix: [
      { label: 'Souffler 2 minutes', action: { type: 'respirer' } },
      { label: 'Faire le tri', action: vers('tri') },
      { label: 'Lire sur la charge mentale', action: { type: 'fiche', id: 'charge-mentale' } },
    ],
  },
  tri: {
    messages: [
      'Prends une minute pour écrire tout ce que tu as en tête, sans trier : le travail, la maison, la famille, les petites choses aussi.',
      'Ensuite, choisis une seule chose à faire aujourd’hui. Le reste peut attendre, ou être confié à quelqu’un d’autre.',
      'Tu veux l’écrire dans ton journal ?',
    ],
    choix: [
      { label: 'Ouvrir mon journal', action: { type: 'journal' } },
      { label: 'Merci, ça m’aide', action: vers('fin') },
    ],
  },
  triste: {
    messages: [
      'Merci de me le dire. Se sentir triste ou vidée, c’est lourd, et tu n’as pas à faire semblant ici.',
      'Parfois, un tout petit pas aide : boire un verre d’eau, ouvrir une fenêtre, envoyer un message à une personne de confiance.',
      'Si cette tristesse dure depuis plus de deux semaines, parles-en à une médecin ou à une psychologue. Ce n’est pas une faiblesse.',
    ],
    choix: [
      { label: 'Noter mon humeur', action: { type: 'journal' } },
      { label: 'Lire sur l’humeur basse', action: { type: 'fiche', id: 'depression' } },
      { label: 'C’est plus grave que ça', action: vers('danger') },
    ],
  },
  anxieuse: {
    messages: [
      'L’anxiété peut faire battre le cœur vite et emballer les pensées. Ça va passer, même si ça ne semble pas comme ça maintenant.',
      'On essaie un exercice pour revenir au moment présent ?',
    ],
    choix: [
      { label: 'Oui, guide-moi', action: vers('ancrage') },
      { label: 'Plutôt respirer', action: { type: 'respirer' } },
      { label: 'Lire sur l’anxiété', action: { type: 'fiche', id: 'anxiete' } },
    ],
  },
  ancrage: {
    messages: [
      'Regarde autour de toi et nomme 5 choses que tu vois.',
      'Maintenant, 4 choses que tu peux toucher. Sens leur texture.',
      '3 sons que tu entends, proches ou lointains.',
      '2 odeurs, même légères.',
      'Et 1 goût dans ta bouche.',
      'Comment te sens-tu maintenant ?',
    ],
    choix: [
      { label: 'Un peu mieux', action: vers('mieux') },
      { label: 'Toujours pareil', action: vers('pareil') },
    ],
  },
  mieux: {
    messages: ['Je suis contente que ça t’aide. Tu peux revenir faire cet exercice quand tu veux.'],
    choix: [{ label: 'Noter mon humeur', action: { type: 'journal' } }, RECOMMENCER],
  },
  pareil: {
    messages: [
      'C’est normal, ça ne marche pas à chaque fois du premier coup.',
      'Respirer lentement peut aider le corps à se calmer.',
    ],
    choix: [
      { label: 'Souffler 2 minutes', action: { type: 'respirer' } },
      { label: 'J’ai besoin d’aide maintenant', action: vers('danger') },
    ],
  },
  colere: {
    messages: [
      'La colère dit souvent qu’une limite a été dépassée. Tu as le droit de la ressentir.',
      'Avant de répondre ou d’agir, ça peut aider de laisser redescendre la pression quelques minutes.',
    ],
    choix: [
      { label: 'Souffler 2 minutes', action: { type: 'respirer' } },
      { label: 'Écrire ce que je ressens', action: { type: 'journal' } },
      { label: 'Lire : poser des limites', action: { type: 'fiche', id: 'travail' } },
    ],
  },
  bien: {
    messages: [
      'Ça fait plaisir à lire ! Qu’est-ce qui t’a fait du bien aujourd’hui ?',
      'Le noter dans ton journal t’aidera à t’en souvenir les jours plus difficiles.',
    ],
    choix: [{ label: 'Ouvrir mon journal', action: { type: 'journal' } }, RECOMMENCER],
  },
  danger: {
    messages: [
      'Merci de me l’avoir dit. Ce que tu ressens compte, et tu mérites d’être aidée tout de suite.',
      'Je ne suis pas une thérapeute, mais des personnes peuvent t’aider maintenant. Si tu es en danger, appelle le SAMU (112) ou la police (117).',
      'Si tu le peux, appelle aussi une personne de confiance et ne reste pas seule.',
    ],
    choix: [
      { label: 'Appeler le 112', action: { type: 'appel', numero: '112' } },
      { label: 'Voir les numéros d’aide', action: { type: 'sos' } },
    ],
  },
  texteLibre: {
    messages: [
      'Merci de me l’avoir confié.',
      'Je ne comprends pas encore tout ce qu’on m’écrit. Pour t’aider au mieux, dis-moi ce qui ressemble le plus à ce que tu vis :',
    ],
    choix: RESSENTIS,
  },
  fin: {
    messages: ['Avec plaisir. Je suis là quand tu veux.'],
    choix: [RECOMMENCER],
  },
};

// Mots qui doivent mener tout de suite vers l'aide d'urgence, quoi qu'écrive l'utilisatrice.
const MOTS_DANGER =
  /suicid|me tuer|me suicider|mourir|en finir|plus envie de vivre|me faire du mal|me blesser|disparaître|disparaitre/i;

export function etapePourTexte(texte: string): EtapeId {
  return MOTS_DANGER.test(texte) ? 'danger' : 'texteLibre';
}
