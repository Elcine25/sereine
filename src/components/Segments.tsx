import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { animNative, douceur, useMouvementReduit } from '@/components/anim';
import { colors, fonts, radius } from '@/lib/theme';

// Onglets internes d'un écran (ex. Humeur / Gratitude / Pensées dans le Journal).
// La pastille glisse sous l'onglet choisi.
export function Segments<T extends string>({
  options,
  valeur,
  onChange,
}: {
  options: { valeur: T; label: string }[];
  valeur: T;
  onChange: (v: T) => void;
}) {
  const reduit = useMouvementReduit();
  const [largeur, setLargeur] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.valeur === valeur),
  );
  const [position] = useState(() => new Animated.Value(index));

  useEffect(() => {
    if (reduit) position.setValue(index);
    else Animated.timing(position, { toValue: index, duration: 280, easing: douceur, useNativeDriver: animNative }).start();
  }, [index, position, reduit]);

  const largeurOnglet = largeur / options.length;

  return (
    <View
      accessibilityRole="tablist"
      style={styles.barre}
      onLayout={(e) => setLargeur(e.nativeEvent.layout.width - 8)}
    >
      {largeur > 0 && (
        <Animated.View
          style={[
            styles.pastille,
            { width: largeurOnglet, transform: [{ translateX: Animated.multiply(position, largeurOnglet) }] },
          ]}
        />
      )}
      {options.map((o) => {
        const choisi = o.valeur === valeur;
        return (
          <Pressable
            key={o.valeur}
            accessibilityRole="tab"
            accessibilityState={{ selected: choisi }}
            onPress={() => onChange(o.valeur)}
            style={styles.onglet}
          >
            <Text style={[styles.label, choisi && { color: colors.primary }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barre: { flexDirection: 'row', backgroundColor: colors.primarySoft, borderRadius: radius.pill, padding: 4 },
  pastille: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    shadowColor: colors.plumDeep,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  onglet: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textMuted },
});
