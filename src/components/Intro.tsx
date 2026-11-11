import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { FleurAnimee } from '@/components/Fleur';
import { Motif } from '@/components/Motif';
import { colors, fonts } from '@/lib/theme';

const DUREE_AFFICHAGE = 3000;
const TAILLE_FLEUR = 200;

// Animation d'ouverture jouée à chaque lancement. Un toucher la passe.
export function Intro({ onDone }: { onDone: () => void }) {
  const { width } = useWindowDimensions();
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const [titre] = useState(() => new Animated.Value(0));
  const [sousTitre] = useState(() => new Animated.Value(0));
  const [fond] = useState(() => new Animated.Value(1));
  const termine = useRef(false);

  // onDone doit être stable (useCallback chez le parent) pour ne pas relancer le minuteur.
  const fermer = useCallback(() => {
    if (termine.current) return;
    termine.current = true;
    Animated.timing(fond, { toValue: 0, duration: 450, useNativeDriver: true }).start(() => onDone());
  }, [fond, onDone]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (reduceMotion === null) return;
    const apparition = (v: Animated.Value, delay: number) =>
      Animated.timing(v, {
        toValue: 1,
        duration: reduceMotion ? 1 : 900,
        delay: reduceMotion ? 0 : delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    Animated.parallel([apparition(titre, 1350), apparition(sousTitre, 1800)]).start();
    const t = setTimeout(fermer, reduceMotion ? 1200 : DUREE_AFFICHAGE);
    return () => clearTimeout(t);
  }, [reduceMotion, titre, sousTitre, fermer]);

  const monte = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.fond, { opacity: fond }]}>
      <Pressable
        style={styles.contenu}
        onPress={fermer}
        accessibilityRole="button"
        accessibilityLabel="Sereine. Toucher pour passer l'animation"
      >
        {reduceMotion !== null && (
          <>
            {/* Les cercles sont centrés sur la fleur, pas sur l'écran : le titre en dessous
                décale la fleur vers le haut. */}
            <View style={styles.fleur}>
              <Motif size={width * 1.9} tourne={!reduceMotion} />
              <FleurAnimee size={TAILLE_FLEUR} reduceMotion={reduceMotion} />
            </View>
            <Animated.Text style={[styles.titre, monte(titre)]}>Sereine</Animated.Text>
            <Animated.Text style={[styles.sousTitre, monte(sousTitre)]}>Prends soin de toi, à ton rythme.</Animated.Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fond: { backgroundColor: colors.background, zIndex: 20 },
  fleur: { width: TAILLE_FLEUR, height: TAILLE_FLEUR },
  contenu: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60, overflow: 'hidden' },
  titre: { marginTop: 28, fontFamily: fonts.display, fontSize: 48, color: colors.plumDeep },
  sousTitre: { marginTop: 10, fontFamily: fonts.body, fontSize: 17, color: colors.textMuted, textAlign: 'center' },
});
