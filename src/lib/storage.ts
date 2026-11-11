import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MoodValue } from './theme';

// Toutes les données sont enregistrées sur le téléphone. Avec un compte
// (facultatif), elles sont aussi copiées dans le cloud : voir src/lib/compte.tsx.
const KEYS = {
  onboarded: 'sereine:onboarded',
  moods: 'sereine:moods',
  gratitudes: 'sereine:gratitudes',
  pensees: 'sereine:pensees',
  prenom: 'sereine:prenom',
  favoris: 'sereine:favoris',
  avis: 'sereine:avis',
  profilMaj: 'sereine:profil-maj',
  rappel: 'sereine:rappel',
};

export type Avis = 'oui' | 'non';

// Chaque note garde sa date de modification (maj). Une note supprimée reste
// enregistrée avec supprime = true, pour que la suppression atteigne aussi les
// autres appareils lors de la synchronisation.
type Enregistrement = { id: string; date: string; maj: string; supprime?: boolean };

export type MoodEntry = Enregistrement & {
  mood: MoodValue;
  tags: string[];
  note: string;
};

// Journal de gratitude : jusqu'à trois choses positives par note.
export type Gratitude = Enregistrement & { choses: string[] };

// Exercice « Démêler une pensée » (restructuration cognitive).
export type PenseeTravaillee = Enregistrement & {
  situation: string;
  pensee: string;
  emotion: string;
  intensiteAvant: number; // 0 à 10
  pieges: string[];
  pour: string;
  contre: string;
  alternative: string;
  intensiteApres: number;
};

export type Collection = 'moods' | 'gratitudes' | 'pensees';
type Types = { moods: MoodEntry; gratitudes: Gratitude; pensees: PenseeTravaillee };

// Prévient la synchronisation et les rappels qu'une donnée a changé.
type Ecouteur = () => void;
const ecouteurs = new Set<Ecouteur>();

export function surChangement(ecouteur: Ecouteur): () => void {
  ecouteurs.add(ecouteur);
  return () => ecouteurs.delete(ecouteur);
}

export function signalerChangement() {
  ecouteurs.forEach((e) => e());
}

async function lireJson<T>(cle: string, defaut: T): Promise<T> {
  const raw = await AsyncStorage.getItem(cle);
  if (!raw) return defaut;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaut;
  }
}

const nouvelId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Toutes les notes, y compris les suppressions (pour la synchronisation).
export async function lireCollection<C extends Collection>(c: C): Promise<Types[C][]> {
  const liste = await lireJson<Types[C][]>(KEYS[c], []);
  // Notes créées avant la v1.1 : pas encore de date de modification.
  return liste.map((e) => (e.maj ? e : { ...e, maj: e.date }));
}

export async function ecrireCollection<C extends Collection>(c: C, liste: Types[C][]): Promise<void> {
  await AsyncStorage.setItem(KEYS[c], JSON.stringify(liste));
}

// Notes visibles, de la plus récente à la plus ancienne.
async function visibles<C extends Collection>(c: C): Promise<Types[C][]> {
  return (await lireCollection(c)).filter((e) => !e.supprime).sort((a, b) => b.date.localeCompare(a.date));
}

async function ajouter<C extends Collection>(c: C, donnees: Omit<Types[C], keyof Enregistrement>): Promise<Types[C]> {
  const maintenant = new Date().toISOString();
  const entree = { ...donnees, id: nouvelId(), date: maintenant, maj: maintenant } as Types[C];
  await ecrireCollection(c, [entree, ...(await lireCollection(c))]);
  signalerChangement();
  return entree;
}

async function supprimer(c: Collection, id: string): Promise<void> {
  const maj = new Date().toISOString();
  const liste = await lireCollection(c);
  // On ne garde que l'identifiant : le contenu de la note est bien effacé.
  const sans = liste.map((e) => (e.id === id ? { id, date: e.date, maj, supprime: true } : e));
  await AsyncStorage.setItem(KEYS[c], JSON.stringify(sans));
  signalerChangement();
}

