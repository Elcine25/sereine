import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import {
  ecrireCollection,
  ecrireProfil,
  lireCollection,
  lireProfil,
  signalerChangement,
  surChangement,
  type Collection,
} from './storage';
import { supabase } from './supabase';

// Compte facultatif pour retrouver ses données sur un autre appareil.
// Connexion sans mot de passe : un code à usage unique est envoyé par e-mail.
// Les données restent d'abord sur le téléphone. Le compte en garde une copie,
// et chaque appareil connecté fusionne sa version avec celle du compte : pour
// chaque note, la modification la plus récente l'emporte.

type Synchro = { enCours: boolean; derniere: Date | null; erreur: string | null };

type EtatCompte = {
  disponible: boolean; // Supabase configuré
  email: string | null; // null : pas connectée
  synchro: Synchro;
  envoyerCode: (email: string) => Promise<void>;
  verifierCode: (email: string, code: string) => Promise<void>;
  synchroniser: () => Promise<void>;
  deconnecter: () => Promise<void>;
  supprimerCompte: () => Promise<void>;
};

const CompteContext = createContext<EtatCompte | null>(null);

export function useCompte() {
  const ctx = useContext(CompteContext);
  if (!ctx) throw new Error('useCompte doit être utilisé dans CompteProvider');
  return ctx;
}

const COLLECTIONS: Collection[] = ['moods', 'gratitudes', 'pensees'];
const DELAI_SYNCHRO_MS = 1500;

export function CompteProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [synchro, setSynchro] = useState<Synchro>({ enCours: false, derniere: null, erreur: null });
  const connectee = useRef(false);
  const enCours = useRef<Promise<void> | null>(null);

  const synchroniser = useCallback(async () => {
    if (!connectee.current) return;
    // Une seule synchronisation à la fois.
    if (enCours.current) return enCours.current;
    setSynchro((s) => ({ ...s, enCours: true }));
    enCours.current = (async () => {
      try {
        const recu = await synchroniserDonnees();
        setSynchro({ enCours: false, derniere: new Date(), erreur: null });
        if (recu) signalerChangement();
      } catch {
        setSynchro((s) => ({ ...s, enCours: false, erreur: 'Synchronisation impossible. Vérifie ta connexion.' }));
      } finally {
        enCours.current = null;
      }
    })();
    return enCours.current;
  }, []);

  // Session : au démarrage, à la connexion et à la déconnexion.
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((evenement, session) => {
      connectee.current = !!session;
      setEmail(session?.user.email ?? null);
      if (session && (evenement === 'INITIAL_SESSION' || evenement === 'SIGNED_IN')) {
        // Hors du rappel : Supabase déconseille d'y appeler d'autres requêtes.
        setTimeout(synchroniser, 0);
      }
      if (!session) setSynchro({ enCours: false, derniere: null, erreur: null });
    });
    return () => data.subscription.unsubscribe();
  }, [synchroniser]);

  // Retour au premier plan, et après chaque modification (regroupées).
  useEffect(() => {
    let minuteur: ReturnType<typeof setTimeout> | undefined;
    const arreterEcoute = surChangement(() => {
      clearTimeout(minuteur);
      minuteur = setTimeout(synchroniser, DELAI_SYNCHRO_MS);
    });
    const sub = AppState.addEventListener('change', (etat) => {
      if (etat === 'active') synchroniser();
    });
    return () => {
      clearTimeout(minuteur);
      arreterEcoute();
      sub.remove();
    };
  }, [synchroniser]);

  const envoyerCode = async (adresse: string) => {
    if (!supabase) throw new Error('Compte indisponible.');
    const { error } = await supabase.auth.signInWithOtp({ email: adresse, options: { shouldCreateUser: true } });
    if (error) throw new Error(messageErreur(error.message));
  };

  const verifierCode = async (adresse: string, code: string) => {
    if (!supabase) throw new Error('Compte indisponible.');
    const { error } = await supabase.auth.verifyOtp({ email: adresse, token: code, type: 'email' });
    if (error) throw new Error('Code incorrect ou expiré. Vérifie-le ou demande un nouveau code.');
  };

  const deconnecter = async () => {
    if (!supabase) return;
    await supabase.auth.signOut({ scope: 'local' });
  };

  const supprimerCompte = async () => {
    if (!supabase) return;
    const { error } = await supabase.rpc('supprimer_mon_compte');
    if (error) throw new Error('Suppression impossible. Vérifie ta connexion et réessaie.');
    await supabase.auth.signOut({ scope: 'local' });
  };

  return (
    <CompteContext.Provider
      value={{
        disponible: !!supabase,
        email,
        synchro,
        envoyerCode,
        verifierCode,
        synchroniser,
        deconnecter,
        supprimerCompte,
      }}
    >
      {children}
    </CompteContext.Provider>
  );
}

