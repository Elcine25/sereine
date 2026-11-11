import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';

// Animations douces de l'app. Elles sont coupées quand le téléphone demande de
// réduire les animations (réglage d'accessibilité).

export const animNative = Platform.OS !== 'web';
export const douceur = Easing.out(Easing.cubic);

export function useMouvementReduit(): boolean {
  const [reduit, setReduit] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduit).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduit);
    return () => sub.remove();
  }, []);
  return reduit;
}

// Fait apparaître son contenu en fondu, avec une légère montée.
export function Apparition({
  children,
  delai = 0,
  decalage = 14,
  style,
}: {
  children: ReactNode;
  delai?: number;
  decalage?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduit = useMouvementReduit();
  const [valeur] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduit) {
      valeur.setValue(1);
      return;
    }
    const anim = Animated.timing(valeur, {
      toValue: 1,
      duration: 420,
      delay: delai,
      easing: douceur,
      useNativeDriver: animNative,
    });
    anim.start();
    return () => anim.stop();
  }, [valeur, delai, reduit]);

  const translateY = valeur.interpolate({ inputRange: [0, 1], outputRange: [decalage, 0] });
  return <Animated.View style={[style, { opacity: valeur, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

// Léger enfoncement au toucher (boutons, tuiles). À brancher sur onPressIn / onPressOut.
export function useEnfoncement(echelle = 0.97) {
  const [valeur] = useState(() => new Animated.Value(1));
  const vers = (v: number) =>
    Animated.spring(valeur, { toValue: v, useNativeDriver: animNative, speed: 40, bounciness: 6 }).start();
  return {
    style: { transform: [{ scale: valeur }] },
    onPressIn: () => vers(echelle),
    onPressOut: () => vers(1),
  };
}