export const getMoods = () => visibles('moods');
export const addMood = (e: Omit<MoodEntry, keyof Enregistrement>) => ajouter('moods', e);
export const deleteMood = (id: string) => supprimer('moods', id);

export const getGratitudes = () => visibles('gratitudes');
export const addGratitude = (e: Omit<Gratitude, keyof Enregistrement>) => ajouter('gratitudes', e);
export const deleteGratitude = (id: string) => supprimer('gratitudes', id);

export const getPensees = () => visibles('pensees');
export const addPensee = (e: Omit<PenseeTravaillee, keyof Enregistrement>) => ajouter('pensees', e);
export const deletePensee = (id: string) => supprimer('pensees', id);

export async function isOnboarded(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.onboarded)) === 'true';
}

export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(KEYS.onboarded, 'true');
}

// Profil : prénom, favoris et avis sur les articles. Synchronisé d'un bloc,
// d'où une seule date de modification.
export type Profil = { prenom: string; favoris: string[]; avis: Record<string, Avis>; maj: string };

export async function lireProfil(): Promise<Profil> {
  const [prenom, favoris, avis, maj] = await Promise.all([
    getPrenom(),
    getFavoris(),
    toutesLesAvis(),
    AsyncStorage.getItem(KEYS.profilMaj),
  ]);
  if (maj) return { prenom, favoris, avis, maj };
  // Profil rempli avant la v1.1 (sans date) : daté de maintenant pour qu'il soit
  // envoyé au compte. Un profil vide reste daté de 1970 et ne remplace rien.
  const rempli = prenom !== '' || favoris.length > 0 || Object.keys(avis).length > 0;
  const date = rempli ? new Date().toISOString() : '1970-01-01T00:00:00.000Z';
  if (rempli) await AsyncStorage.setItem(KEYS.profilMaj, date);
  return { prenom, favoris, avis, maj: date };
}

export async function ecrireProfil(p: Profil): Promise<void> {
  await AsyncStorage.multiSet([
    [KEYS.prenom, p.prenom],
    [KEYS.favoris, JSON.stringify(p.favoris)],
    [KEYS.avis, JSON.stringify(p.avis)],
    [KEYS.profilMaj, p.maj],
  ]);
}

async function profilModifie() {
  await AsyncStorage.setItem(KEYS.profilMaj, new Date().toISOString());
  signalerChangement();
}

// Prénom (facultatif) utilisé pour saluer l'utilisatrice.
export async function getPrenom(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.prenom)) ?? '';
}

export async function setPrenom(prenom: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.prenom, prenom.trim());
  await profilModifie();
}

// Fiches enregistrées en favoris (identifiants des articles).
export async function getFavoris(): Promise<string[]> {
  return lireJson<string[]>(KEYS.favoris, []);
}

export async function setFavori(id: string, favori: boolean): Promise<string[]> {
  const sans = (await getFavoris()).filter((f) => f !== id);
  const liste = favori ? [id, ...sans] : sans;
  await AsyncStorage.setItem(KEYS.favoris, JSON.stringify(liste));
  await profilModifie();
  return liste;
}

// Réponse à « Cet article t'a aidée ? », par fiche.
async function toutesLesAvis(): Promise<Record<string, Avis>> {
  return lireJson<Record<string, Avis>>(KEYS.avis, {});
}

export async function getAvis(id: string): Promise<Avis | null> {
  return (await toutesLesAvis())[id] ?? null;
}

export async function setAvis(id: string, avis: Avis): Promise<void> {
  const all = await toutesLesAvis();
  await AsyncStorage.setItem(KEYS.avis, JSON.stringify({ ...all, [id]: avis }));
  await profilModifie();
}

// Notification quotidienne, à l'heure choisie (réglage propre à ce téléphone).
export type Rappel = { actif: boolean; heure: number; minute: number };

export async function getRappel(): Promise<Rappel> {
  return lireJson<Rappel>(KEYS.rappel, { actif: false, heure: 20, minute: 0 });
}

export async function setRappel(r: Rappel): Promise<void> {
  await AsyncStorage.setItem(KEYS.rappel, JSON.stringify(r));
  signalerChangement();
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
  signalerChangement();
}
