import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clavier, PointsPin } from '@/components/Clavier';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui';
import { useOnboarding } from '@/lib/onboarding';
import { LONGUEUR_PIN, useVerrou } from '@/lib/verrou';
import { colors, fonts, radius } from '@/lib/theme';

type Etape = 'choix' | 'confirmation' | 'fin';

// Création (ou changement) du code PIN. Ouvert depuis l'accueil au premier
// lancement, ou depuis les paramètres avec ?depuis=parametres.
export default function CreerCode() {
  const insets = useSafeAreaInsets();
  const { depuis } = useLocalSearchParams<{ depuis?: string }>();
  const depuisParametres = depuis === 'parametres';
  const { complete } = useOnboarding();
  const { setPin, bioAvailable, bioEnabled, setBioEnabled } = useVerrou();

  const [etape, setEtape] = useState<Etape>('choix');
  const [premier, setPremier] = useState('');
  const [saisie, setSaisie] = useState('');
  const [erreurs, setErreurs] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const terminer = async () => {
    if (depuisParametres) {
      router.back();
      return;
    }
    await complete();
    router.replace('/');
  };

  const ajouter = async (c: string) => {
    if (saisie.length >= LONGUEUR_PIN) return;
    const suite = saisie + c;
    setSaisie(suite);
    if (suite.length < LONGUEUR_PIN) return;

    if (etape === 'choix') {
      setPremier(suite);
      setSaisie('');
      setMessage(null);
      setEtape('confirmation');
      return;
    }
    if (suite === premier) {
      await setPin(suite);
      if (bioAvailable && !depuisParametres) await setBioEnabled(true);
      setEtape('fin');
    } else {
      setErreurs((n) => n + 1);
      setSaisie('');
      setPremier('');
      setMessage('Les deux codes ne correspondent pas. Recommence.');
      setEtape('choix');
    }
  };

  if (etape === 'fin') {
    return (
      <View style={[styles.ecran, { paddingTop: insets.top + 72, paddingBottom: insets.bottom + 34 }]}>
        <Badge />
        <Text style={styles.titre}>Ton espace est protégé</Text>
        <Text style={styles.texte}>
          Même si quelqu’un prend ton téléphone, ton journal et tes humeurs restent privés.
        </Text>
        <View style={styles.lignes}>
          <View style={styles.ligne}>
            <Icon name="valider" size={22} color={colors.primary} strokeWidth={2} />
            <Text style={styles.ligneTexte}>Code enregistré</Text>
          </View>
          {bioAvailable && (
            <View style={styles.ligne}>
              <Icon name="empreinte" size={22} color={colors.primary} strokeWidth={1.8} />
              <Text style={[styles.ligneTexte, { flex: 1 }]}>Déverrouiller avec l’empreinte ou Face ID</Text>
              <Switch
                value={bioEnabled}
                onValueChange={setBioEnabled}
                trackColor={{ true: colors.primary, false: colors.borderStrong }}
                thumbColor={colors.surface}
                accessibilityLabel="Déverrouiller avec l’empreinte ou Face ID"
              />
            </View>
          )}
        </View>
        <View style={styles.bas}>
          <Button label={depuisParametres ? 'Terminé' : 'Entrer dans Sereine'} onPress={terminer} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.ecran, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 }]}>
      <Badge />
      <Text style={styles.titre}>{etape === 'choix' ? 'Protège ton espace' : 'Confirme ton code'}</Text>
      <Text style={styles.texte} accessibilityLiveRegion="polite">
        {message ??
          (etape === 'choix'
            ? `Choisis un code à ${LONGUEUR_PIN} chiffres. Il sera demandé à chaque ouverture de Sereine.`
            : 'Entre le même code une seconde fois.')}
      </Text>
      <View style={{ marginTop: 30 }}>
        <PointsPin saisis={saisie.length} erreur={erreurs} />
      </View>
      <View style={styles.bas}>
        <Clavier onChiffre={ajouter} onEffacer={() => setSaisie((s) => s.slice(0, -1))} />
        <Pressable accessibilityRole="button" onPress={terminer} style={styles.plusTard}>
          <Text style={styles.plusTardTexte}>{depuisParametres ? 'Annuler' : 'Plus tard'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Badge() {
  return (
    <View style={styles.badge}>
      <Icon name="cadenas" size={30} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: colors.background, alignItems: 'center', paddingHorizontal: 26 },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titre: { marginTop: 22, fontFamily: fonts.display, fontSize: 28, color: colors.plumDeep, textAlign: 'center' },
  texte: {
    marginTop: 10,
    maxWidth: 300,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
    textAlign: 'center',
  },
  bas: { marginTop: 'auto', width: '100%', alignItems: 'center', gap: 8 },
  plusTard: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
  plusTardTexte: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.primary },
  lignes: { marginTop: 36, width: '100%', gap: 12 },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  ligneTexte: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.plumDeep },
});
