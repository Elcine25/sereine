// Contenus des exercices guidés du Journal. À faire relire par une
// professionnelle de santé mentale avant publication.

// « Démêler une pensée » : exercice de restructuration cognitive inspiré des
// thérapies cognitives et comportementales (TCC).

export const EMOTIONS = ['Anxiété', 'Tristesse', 'Colère', 'Culpabilité', 'Honte', 'Peur', 'Découragement'];

// Pièges de pensée (distorsions cognitives), formulés simplement.
export const PIEGES: { nom: string; description: string }[] = [
  { nom: 'Tout ou rien', description: 'Voir les choses en noir ou blanc : si ce n’est pas parfait, c’est un échec.' },
  { nom: 'Catastrophe', description: 'Imaginer le pire comme s’il allait forcément arriver.' },
  { nom: 'Lecture de pensée', description: 'Croire savoir ce que les autres pensent de toi, sans preuve.' },
  { nom: 'Généralisation', description: 'Tirer une règle d’un seul événement : « toujours », « jamais ».' },
  { nom: 'Filtre négatif', description: 'Ne retenir que ce qui va mal et oublier tout le reste.' },
  { nom: 'Les « je dois »', description: 'Se fixer des règles rigides : « je devrais », « il faut ».' },
  { nom: 'Étiquette', description: 'Se résumer à un mot dur : « je suis nulle », « je suis faible ».' },
  { nom: 'Tout prendre pour soi', description: 'Se sentir responsable de ce qui ne dépend pas de toi.' },
];

// Journal de gratitude : une idée différente chaque jour pour démarrer.
export const IDEES_GRATITUDE = [
  'Une personne qui t’a fait sourire',
  'Un petit plaisir : un repas, une musique, un rayon de soleil',
  'Quelque chose que ton corps t’a permis de faire',
  'Une difficulté que tu as surmontée, même petite',
  'Un endroit où tu te sens bien',
  'Un message ou un geste gentil reçu',
  'Une chose que tu as faite pour toi',
];
