import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clavier, PointsPin } from '@/components/Clavier';
import { Icon } from '@/components/icons';
import { LONGUEUR_PIN, useVerrou } from '@/lib/verrou';
import { colors, fonts } from '@/lib/theme';

const ESSAIS_AVANT_PAUSE = 5;
const PAUSE_SECONDES = 30;

// Affiché par-dessus l'app tant qu'elle est verrouillée.
export function EcranVerrou() {
  const insets = useSafeAreaInsets();
  const { tryPin, tryBio, bioEnabled, bioAvailable } = useVerrou();
  const [saisie, setSaisie] = useState('');
  const [erreurs, setErreurs] = useState(0);
  const [pauseJusqua, setPauseJusqua] = useState<number | null>(null);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const bio = bioEnabled && bioAvailable;

  // Propose l'empreinte dès l'affichage.
  useEffect(() => {
    if (bio) tryBio();
  }, [bio, tryBio]);

  useEffect(() => {
    if (!pauseJusqua) return;
    const id = setInterval(() => {
      setMaintenant(Date.now());
      if (Date.now() >= pauseJusqua) setPauseJusqua(null);
    }, 1000);
    return () => clearInterval(id);
  }, [pauseJusqua]);

  const enPause = pauseJusqua !== null && maintenant < pauseJusqua;

  const ajouter = async (c: string) => {
    if (enPause || saisie.length >= LONGUEUR_PIN) return;
    const suite = saisie + c;
    setSaisie(suite);
    if (suite.length < LONGUEUR_PIN) return;
    const ok = await tryPin(suite);
    if (ok) return;
    const total = erreurs + 1;
    setErreurs(total);
    setSaisie('');
    if (total % ESSAIS_AVANT_PAUSE === 0) {
      setMaintenant(Date.now());
      setPauseJusqua(Date.now() + PAUSE_SECONDES * 1000);
    }
  };

  const message = enPause
    ? `Trop d'essais. Réessaie dans ${Math.ceil(((pauseJusqua ?? 0) - maintenant) / 1000)} s.`
    : erreurs > 0
      ? 'Code incorrect, réessaie.'
      : 'Entre ton code pour ouvrir ton espace.';

  return (
    <View style={[StyleSheet.absoluteFill, styles.fond, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 34 }]}>
      <View style={styles.badge}>
        <Icon name="cadenas" size={30} color={colors.primary} />
      </View>
      <Text style={styles.titre}>Bon retour</Text>
      <Text style={styles.texte} accessibilityLiveRegion="polite">
        {message}
      </Text>
      <View style={{ marginTop: 30 }}>
        <PointsPin saisis={saisie.length} erreur={erreurs} />
      </View>
      <View style={styles.clavier}>
        <Clavier
          onChiffre={ajouter}
          onEffacer={() => setSaisie((s) => s.slice(0, -1))}
          onBio={bio ? () => tryBio() : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fond: { backgroundColor: colors.background, alignItems: 'center', paddingHorizontal: 26, zIndex: 10 },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titre: { marginTop: 22, fontFamily: fonts.display, fontSize: 28, color: colors.plumDeep },
  texte: { marginTop: 10, fontFamily: fonts.body, fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  clavier: { marginTop: 'auto', width: '100%', alignItems: 'center' },
});