function messageErreur(message: string): string {
  if (/rate limit|seconds/i.test(message)) return 'Trop de demandes. Attends une minute avant de redemander un code.';
  if (/invalid/i.test(message)) return 'Cette adresse e-mail ne semble pas valide.';
  return 'Envoi impossible. Vérifie ta connexion et réessaie.';
}

const plusRecent = (a: string, b: string) => Date.parse(a) > Date.parse(b);

type LigneDistante = { id: string; collection: Collection; contenu: Record<string, unknown>; supprime: boolean; maj: string };

// Fusionne les données du téléphone et du compte. Renvoie true si le téléphone
// a reçu des modifications.
async function synchroniserDonnees(): Promise<boolean> {
  if (!supabase) return false;
  let recu = false;

  const { data, error } = await supabase.from('entrees').select('id, collection, contenu, supprime, maj');
  if (error) throw error;
  const distantes = data as LigneDistante[];
  const aEnvoyer: LigneDistante[] = [];

  for (const c of COLLECTIONS) {
    const locales = await lireCollection(c);
    const localesParId = new Map(locales.map((e) => [e.id, e]));
    const distantesParId = new Map(distantes.filter((d) => d.collection === c).map((d) => [d.id, d]));

    const fusion = new Map(localesParId);
    let modifiee = false;
    for (const d of distantesParId.values()) {
      const l = localesParId.get(d.id);
      if (!l || plusRecent(d.maj, l.maj)) {
        fusion.set(d.id, { ...d.contenu, id: d.id, maj: d.maj, ...(d.supprime && { supprime: true }) } as never);
        modifiee = true;
      }
    }
    for (const l of locales) {
      const d = distantesParId.get(l.id);
      if (!d || plusRecent(l.maj, d.maj)) {
        const { id, maj, supprime, ...contenu } = l;
        aEnvoyer.push({ id, collection: c, contenu, supprime: !!supprime, maj });
      }
    }
    if (modifiee) {
      // Relit juste avant d'écrire : une note ajoutée pendant la synchronisation n'est pas perdue.
      for (const e of await lireCollection(c)) {
        const f = fusion.get(e.id);
        if (!f || plusRecent(e.maj, f.maj)) fusion.set(e.id, e);
      }
      await ecrireCollection(c, [...fusion.values()]);
      recu = true;
    }
  }

  if (aEnvoyer.length > 0) {
    const { error: e } = await supabase.from('entrees').upsert(aEnvoyer, { onConflict: 'user_id,id' });
    if (e) throw e;
  }

  const { data: distant, error: ep } = await supabase.from('profils').select('prenom, favoris, avis, maj').maybeSingle();
  if (ep) throw ep;
  const local = await lireProfil();
  if (distant && plusRecent(distant.maj, local.maj)) {
    await ecrireProfil({ prenom: distant.prenom, favoris: distant.favoris, avis: distant.avis, maj: distant.maj });
    recu = true;
  } else if (!distant || plusRecent(local.maj, distant.maj)) {
    const { error: e } = await supabase.from('profils').upsert(local);
    if (e) throw e;
  }
  return recu;
}
