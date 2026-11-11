import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { animNative, douceur } from '@/components/anim';
import { Icon } from '@/components/icons';
import { colors, fonts, radius } from '@/lib/theme';

// Message de confirmation qui glisse depuis le haut de l'écran, puis repart seul.
// Monté à la racine : il reste visible même si on change d'écran juste après.

const ToastContext = createContext<(message: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const DUREE_MS = 3200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const [valeur] = useState(() => new Animated.Value(0));
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  const afficher = useCallback(
    (texte: string) => {
      if (minuteur.current) clearTimeout(minuteur.current);
      setMessage(texte);
      AccessibilityInfo.announceForAccessibility(texte);
      Animated.timing(valeur, { toValue: 1, duration: 320, easing: douceur, useNativeDriver: animNative }).start();
      minuteur.current = setTimeout(() => {
        Animated.timing(valeur, { toValue: 0, duration: 260, useNativeDriver: animNative }).start(({ finished }) => {
          if (finished) setMessage(null);
        });
      }, DUREE_MS);
    },
    [valeur],
  );

  const translateY = valeur.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });

  return (
    <ToastContext.Provider value={afficher}>
      {children}
      {message !== null && (
        <View pointerEvents="none" style={[styles.zone, { top: insets.top + 10 }]}>
          <Animated.View
            accessibilityLiveRegion="polite"
            style={[styles.toast, { opacity: valeur, transform: [{ translateY }] }]}
          >
            <View style={styles.pastille}>
              <Icon name="valider" size={14} color={colors.plumDeep} strokeWidth={3} />
            </View>
            <Text style={styles.texte}>{message}</Text>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  zone: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 1000, elevation: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 480,
    backgroundColor: colors.plumDeep,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 18,
    shadowColor: colors.plumDeep,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  pastille: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.lilac,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texte: { flexShrink: 1, fontFamily: fonts.bodySemi, fontSize: 15, color: colors.onDark },
});
