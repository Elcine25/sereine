import { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { animNative, useEnfoncement, useMouvementReduit } from '@/components/anim';
import { Carrousel } from '@/components/Carrousel';
import { Icon, type IconName } from '@/components/icons';
import { MoodFace } from '@/components/MoodFace';
import { IconButton, Label, Screen } from '@/components/ui';
import { Vignette } from '@/components/Vignette';
import { datePublication, estNouvelle, minutesDeLecture, titreArticle, type Fiche } from '@/data/fiches';
import { duJour, useContenu } from '@/lib/contenu';
import { getMoods, getPrenom, type MoodEntry } from '@/lib/storage';
import { colors, fonts, moods, radius, spacing } from '@/lib/theme';

type Exercice = { id: string; icon: IconName; titre: string; texte: string; fond: string; href: Href };

const EXERCICES: Exercice[] = [
  { id: 'souffler', icon: 'respirer', titre: 'Souffler', texte: '2 min de cohérence cardiaque', fond: colors.lilacLight, href: '/respirer' },
  { id: 'pensee', icon: 'sena', titre: 'Démêler une pensée', texte: 'Prendre du recul en 5 minutes', fond: colors.primarySoft, href: '/exercice-pensee' },
  { id: 'gratitude', icon: 'favori', titre: 'Trois choses positives', texte: 'Ton journal de gratitude', fond: colors.lilacLight, href: '/humeur?onglet=gratitude' },
  { id: 'humeur', icon: 'humeur', titre: 'Noter mon humeur', texte: 'En un geste, avec une note si tu veux', fond: colors.primarySoft, href: '/humeur' },
];

function salutation() {
  const h = new Date().getHours();
  if (h < 5) return 'Bonne nuit';
  if (h < 18) return 'Bonjour';
  return 'Bonsoir';
}

function dateDuJour() {
  const d = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return d.charAt(0).toUpperCase() + d.slice(1);
}

// Trois articles à la une : éditions spéciales, puis les plus récents.
function aLire(fiches: Fiche[]): Fiche[] {
  return [...fiches]
    .sort((a, b) => Number(!!b.edition) - Number(!!a.edition) || (b.publieLe ?? '').localeCompare(a.publieLe ?? ''))
    .slice(0, 3);
}

export default function Accueil() {
  const { pensees, fiches } = useContenu();
  const [dernier, setDernier] = useState<MoodEntry | null>(null);
  const [prenom, setPrenom] = useState('');

  useFocusEffect(
    useCallback(() => {
      getMoods().then((all) => setDernier(all[0] ?? null));
      getPrenom().then(setPrenom);
    }, []),
  );

  const faitAujourdhui = dernier && new Date(dernier.date).toDateString() === new Date().toDateString();
  const humeur = faitAujourdhui ? moods.find((m) => m.value === dernier.mood) : undefined;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ gap: 2 }}>
          <Text style={styles.date}>{dateDuJour()}</Text>
          <Text style={styles.salut}>{prenom ? `${salutation()} ${prenom}` : salutation()}</Text>
        </View>
        <IconButton icon="reglages" label="Paramètres" onPress={() => router.push('/parametres')} />
      </View>

      <View style={styles.humeurCarte}>
        <Text style={styles.humeurTitre}>
          {humeur ? 'Ton humeur aujourd’hui' : 'Comment te sens-tu aujourd’hui ?'}
        </Text>
        <View style={styles.visages}>
          {moods.map((m, i) => (
            <Visage key={m.value} index={i} humeur={m} choisie={humeur?.value === m.value} />
          ))}
        </View>
        {humeur && (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate('/humeur')}
            style={styles.humeurLien}
          >
            <Text style={styles.humeurLienTexte}>Ouvrir mon journal</Text>
            <Icon name="suivant" size={18} color={colors.lilac} strokeWidth={2.2} />
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitre}>Exercices</Text>
        <Carrousel
          label="Exercices"
          elements={EXERCICES}
          cle={(e) => e.id}
          rendu={(e) => <CarteExercice exercice={e} />}
          largeurMax={260}
          auto={4500}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionEntete}>
          <Text style={styles.sectionTitre}>À lire</Text>
          <Pressable accessibilityRole="button" onPress={() => router.navigate('/ressources')} hitSlop={8}>
            <Text style={styles.toutVoir}>Tout voir</Text>
          </Pressable>
        </View>
        <Carrousel
          label="Articles à lire"
          elements={aLire(fiches)}
          cle={(f) => f.id}
          rendu={(f) => <CarteArticle fiche={f} />}
          largeurMax={320}
          auto={6500}
        />
      </View>

      <View style={styles.pensee}>
        <Label>PENSÉE DU JOUR</Label>
        <Text style={styles.guillemet} accessibilityElementsHidden importantForAccessibility="no">
          “
        </Text>
        <Text style={styles.penseeTexte}>{duJour(pensees)}</Text>
      </View>

      <BoutonSos />
    </Screen>
  );
}

