import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { conseilsDuJour, fiches, ideesRecues, type Fiche, type IdeeRecue } from '@/data/fiches';
import { ETAPES, type Action, type Etapes } from '@/data/sena';
import { autresNumeros, urgence, type Contact } from '@/data/sos';
import { supabase } from './supabase';

// Contenus éditoriaux : la version intégrée à l'app sert au premier lancement,
// hors connexion et en secours. Au démarrage, l'app reprend la dernière version
// téléchargée (cache), puis va chercher la version publiée sur Supabase.
// Chaque contenu est vérifié séparément : s'il est vide ou incohérent, l'app
// garde la version précédente de ce contenu.

export type Contenu = {
  fiches: Fiche[];
  pensees: string[];
  ideesRecues: IdeeRecue[];
  sos: { urgence: Contact; autres: Contact[] };
  etapes: Etapes;
};

const PAYS = 'BJ';
const CLE_CACHE = 'sereine:contenu';

const INTEGRE: Contenu = {
  fiches,
  pensees: conseilsDuJour,
  ideesRecues,
  sos: { urgence, autres: autresNumeros },
  etapes: ETAPES,
};

const ContenuContext = createContext<Contenu>(INTEGRE);

export function useContenu() {
  return useContext(ContenuContext);
}

// Un élément par jour, à tour de rôle (pensée du jour, Vrai ou faux…).
export function duJour<T>(liste: T[]): T {
  const jour = Math.floor(Date.now() / 86_400_000);
  return liste[jour % liste.length];
}

export function ContenuProvider({ children }: { children: ReactNode }) {
  const [contenu, setContenu] = useState(INTEGRE);

  useEffect(() => {
    let actif = true;
    (async () => {
      const cache = await lireCache();
      let courant = fusionner(INTEGRE, cache);
      if (actif) setContenu(courant);

      const distant = await telecharger().catch(() => null);
      if (!distant || !actif) return;
      courant = fusionner(courant, distant);
      setContenu(courant);
      AsyncStorage.setItem(CLE_CACHE, JSON.stringify(courant)).catch(() => {});
    })();
    return () => {
      actif = false;
    };
  }, []);

  return <ContenuContext.Provider value={contenu}>{children}</ContenuContext.Provider>;
}

async function lireCache(): Promise<Partial<Contenu>> {
  try {
    const raw = await AsyncStorage.getItem(CLE_CACHE);
    return raw ? (JSON.parse(raw) as Partial<Contenu>) : {};
  } catch {
    return {};
  }
}

// Une requête par table. Une table en erreur (ou hors connexion) est ignorée.
async function telecharger(): Promise<Partial<Contenu> | null> {
  if (!supabase) return null;
  const [f, p, i, s, e] = await Promise.all([
    supabase
      .from('fiches')
      .select('id, theme, vignette, titre, resume, intro, sections, publieLe:publie_le, edition')
      .order('ordre'),
    supabase.from('pensees').select('texte').order('ordre'),
    supabase.from('idees_recues').select('affirmation, explication').order('ordre'),
    supabase.from('contacts_sos').select('nom, numero, description, principal').eq('pays', PAYS).order('ordre'),
    supabase.from('sena_etapes').select('id, messages, choix'),
  ]);

  const resultat: Partial<Contenu> = {};
  if (f.data) resultat.fiches = f.data as Fiche[];
  if (p.data) resultat.pensees = p.data.map((x) => x.texte as string);
  if (i.data) resultat.ideesRecues = i.data as IdeeRecue[];
  if (s.data) {
    const principal = s.data.find((c) => c.principal);
    if (principal) {
      resultat.sos = {
        urgence: versContact(principal),
        autres: s.data.filter((c) => c !== principal).map(versContact),
      };
    }
  }
  if (e.data) resultat.etapes = Object.fromEntries(e.data.map((x) => [x.id, { messages: x.messages, choix: x.choix }]));
  return resultat;
}

function versContact(c: Record<string, unknown>): Contact {
  return { nom: String(c.nom), numero: String(c.numero), description: String(c.description ?? '') };
}

// Garde, contenu par contenu, la nouvelle version seulement si elle est valide.
function fusionner(base: Contenu, nouveau: Partial<Contenu>): Contenu {
  const fichesOk = nouveau.fiches && nouveau.fiches.length > 0 && nouveau.fiches.every(ficheValide);
  const fichesFinales = fichesOk ? nouveau.fiches! : base.fiches;
  return {
    fiches: fichesFinales,
    pensees: listeValide(nouveau.pensees, (t) => texte(t)) ? nouveau.pensees! : base.pensees,
    ideesRecues: listeValide(nouveau.ideesRecues, (x) => texte(x?.affirmation) && texte(x?.explication))
      ? nouveau.ideesRecues!
      : base.ideesRecues,
    sos: nouveau.sos && sosValide(nouveau.sos) ? nouveau.sos : base.sos,
    etapes: nouveau.etapes && etapesValides(nouveau.etapes, fichesFinales) ? nouveau.etapes : base.etapes,
  };
}

const texte = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

function listeValide<T>(liste: T[] | undefined, valide: (x: T) => boolean): liste is T[] {
  return Array.isArray(liste) && liste.length > 0 && liste.every(valide);
}

function ficheValide(f: Fiche): boolean {
  return (
    texte(f?.id) &&
    texte(f.theme) &&
    texte(f.titre) &&
    texte(f.resume) &&
    texte(f.intro) &&
    (f.edition == null || typeof f.edition === 'string') &&
    (f.publieLe == null || !Number.isNaN(Date.parse(f.publieLe))) &&
    Number.isInteger(f.vignette) &&
    f.vignette >= 0 &&
    listeValide(f.sections, (s) => texte(s?.titre) && listeValide(s.paragraphes, texte))
  );
}

function sosValide(sos: Contenu['sos']): boolean {
  const ok = (c: Contact) => texte(c?.nom) && texte(c.numero);
  return ok(sos.urgence) && Array.isArray(sos.autres) && sos.autres.every(ok);
}

// Étapes indispensables à l'écran Sena (accueil, message libre, urgence, fin).
const ETAPES_REQUISES = ['debut', 'danger', 'texteLibre', 'fin'];

// Le parcours doit être complet : chaque choix mène à une étape ou un article
// qui existe, et l'étape « danger » propose toujours un appel ou l'onglet SOS.
function etapesValides(etapes: Etapes, fichesDispo: Fiche[]): boolean {
  if (typeof etapes !== 'object' || etapes === null) return false;
  if (!ETAPES_REQUISES.every((id) => id in etapes)) return false;
  const actionValide = (a: Action): boolean => {
    switch (a?.type) {
      case 'etape':
        return a.vers in etapes;
      case 'fiche':
        return fichesDispo.some((f) => f.id === a.id);
      case 'appel':
        return texte(a.numero);
      case 'respirer':
      case 'journal':
      case 'sos':
        return true;
      default:
        return false;
    }
  };
  const toutesValides = Object.values(etapes).every(
    (e) =>
      listeValide(e?.messages, texte) && listeValide(e.choix, (c) => texte(c?.label) && actionValide(c.action)),
  );
  const urgenceJoignable = etapes.danger.choix.some((c) => c.action.type === 'appel' || c.action.type === 'sos');
  return toutesValides && urgenceJoignable;
}
