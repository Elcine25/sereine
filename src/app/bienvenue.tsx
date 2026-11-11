import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { animNative, douceur, useMouvementReduit } from '@/components/anim';
import { Icon, type IconName } from '@/components/icons';
import { Body, Button, Checkbox, IconButton, Label, Title } from '@/components/ui';
import { useOnboarding } from '@/lib/onboarding';
import { setPrenom } from '@/lib/storage';
import { verrouDisponible } from '@/lib/verrou';
import { colors, fonts, radius, spacing } from '@/lib/theme';

const NB_PAGES = 3;

// Premier lancement, en trois pages qui glissent : présentation, prénom,
// avertissement médical (obligatoire).
export default function Bienvenue() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduit = useMouvementReduit();
  const { complete } = useOnboarding();
  const [page, setPage] = useState(0);
  const [position] = useState(() => new Animated.Value(0));
  const [prenom, setPrenomSaisi] = useState('');
  const [majeure, setMajeure] = useState(false);
  const [compris, setCompris] = useState(false);

  const allerA = (p: number) => {
    setPage(p);
    if (reduit) position.setValue(p);
    else Animated.timing(position, { toValue: p, duration: 420, easing: douceur, useNativeDriver: animNative }).start();
  };

  // Bouton retour d'Android : page précédente plutôt que quitter l'app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (page === 0) return false;
      allerA(page - 1);
      return true;
    });
    return () => sub.remove();
  });

  const continuer = async () => {
    await setPrenom(prenom);
    if (verrouDisponible) {
      router.push('/creer-code');
      return;
    }
    await complete();
    router.replace('/');
  };

  const derniere = page === NB_PAGES - 1;
  const translateX = position.interpolate({ inputRange: [0, 1], outputRange: [0, -width] });

  return (
    <View style={[styles.ecran, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md }]}>
      <View style={styles.haut}>
        <View style={styles.retour}>
          {page > 0 && <IconButton icon="retour" label="Page précédente" onPress={() => allerA(page - 1)} />}
        </View>
        <Points page={page} position={position} />
        <View style={styles.retour} />
      </View>

      <Animated.View style={[styles.rangee, { width: width * NB_PAGES, transform: [{ translateX }] }]}>
        <Page largeur={width} visible={page === 0}>
          <View style={styles.illustration}>
            <Image
              source={require('../../assets/images/bienvenue.png')}
              style={styles.image}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
              accessible={false}
            />
          </View>
          <Title>Un espace rien qu’à toi</Title>
          <Body muted>
            Sereine t’aide à te poser, à suivre ton humeur et à trouver de l’aide en cas de détresse, de façon simple et
            privée.
          </Body>
          <View style={styles.bloc}>
            <Label>POURQUOI SEREINE</Label>
            <Body>
              La santé mentale est un défi de santé publique, marqué par la stigmatisation, le manque de ressources et un
              accès limité aux soins adaptés. Sereine offre un premier espace d’écoute et d’outils simples, disponible à
              tout moment sur ton téléphone.
            </Body>
          </View>
        </Page>

        <Page largeur={width} visible={page === 1}>
          <Title>Comment veux-tu qu’on t’appelle ?</Title>
          <Body muted>Facultatif. L’accueil et Sena l’utiliseront pour te saluer.</Body>
          <TextInput
            value={prenom}
            onChangeText={setPrenomSaisi}
            placeholder="Ton prénom ou un surnom"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            autoComplete="given-name"
            maxLength={30}
            returnKeyType="next"
            onSubmitEditing={() => allerA(2)}
            accessibilityLabel="Ton prénom ou un surnom, facultatif"
            style={styles.input}
          />
          <Point icon="cadenas">
            {verrouDisponible
              ? 'Tes données restent sur ton téléphone. Tu pourras créer un compte plus tard pour les retrouver sur un autre appareil.'
              : 'Tes données restent dans ce navigateur.'}
          </Point>
        </Page>

        <Page largeur={width} visible={page === 2}>
          <Title>Avant de commencer</Title>
          <Point icon="humeur">
            <Text style={styles.gras}>Sereine ne remplace pas une professionnelle de santé. </Text>
            L’application ne pose pas de diagnostic et ne propose pas de traitement. Si tu traverses une période
            difficile, parles-en à une médecin ou à une psychologue.
          </Point>
          <Point icon="telephone">
            <Text style={styles.gras}>En cas d’urgence ou de pensées suicidaires</Text>, appelle immédiatement les
            secours ou un numéro d’aide (onglet SOS).
          </Point>
          <View style={styles.separateur} />
          <Checkbox label="J’ai 18 ans ou plus" checked={majeure} onPress={() => setMajeure((v) => !v)} />
          <Checkbox label="J’ai lu et compris ce qui précède" checked={compris} onPress={() => setCompris((v) => !v)} />
        </Page>
      </Animated.View>

      <View style={styles.bas}>
        {derniere ? (
          <Button label="Commencer" onPress={continuer} disabled={!majeure || !compris} />
        ) : (
          <Button label="Suivant" onPress={() => allerA(page + 1)} />
        )}
      </View>
    </View>
  );
}

function Page({ largeur, visible, children }: { largeur: number; visible: boolean; children: ReactNode }) {
  return (
    <ScrollView
      style={{ width: largeur }}
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      // Les pages hors écran sont ignorées par les lecteurs d'écran.
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
    >
      {children}
    </ScrollView>
  );
}

function Point({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <View style={styles.point}>
      <View style={styles.pointIcone}>
        <Icon name={icon} size={18} color={colors.primary} strokeWidth={2} />
      </View>
      <Text style={styles.pointTexte}>{children}</Text>
    </View>
  );
}

// Indicateur de page : le point actif s'allonge en suivant le glissement.
function Points({ page, position }: { page: number; position: Animated.Value }) {
  return (
    <View
      style={styles.points}
      accessible
      accessibilityLabel={`Étape ${page + 1} sur ${NB_PAGES}`}
    >
      {Array.from({ length: NB_PAGES }, (_, i) => {
        const actif = position.interpolate({
          inputRange: [i - 1, i, i + 1],
          outputRange: [0, 1, 0],
          extrapolate: 'clamp',
        });
        return (
          <View key={i} style={styles.pointFond}>
            <Animated.View style={[styles.pointActif, { opacity: actif, transform: [{ scaleX: actif }] }]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  haut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22 },
  retour: { width: 44, height: 44 },
  points: { flexDirection: 'row', gap: 6 },
  pointFond: { width: 22, height: 6, borderRadius: 3, backgroundColor: colors.lilacLight, overflow: 'hidden' },
  pointActif: { flex: 1, borderRadius: 3, backgroundColor: colors.primary },
  rangee: { flex: 1, flexDirection: 'row' },
  page: { padding: 22, paddingTop: spacing.md, gap: spacing.md + 2 },
  illustration: { alignItems: 'center' },
  // Illustration carrée (1024 × 1024 px) : femme qui médite.
  image: { width: 240, height: 240 },
  bloc: { gap: spacing.sm, marginTop: spacing.sm },
  gras: { fontFamily: fonts.bodyBold, color: colors.plumDeep },
  input: {
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    fontFamily: fonts.body,
    fontSize: 17,
    color: colors.text,
    marginTop: spacing.sm,
  },
  point: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  pointIcone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointTexte: { flex: 1, fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.textSoft },
  separateur: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  bas: { paddingHorizontal: 22, paddingTop: spacing.sm },
});
