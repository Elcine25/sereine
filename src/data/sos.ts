// Numéros d'aide au Bénin. À VÉRIFIER avant publication.
//
// Relevé en octobre 2026 : 112, 117 et 118 figurent dans le plan de numérotation
// de l'ARCEP et sur la page « En cas d'urgence » de l'ambassade de France.
// Le 112 ne passe pas toujours selon certaines sources. Pour l'Institut national
// de la femme, l'ambassade donne le 01 51 07 88 88 mais une liste ARCEP relayée
// par la presse donne le 114 : confirmer auprès de l'INF.

export type Contact = { nom: string; numero: string; description: string };

// Le numéro mis en avant dans le gros bouton d'appel.
export const urgence: Contact = { nom: 'SAMU', numero: '112', description: 'Urgence médicale, gratuit' };

export const autresNumeros: Contact[] = [
  { nom: 'Police', numero: '117', description: 'Gratuit, 24 h/24, 7 j/7' },
  { nom: 'Sapeurs-pompiers', numero: '118', description: 'Gratuit, 24 h/24, 7 j/7' },
  { nom: 'Institut national de la femme', numero: '01 51 07 88 88', description: 'Alerte violences faites aux femmes' },
];
