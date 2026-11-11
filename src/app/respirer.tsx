import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/icons';
import { Motif } from '@/components/Motif';
import { Chip, IconButton } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/lib/theme';

type Phase = { label: string; seconds: number; scale: number | null }; // null = garder la taille

const REPOS = 0.6;

const EXERCICES: { id: string; nom: string; description: string; phases: Phase[] }[] = [
  {
    id: 'coherence',
    nom: 'Cohérence cardiaque',
    description: '5 secondes pour inspirer, 5 pour expirer',
    phases: [
      { label: 'Inspire', seconds: 5, scale: 1 },
      { label: 'Expire', seconds: 5, scale: REPOS },
    ],
  },
  {
    id: 'carree',
    nom: 'Respiration carrée',
    description: '4 temps égaux pour se recentrer',
    phases: [
      { label: 'Inspire', seconds: 4, scale: 1 },
      { label: 'Retiens', seconds: 4, scale: null },
      { label: 'Expire', seconds: 4, scale: REPOS },
      { label: 'Retiens', seconds: 4, scale: null },
    ],
  },
  {
    id: '478',
    nom: 'Respiration 4-7-8',
    description: 'Une expiration longue, utile avant de dormir',
    phases: [
      { label: 'Inspire', seconds: 4, scale: 1 },
      { label: 'Retiens', seconds: 7, scale: null },
      { label: 'Expire', seconds: 8, scale: REPOS },
    ],
  },
];

const DUREES = [2, 5];

// `anim` change à chaque fois que le cercle doit repartir (nouvelle phase ou reprise),
// `animDuree` est la durée restante de la phase à ce moment-là.
type Seance = {
  phase: number;
  resteDansPhase: number;
  resteTotal: number;
  cycle: number;
  enPause: boolean;
  anim: number;
  animDuree: number;
};

function horloge(secondes: number) {
  return `${Math.floor(secondes / 60)}:${String(secondes % 60).padStart(2, '0')}`;
}