// Visage d'humeur : apparaît en rebondissant, l'un après l'autre.
function Visage({ index, humeur, choisie }: { index: number; humeur: (typeof moods)[number]; choisie: boolean }) {
  const reduit = useMouvementReduit();
  const [valeur] = useState(() => new Animated.Value(0));
  const enfoncement = useEnfoncement(0.9);

  useEffect(() => {
    if (reduit) {
      valeur.setValue(1);
      return;
    }
    const anim = Animated.spring(valeur, {
      toValue: 1,
      delay: 250 + index * 70,
      useNativeDriver: animNative,
      speed: 10,
      bounciness: 12,
    });
    anim.start();
    return () => anim.stop();
  }, [valeur, index, reduit]);

  const scale = valeur.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Noter mon humeur : ${humeur.label}`}
      accessibilityState={{ selected: choisie }}
      onPress={() => router.navigate({ pathname: '/humeur', params: { mood: String(humeur.value) } })}
      onPressIn={enfoncement.onPressIn}
      onPressOut={enfoncement.onPressOut}
      style={styles.visage}
    >
      <Animated.View style={[styles.anneau, choisie && { borderColor: colors.lilac }, { opacity: valeur, transform: [{ scale }] }]}>
        <Animated.View style={enfoncement.style}>
          <MoodFace value={humeur.value} size={44} />
        </Animated.View>
      </Animated.View>
      <Text style={styles.visageLabel}>{humeur.label}</Text>
    </Pressable>
  );
}

function CarteExercice({ exercice }: { exercice: Exercice }) {
  const enfoncement = useEnfoncement(0.96);
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${exercice.titre} : ${exercice.texte}`}
      onPress={() => router.push(exercice.href)}
      onPressIn={enfoncement.onPressIn}
      onPressOut={enfoncement.onPressOut}
      style={[styles.exercice, { backgroundColor: exercice.fond }, enfoncement.style]}
    >
      <View style={styles.exerciceIcone}>
        <Icon name={exercice.icon} size={28} color={colors.primary} strokeWidth={1.8} />
      </View>
      <View style={{ gap: 4, flex: 1 }}>
        <Text style={styles.exerciceTitre}>{exercice.titre}</Text>
        <Text style={styles.exerciceTexte}>{exercice.texte}</Text>
      </View>
      <View style={styles.exerciceAction}>
        <Text style={styles.exerciceActionTexte}>Commencer</Text>
        <Icon name="suivant" size={16} color={colors.primary} strokeWidth={2.4} />
      </View>
    </AnimatedPressable>
  );
}

