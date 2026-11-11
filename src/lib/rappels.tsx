import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { estNouvelle, titreArticle, type Fiche } from '@/data/fiches';
import { useContenu } from './contenu';
import { getMoods, getRappel, surChangement, type MoodEntry } from './storage';

// Notification quotidienne, à l'heure choisie dans les paramètres. Son contenu
// dépend de l'activité récente :
// - humeur pas encore notée ce jour-là : invitation à la noter ;
// - humeurs basses ces derniers jours : message apaisant ;
// - nouvel article publié : annonce (une seule fois par article).
// Les notifications sont locales : elles sont planifiées sur 7 jours, et
// replanifiées à chaque ouverture de l'app et à chaque modification.
// Les textes restent neutres : rien de personnel ne s'affiche sur l'écran verrouillé.

export const rappelsDisponibles = Platform.OS !== 'web';

const JOURS_PLANIFIES = 7;
const CANAL = 'rappel-quotidien';
const CLE_ANNONCES = 'sereine:annonces'; // { [id d'article]: date prévue (ISO) }

type Message = { titre: string; texte: string; url: Href };

const INVITATIONS: Message[] = [
  { titre: 'Un moment pour toi', texte: 'Comment te sens-tu aujourd’hui ? Note ton humeur en un geste.', url: '/humeur' },
  { titre: 'Ta journée en un mot', texte: 'Prends dix secondes pour noter ton humeur du jour.', url: '/humeur' },
  { titre: 'Petit point du jour', texte: 'Qu’est-ce qui a compté aujourd’hui ? Ton journal t’attend.', url: '/humeur' },
  { titre: 'Une chose positive', texte: 'Même petite : qu’est-ce qui t’a fait du bien aujourd’hui ?', url: '/humeur?onglet=gratitude' },
];

const APAISANTS: Message[] = [
  { titre: 'Respire un instant', texte: 'Inspire 5 secondes, expire 5 secondes. Ton corps sait se calmer.', url: '/respirer' },
  { titre: 'Tu fais de ton mieux', texte: 'Et c’est suffisant. Sois douce avec toi aujourd’hui.', url: '/' },
  { titre: 'Tu n’es pas seule', texte: 'Si c’est difficile en ce moment, Sena est là pour t’écouter.', url: '/sena' },
  { titre: 'Une pensée qui tourne en boucle ?', texte: 'Prends cinq minutes pour la démêler, pas à pas.', url: '/exercice-pensee' },
];

if (rappelsDisponibles) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function demanderAutorisation(): Promise<boolean> {
  if (!rappelsDisponibles) return false;
  const actuelle = await Notifications.getPermissionsAsync();
  if (actuelle.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

// Planifie (ou annule) les notifications des 7 prochains jours.
export async function planifierRappels(fiches: Fiche[]): Promise<void> {
  if (!rappelsDisponibles) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const rappel = await getRappel();
  if (!rappel.actif || !(await Notifications.getPermissionsAsync()).granted) return;

  await Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Rappel quotidien',
    // Exporté via « export * » : la règle import/namespace ne le voit pas.
    // eslint-disable-next-line import/namespace
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  const maintenant = new Date();
  const humeurs = await getMoods();
  const noteeAujourdhui = humeurs.some((m) => new Date(m.date).toDateString() === maintenant.toDateString());
  const difficile = periodeDifficile(humeurs, maintenant);
  const annonce = await prochaineAnnonce(fiches, maintenant);

  for (let j = 0; j < JOURS_PLANIFIES; j++) {
    const date = new Date(maintenant);
    date.setDate(date.getDate() + j);
    date.setHours(rappel.heure, rappel.minute, 0, 0);
    if (date <= maintenant) continue;

    const numeroJour = Math.floor(date.getTime() / 86_400_000);
    let message: Message;
    if (annonce && memeJour(annonce.date, date)) {
      message = { titre: 'Nouveau dans Sereine', texte: titreArticle(annonce.fiche), url: `/fiche/${annonce.fiche.id}` };
    } else if (j === 0 && noteeAujourdhui) {
      message = APAISANTS[numeroJour % APAISANTS.length];
    } else if (difficile && j < 3) {
      message = APAISANTS[numeroJour % APAISANTS.length];
    } else {
      message = INVITATIONS[numeroJour % INVITATIONS.length];
    }

    await Notifications.scheduleNotificationAsync({
      content: { title: message.titre, body: message.texte, data: { url: message.url } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CANAL },
    });
  }
}

// Moyenne des humeurs des 3 derniers jours à 2 ou moins (« Lourde » ou « Bof »).
function periodeDifficile(humeurs: MoodEntry[], maintenant: Date): boolean {
  const recentes = humeurs.filter((m) => maintenant.getTime() - new Date(m.date).getTime() < 3 * 86_400_000);
  if (recentes.length === 0) return false;
  return recentes.reduce((s, m) => s + m.mood, 0) / recentes.length <= 2;
}

const memeJour = (a: Date, b: Date) => a.toDateString() === b.toDateString();

// L'article nouveau le plus récent pas encore annoncé. La date prévue est
// mémorisée : en replanifiant, l'annonce garde son jour, et une annonce déjà
// passée n'est pas répétée.
async function prochaineAnnonce(fiches: Fiche[], maintenant: Date): Promise<{ fiche: Fiche; date: Date } | null> {
  let annonces: Record<string, string> = {};
  try {
    annonces = JSON.parse((await AsyncStorage.getItem(CLE_ANNONCES)) ?? '{}');
  } catch {}

  const prevue = fiches.find((f) => annonces[f.id] && new Date(annonces[f.id]) >= debutDuJour(maintenant));
  if (prevue) return { fiche: prevue, date: new Date(annonces[prevue.id]) };

  const nouvelle = fiches
    .filter((f) => estNouvelle(f) && !annonces[f.id])
    .sort((a, b) => (b.publieLe ?? '').localeCompare(a.publieLe ?? ''))[0];
  if (!nouvelle) return null;

  // Demain : aujourd'hui reste réservé à l'invitation à noter son humeur.
  const date = new Date(maintenant);
  date.setDate(date.getDate() + 1);
  await AsyncStorage.setItem(CLE_ANNONCES, JSON.stringify({ ...annonces, [nouvelle.id]: date.toISOString() }));
  return { fiche: nouvelle, date };
}

function debutDuJour(d: Date): Date {
  const debut = new Date(d);
  debut.setHours(0, 0, 0, 0);
  return debut;
}

// Monté une fois à la racine : tient les notifications à jour et ouvre le bon
// écran quand on touche une notification. Rien sur le web.
export function Rappels() {
  return rappelsDisponibles ? <RappelsNatifs /> : null;
}

function RappelsNatifs() {
  const { fiches } = useContenu();
  // Indisponible sur le web (lève une erreur) : ce composant n'y est jamais monté.
  const reponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const planifier = () => planifierRappels(fiches).catch(() => {});
    planifier();
    let minuteur: ReturnType<typeof setTimeout> | undefined;
    const arreterEcoute = surChangement(() => {
      clearTimeout(minuteur);
      minuteur = setTimeout(planifier, 1000);
    });
    const sub = AppState.addEventListener('change', (etat) => {
      if (etat === 'active') planifier();
    });
    return () => {
      clearTimeout(minuteur);
      arreterEcoute();
      sub.remove();
    };
  }, [fiches]);

  useEffect(() => {
    const url = reponse?.notification.request.content.data?.url;
    if (typeof url === 'string') router.push(url as Href);
  }, [reponse]);

  return null;
}
