import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import { colors } from '@/lib/theme';

// Le logo de Sereine : 6 grands pétales, 6 petits, un cœur.
const PETALES = [
  ...[0, 60, 120, 180, 240, 300].map((angle, i) => ({
    angle,
    cy: 60,
    rx: 19,
    ry: 38,
    fill: i % 2 === 0 ? colors.primary : colors.plumMid,
  })),
  ...[30, 90, 150, 210, 270, 330].map((angle) => ({ angle, cy: 72, rx: 12, ry: 24, fill: colors.lilac })),
];

function Petale({ cy, rx, ry, fill }: { cy: number; rx: number; ry: number; fill: string }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 200 200">
      <Ellipse cx="100" cy={cy} rx={rx} ry={ry} fill={fill} />
    </Svg>
  );
}

// Version fixe, pour les petites tailles (en-têtes, avatars).
export function FleurStatique({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" accessibilityElementsHidden importantForAccessibility="no">
      {PETALES.slice(0, 6).map((p) => (
        <Ellipse
          key={p.angle}
          cx="100"
          cy={p.cy}
          rx={p.rx}
          ry={p.ry}
          fill={p.fill}
          transform={`rotate(${p.angle} 100 100)`}
        />
      ))}
      <Circle cx="100" cy="100" r="16" fill={colors.plumDeep} />
    </Svg>
  );
}

// Version animée : les pétales s'ouvrent un par un, puis la fleur tourne lentement.
export function FleurAnimee({ size, reduceMotion }: { size: number; reduceMotion: boolean }) {
  const [petales] = useState(() => PETALES.map(() => new Animated.Value(reduceMotion ? 1 : 0)));
  const [coeur] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));
  const [rotation] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) return;
    const ouverture = Animated.stagger(
      70,
      petales.map((v) =>
        Animated.timing(v, { toValue: 1, duration: 800, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      ),
    );
    const apparitionCoeur = Animated.timing(coeur, {
      toValue: 1,
      duration: 500,
      delay: 850,
      easing: Easing.out(Easing.back(2)),
      useNativeDriver: true,
    });
    const tour = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 48000, easing: Easing.linear, useNativeDriver: true }),
    );
    Animated.parallel([ouverture, apparitionCoeur]).start();
    tour.start();
    return () => tour.stop();
  }, [petales, coeur, rotation, reduceMotion]);

  const tourne = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ width: size, height: size }} accessible accessibilityLabel="Logo Sereine">
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: tourne }] }]}>
        {PETALES.map((p, i) => {
          const v = petales[i];
          return (
            <Animated.View
              key={`${p.angle}-${p.cy}`}
              style={[
                StyleSheet.absoluteFill,
                {
                  opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.9, 0.94] }),
                  transform: [
                    { rotate: `${p.angle}deg` },
                    { scale: v },
                    { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-40deg', '0deg'] }) },
                  ],
                },
              ]}
            >
              <Petale cy={p.cy} rx={p.rx} ry={p.ry} fill={p.fill} />
            </Animated.View>
          );
        })}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: coeur, transform: [{ scale: coeur }] }]}>
        <Svg width="100%" height="100%" viewBox="0 0 200 200">
          <Circle cx="100" cy="100" r="15" fill={colors.plumDeep} />
        </Svg>
      </Animated.View>
    </View>
  );
}