function CarteArticle({ fiche }: { fiche: Fiche }) {
  const enfoncement = useEnfoncement(0.97);
  const meta = [datePublication(fiche, true), `${minutesDeLecture(fiche)} min`].filter(Boolean).join(' · ');
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${titreArticle(fiche)}, ${meta}`}
      onPress={() => router.push(`/fiche/${fiche.id}`)}
      onPressIn={enfoncement.onPressIn}
      onPressOut={enfoncement.onPressOut}
      style={[styles.article, enfoncement.style]}
    >
      <Vignette size={76} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.articleHaut}>
          <Text style={styles.articleTheme} numberOfLines={1}>
            {fiche.edition ?? fiche.theme}
          </Text>
          {estNouvelle(fiche) && <Text style={styles.nouveau}>NOUVEAU</Text>}
        </View>
        <Text style={styles.articleTitre} numberOfLines={2}>
          {titreArticle(fiche)}
        </Text>
        <Text style={styles.articleMeta}>{meta}</Text>
      </View>
    </AnimatedPressable>
  );
}

// Accès SOS : l'icône émet une onde douce, pour rester repérable sans alarmer.
function BoutonSos() {
  const reduit = useMouvementReduit();
  const [onde] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduit) return;
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(onde, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: animNative }),
        Animated.delay(1400),
      ]),
    );
    boucle.start();
    return () => boucle.stop();
  }, [onde, reduit]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.navigate('/sos')}
      style={({ pressed }) => [styles.sos, pressed && { opacity: 0.75 }]}
    >
      <View style={styles.sosIconeZone}>
        <Animated.View
          style={[
            styles.sosOnde,
            {
              opacity: onde.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
              transform: [{ scale: onde.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
            },
          ]}
        />
        <View style={styles.sosIcone}>
          <Icon name="telephone" size={20} color={colors.onDark} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sosTitre}>Besoin d’aide maintenant ?</Text>
        <Text style={styles.sosTexte}>Numéros d’urgence et d’écoute</Text>
      </View>
      <Icon name="suivant" size={20} color={colors.primary} strokeWidth={2.2} />
    </Pressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  salut: { fontFamily: fonts.display, fontSize: 28, color: colors.plumDeep },
  humeurCarte: {
    backgroundColor: colors.plumDeep,
    borderRadius: 26,
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: spacing.md,
  },
  humeurTitre: { fontFamily: fonts.display, fontSize: 20, color: colors.onDark, paddingHorizontal: 2 },
  visages: { flexDirection: 'row', justifyContent: 'space-between' },
  visage: { alignItems: 'center', gap: 6, minWidth: 54 },
  anneau: { borderRadius: radius.pill, padding: 3, borderWidth: 2, borderColor: 'transparent' },
  visageLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.lilacLight },
  humeurLien: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4A2A5C',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  humeurLienTexte: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.onDark },
  section: { gap: spacing.sm + 4 },
  sectionEntete: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitre: { fontFamily: fonts.display, fontSize: 21, color: colors.plumDeep },
  toutVoir: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.primary },
  exercice: { borderRadius: 22, padding: 18, gap: 12, minHeight: 200 },
  exerciceIcone: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciceTitre: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.plumDeep },
  exerciceTexte: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: '#5A3F6A' },
  exerciceAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exerciceActionTexte: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.primary },
  article: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 104,
  },
  articleHaut: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  articleTheme: { flexShrink: 1, fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary },
  nouveau: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.onDark,
    backgroundColor: colors.plumMid,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  articleTitre: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20, color: colors.plumDeep },
  articleMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  pensee: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    paddingBottom: 20,
    gap: 4,
  },
  guillemet: { fontFamily: fonts.display, fontSize: 44, lineHeight: 44, height: 26, color: colors.lilac },
  penseeTexte: { fontFamily: fonts.displayItalic, fontSize: 19, lineHeight: 27, color: colors.plumDeep },
  sos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    padding: 14,
  },
  sosIconeZone: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  sosOnde: { ...StyleSheet.absoluteFill, borderRadius: radius.pill, backgroundColor: colors.plumMid },
  sosIcone: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTitre: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.plumDeep },
  sosTexte: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
});
