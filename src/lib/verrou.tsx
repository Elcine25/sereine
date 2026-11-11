import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Verrouillage de l'app par code PIN et, si l'utilisatrice le souhaite, par empreinte ou Face ID.
// Le code est gardé dans le trousseau sécurisé du téléphone (Keychain / Keystore), jamais en clair.
const KEYS = { pin: 'sereine.pin', bio: 'sereine.bio' };

// Après ce délai en arrière-plan, l'app se reverrouille.
const DELAI_REVERROUILLAGE_MS = 60_000;

export const LONGUEUR_PIN = 4;

// Le trousseau sécurisé et la biométrie n'existent pas dans un navigateur :
// la version web (pour les tests) fonctionne sans verrou.
export const verrouDisponible = Platform.OS !== 'web';

type VerrouState = {
  ready: boolean;
  hasPin: boolean;
  locked: boolean;
  bioAvailable: boolean;
  bioEnabled: boolean;
  setPin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
  tryPin: (pin: string) => Promise<boolean>;
  tryBio: () => Promise<boolean>;
  setBioEnabled: (enabled: boolean) => Promise<void>;
};

const VerrouContext = createContext<VerrouState | null>(null);

export function VerrouProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!verrouDisponible);
  const [hasPin, setHasPin] = useState(false);
  const [locked, setLocked] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabledState] = useState(false);
  const passeEnArrierePlan = useRef<number | null>(null);

  useEffect(() => {
    if (!verrouDisponible) return;
    (async () => {
      const [pin, bio, materiel, enregistre] = await Promise.all([
        SecureStore.getItemAsync(KEYS.pin),
        SecureStore.getItemAsync(KEYS.bio),
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      setHasPin(pin !== null);
      setLocked(pin !== null);
      setBioEnabledState(bio === 'true');
      setBioAvailable(materiel && enregistre);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        passeEnArrierePlan.current = Date.now();
      } else if (state === 'active' && passeEnArrierePlan.current !== null) {
        const absence = Date.now() - passeEnArrierePlan.current;
        passeEnArrierePlan.current = null;
        if (hasPin && absence > DELAI_REVERROUILLAGE_MS) setLocked(true);
      }
    });
    return () => sub.remove();
  }, [hasPin]);

  const setPin = useCallback(async (pin: string) => {
    await SecureStore.setItemAsync(KEYS.pin, pin);
    setHasPin(true);
    setLocked(false);
  }, []);

  const removePin = useCallback(async () => {
    await Promise.all([SecureStore.deleteItemAsync(KEYS.pin), SecureStore.deleteItemAsync(KEYS.bio)]);
    setHasPin(false);
    setBioEnabledState(false);
    setLocked(false);
  }, []);

  const tryPin = useCallback(async (pin: string) => {
    const ok = (await SecureStore.getItemAsync(KEYS.pin)) === pin;
    if (ok) setLocked(false);
    return ok;
  }, []);

  const tryBio = useCallback(async () => {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Déverrouiller Sereine',
      cancelLabel: 'Utiliser mon code',
      disableDeviceFallback: true,
    });
    if (res.success) setLocked(false);
    return res.success;
  }, []);

  const setBioEnabled = useCallback(async (enabled: boolean) => {
    await SecureStore.setItemAsync(KEYS.bio, enabled ? 'true' : 'false');
    setBioEnabledState(enabled);
  }, []);

  return (
    <VerrouContext.Provider
      value={{ ready, hasPin, locked, bioAvailable, bioEnabled, setPin, removePin, tryPin, tryBio, setBioEnabled }}
    >
      {children}
    </VerrouContext.Provider>
  );
}

export function useVerrou() {
  const ctx = useContext(VerrouContext);
  if (!ctx) throw new Error('useVerrou doit être utilisé dans VerrouProvider');
  return ctx;
}