export default function Respirer() {
  const insets = useSafeAreaInsets();
  const [exerciceId, setExerciceId] = useState(EXERCICES[0].id);
  const [duree, setDuree] = useState(DUREES[0]);
  const [seance, setSeance] = useState<Seance | null>(null);
  const [terminee, setTerminee] = useState(false);
  const [scale] = useState(() => new Animated.Value(REPOS));

  const exercice = EXERCICES.find((e) => e.id === exerciceId)!;
  const dureeCycle = exercice.phases.reduce((s, p) => s + p.seconds, 0);
  const totalCycles = Math.max(1, Math.floor((duree * 60) / dureeCycle));
  const enCours = seance !== null && !seance.enPause;

  const demarrer = () => {
    setTerminee(false);
    const premiere = exercice.phases[0].seconds;
    setSeance({
      phase: 0,
      resteDansPhase: premiere,
      resteTotal: duree * 60,
      cycle: 0,
      enPause: false,
      anim: 1,
      animDuree: premiere,
    });
  };

  const basculerPause = () => {
    if (!seance) return demarrer();
    setSeance((s) =>
      s && (s.enPause ? { ...s, enPause: false, anim: s.anim + 1, animDuree: s.resteDansPhase } : { ...s, enPause: true }),
    );
  };

  const arreter = () => setSeance(null);

  // Décompte chaque seconde, seulement quand la séance avance.
  useEffect(() => {
    if (!enCours) return;
    const id = setInterval(() => {
      setSeance((s) => {
        if (!s) return s;
        if (s.resteTotal <= 1) {
          setTerminee(true);
          return null;
        }
        if (s.resteDansPhase > 1) return { ...s, resteDansPhase: s.resteDansPhase - 1, resteTotal: s.resteTotal - 1 };
        const next = (s.phase + 1) % exercice.phases.length;
        const secondes = exercice.phases[next].seconds;
        return {
          ...s,
          phase: next,
          resteDansPhase: secondes,
          resteTotal: s.resteTotal - 1,
          cycle: next === 0 ? s.cycle + 1 : s.cycle,
          anim: s.anim + 1,
          animDuree: secondes,
        };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [enCours, exercice]);

  // Anime les cercles au début de chaque phase, les fige en pause.
  const anim = seance?.anim;
  const animDuree = seance?.animDuree ?? 0;
  const enPause = seance?.enPause ?? false;
  const cible = seance ? exercice.phases[seance.phase].scale : REPOS;
  useEffect(() => {
    if (anim === undefined) {
      Animated.timing(scale, { toValue: REPOS, duration: 600, useNativeDriver: true }).start();
      return;
    }
    if (enPause) {
      scale.stopAnimation();
      return;
    }
    if (cible === null) return;
    Animated.timing(scale, {
      toValue: cible,
      duration: animDuree * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [anim, animDuree, enPause, cible, scale]);

  const phase = seance ? exercice.phases[seance.phase] : null;
  // Le halo extérieur respire un peu plus que le cœur.
  const scaleHalo = scale.interpolate({ inputRange: [REPOS, 1], outputRange: [0.7, 1.08] });

  const etiquette = seance?.enPause ? 'Pause' : phase ? phase.label : terminee ? 'Bravo' : 'Prête ?';
  const sousTitre = seance
    ? `Cycle ${Math.min(seance.cycle + 1, totalCycles)} sur ${totalCycles}`
    : terminee
      ? 'Séance terminée. Prends un instant pour sentir ton corps.'
      : `${totalCycles} cycles`;

  return (
    <ScrollView
      style={styles.ecran}
      contentContainerStyle={[styles.contenu, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}
    >
      <View style={styles.entete}>
        <IconButton icon="retour" label="Retour" onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text style={styles.titre}>{exercice.nom}</Text>
          <Text style={styles.description}>{exercice.description}</Text>
        </View>
      </View>

      {!seance && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.exercicesScroll}
          contentContainerStyle={styles.exercices}
        >
          {EXERCICES.map((e) => (
            <Chip
              key={e.id}
              role="radio"
              label={e.nom}
              selected={e.id === exerciceId}
              onPress={() => setExerciceId(e.id)}
            />
          ))}
        </ScrollView>
      )}

      <View style={styles.scene}>
        <Motif size={SIZE + 60} tourne={enCours} couleurs={[colors.plumMid, colors.lilac]} />
        <Animated.View style={[styles.cercle, styles.halo, { transform: [{ scale: scaleHalo }] }]} />
        <Animated.View style={[styles.cercle, styles.milieu, { transform: [{ scale }] }]} />
        <Animated.View style={[styles.cercle, styles.coeur, { transform: [{ scale }] }]} />
        <Text style={styles.phase} accessibilityLiveRegion="polite">
          {etiquette}
        </Text>
      </View>

      <View style={styles.bas}>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={styles.minuteur}>{horloge(seance ? seance.resteTotal : duree * 60)}</Text>
          <Text style={styles.cycles}>{sousTitre}</Text>
        </View>

        <View style={styles.commandes}>
          <View style={styles.cote}>
            {seance ? (
              <Pressable accessibilityRole="button" onPress={arreter} style={styles.pilule}>
                <Text style={styles.piluleTexte}>Arrêter</Text>
              </Pressable>
            ) : (
              <DureeBouton minutes={DUREES[0]} choisie={duree === DUREES[0]} onPress={() => setDuree(DUREES[0])} />
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={enCours ? 'Pause' : seance ? 'Reprendre' : 'Commencer'}
            onPress={basculerPause}
            style={({ pressed }) => [styles.lecture, pressed && { backgroundColor: colors.primaryPressed }]}
          >
            <Icon
              name={enCours ? 'pause' : 'lecture'}
              size={28}
              color={colors.onDark}
              strokeWidth={enCours ? 3.2 : 1.5}
              rempli={!enCours}
            />
          </Pressable>
          <View style={styles.cote}>
            {!seance && (
              <DureeBouton minutes={DUREES[1]} choisie={duree === DUREES[1]} onPress={() => setDuree(DUREES[1])} />
            )}
          </View>
        </View>

        <Text style={styles.conseil}>
          Installe-toi confortablement. Si tu as la tête qui tourne, reprends une respiration normale.
        </Text>
      </View>
    </ScrollView>
  );
}

function DureeBouton({ minutes, choisie, onPress }: { minutes: number; choisie: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: choisie }}
      accessibilityLabel={`${minutes} minutes`}
      onPress={onPress}
      style={[styles.pilule, choisie && { backgroundColor: colors.lilacLight, borderColor: colors.lilacLight }]}
    >
      <Text style={[styles.piluleTexte, choisie && { fontFamily: fonts.bodyBold }]}>{minutes} min</Text>
    </Pressable>
  );
}

const SIZE = 280;

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: colors.background },
  contenu: { flexGrow: 1, paddingHorizontal: 22, gap: spacing.md },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titre: { fontFamily: fonts.display, fontSize: 22, color: colors.plumDeep },
  description: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  exercicesScroll: { marginHorizontal: -22, flexGrow: 0 },
  exercices: { gap: spacing.sm, paddingHorizontal: 22 },
  scene: { flex: 1, minHeight: SIZE + 60, alignItems: 'center', justifyContent: 'center' },
  cercle: { position: 'absolute', borderRadius: radius.pill },
  halo: { width: SIZE, height: SIZE, backgroundColor: colors.primarySoft },
  milieu: { width: SIZE * 0.8, height: SIZE * 0.8, backgroundColor: colors.lilacLight },
  coeur: { width: SIZE * 0.62, height: SIZE * 0.62, backgroundColor: colors.primary },
  phase: { fontFamily: fonts.display, fontSize: 26, color: colors.onDark },
  bas: { alignItems: 'center', gap: 22 },
  minuteur: { fontFamily: fonts.displayMedium, fontSize: 40, color: colors.plumDeep },
  cycles: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  commandes: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  cote: { width: 92, alignItems: 'center' },
  pilule: {
    minHeight: 44,
    minWidth: 84,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  piluleTexte: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.plumDeep },
  lecture: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conseil: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textMuted, textAlign: 'center' },
});
