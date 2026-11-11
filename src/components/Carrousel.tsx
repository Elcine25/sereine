import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Animated, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { animNative, useMouvementReduit } from '@/components/anim';
import { colors } from '@/lib/theme';

// Cartes qui défilent horizontalement, en pleine largeur d'écran (déborde des
// marges de Screen). La carte centrale est à taille normale, les voisines un peu
// réduites. Avec « auto », le carrousel avance seul ; il s'arrête un moment dès
// qu'on le touche, et jamais quand le téléphone demande de réduire les animations.

const MARGE = 22; // marge horizontale de Screen
const ESPACE = 12;
const PAUSE_APRES_TOUCHER_MS = 10_000;

export function Carrousel<T>({
  elements,
  cle,
  rendu,
  largeurMax = 300,
  auto,
  label,
}: {
  elements: T[];
  cle: (e: T) => string;
  rendu: (e: T) => ReactNode;
  largeurMax?: number;
  auto?: number; // intervalle en ms
  label: string;
}) {
  const { width } = useWindowDimensions();
  const reduit = useMouvementReduit();
  const largeur = Math.min(width * 0.74, largeurMax);
  const pas = largeur + ESPACE;
  const [defilement] = useState(() => new Animated.Value(0));
  const liste = useRef<ComponentRef<typeof ScrollView>>(null);
  const index = useRef(0);
  const repriseApres = useRef(0);

  useEffect(() => {
    if (!auto || reduit || elements.length < 2) return;
    const minuteur = setInterval(() => {
      if (Date.now() < repriseApres.current) return;
      index.current = (index.current + 1) % elements.length;
      liste.current?.scrollTo({ x: index.current * pas, animated: true });
    }, auto);
    return () => clearInterval(minuteur);
  }, [auto, reduit, elements.length, pas]);

  const pause = () => {
    repriseApres.current = Date.now() + PAUSE_APRES_TOUCHER_MS;
  };

  return (
    <View style={{ gap: 12 }}>
      <Animated.ScrollView
        ref={liste}
        horizontal
        accessibilityLabel={label}
        showsHorizontalScrollIndicator={false}
        snapToInterval={pas}
        decelerationRate="fast"
        style={{ marginHorizontal: -MARGE }}
        // Marge de droite : la dernière carte peut, elle aussi, venir se caler à gauche.
        contentContainerStyle={{ paddingLeft: MARGE, paddingRight: Math.max(MARGE, width - largeur - MARGE), gap: ESPACE }}
        onScrollBeginDrag={pause}
        onTouchStart={pause}
        onMomentumScrollEnd={(e) => {
          index.current = Math.round(e.nativeEvent.contentOffset.x / pas);
        }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: defilement } } }], {
          useNativeDriver: animNative,
        })}
      >
        {elements.map((e, i) => {
          const position = [(i - 1) * pas, i * pas, (i + 1) * pas];
          const scale = defilement.interpolate({ inputRange: position, outputRange: [0.93, 1, 0.93], extrapolate: 'clamp' });
          const opacity = defilement.interpolate({ inputRange: position, outputRange: [0.7, 1, 0.7], extrapolate: 'clamp' });
          return (
            <Animated.View key={cle(e)} style={{ width: largeur, opacity, transform: [{ scale }] }}>
              {rendu(e)}
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      <View style={styles.points} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {elements.map((e, i) => {
          const position = [(i - 1) * pas, i * pas, (i + 1) * pas];
          const actif = defilement.interpolate({ inputRange: position, outputRange: [0, 1, 0], extrapolate: 'clamp' });
          return (
            <View key={cle(e)} style={styles.point}>
              <Animated.View style={[styles.pointActif, { opacity: actif }]} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  points: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  point: { width: 18, height: 5, borderRadius: 3, backgroundColor: colors.lilacLight, overflow: 'hidden' },
  pointActif: { flex: 1, backgroundColor: colors.primary },
});
