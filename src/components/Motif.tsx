import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/lib/theme';

// Cercles pointillés concentriques, la signature visuelle de Sereine.
// `couleurs` : [anneaux pointillés, anneaux fins].
export function Motif({
  size,
  style,
  tourne = true,
  couleurs = [colors.plumMid, colors.lilac],
  opacite = 1,
}: {
  size: number;
  style?: ViewStyle;
  tourne?: boolean;
  couleurs?: [string, string];
  opacite?: number;
}) {
  const [rotation] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!tourne) return;
    const boucle = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 90000, easing: Easing.linear, useNativeDriver: true }),
    );
    boucle.start();
    return () => boucle.stop();
  }, [rotation, tourne]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const [pointilles, fins] = couleurs;
  const c = size / 2;

  const anneaux = (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width: size, height: size, opacity: opacite, transform: [{ rotate }] },
        style && { position: 'absolute' },
        style,
      ]}
    >
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={c * 0.32} fill="none" stroke={pointilles} strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" strokeDasharray="1 12" />
        <Circle cx={c} cy={c} r={c * 0.44} fill="none" stroke={fins} strokeOpacity={0.5} strokeWidth={1.5} />
        <Circle cx={c} cy={c} r={c * 0.56} fill="none" stroke={pointilles} strokeOpacity={0.3} strokeWidth={5} strokeLinecap="round" strokeDasharray="1 16" />
        <Circle cx={c} cy={c} r={c * 0.69} fill="none" stroke={fins} strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="10 8" />
        <Circle cx={c} cy={c} r={c * 0.83} fill="none" stroke={pointilles} strokeOpacity={0.22} strokeWidth={6} strokeLinecap="round" strokeDasharray="1 20" />
        <Circle cx={c} cy={c} r={c * 0.97} fill="none" stroke={fins} strokeOpacity={0.3} strokeWidth={1.5} />
      </Svg>
    </Animated.View>
  );

  // Avec `style`, le parent place les anneaux lui-même (position absolue).
  // Sans `style`, on les centre dans le parent. On passe par un calque plein écran
  // centré : sur le web, un élément en position absolue n'est pas centré par flexbox.
  if (style) return anneaux;
  return (
    <View pointerEvents="none" style={styles.centre}>
      {anneaux}
    </View>
  );
}

const styles = StyleSheet.create({
  centre: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
