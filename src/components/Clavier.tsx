import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/icons';
import { LONGUEUR_PIN } from '@/lib/verrou';
import { colors, fonts, radius } from '@/lib/theme';

// Les points qui montrent combien de chiffres ont été saisis.
// Changer `erreur` (un compteur) fait trembler les points.
export function PointsPin({ saisis, erreur }: { saisis: number; erreur: number }) {
  const [secousse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (erreur === 0) return;
    secousse.setValue(0);
    Animated.sequence(
      [10, -10, 8, -8, 0].map((toValue) =>
        Animated.timing(secousse, { toValue, duration: 60, useNativeDriver: true }),
      ),
    ).start();
  }, [erreur, secousse]);

  return (
    <Animated.View
      style={[styles.points, { transform: [{ translateX: secousse }] }]}
      accessible
      accessibilityLabel={`${saisis} chiffres sur ${LONGUEUR_PIN} saisis`}
    >
      {Array.from({ length: LONGUEUR_PIN }, (_, i) => (
        <View key={i} style={[styles.point, i < saisis && { backgroundColor: colors.primary }]} />
      ))}
    </Animated.View>
  );
}

export function Clavier({
  onChiffre,
  onEffacer,
  onBio,
}: {
  onChiffre: (c: string) => void;
  onEffacer: () => void;
  onBio?: () => void;
}) {
  const touches = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  return (
    <View style={styles.grille}>
      {touches.map((c) => (
        <Touche key={c} label={c} onPress={() => onChiffre(c)}>
          <Text style={styles.chiffre}>{c}</Text>
        </Touche>
      ))}
      {onBio ? (
        <Touche label="Utiliser l'empreinte ou Face ID" onPress={onBio} transparent>
          <Icon name="empreinte" size={28} color={colors.primary} strokeWidth={1.7} />
        </Touche>
      ) : (
        <View style={styles.touche} />
      )}
      <Touche label="0" onPress={() => onChiffre('0')}>
        <Text style={styles.chiffre}>0</Text>
      </Touche>
      <Touche label="Effacer" onPress={onEffacer} transparent>
        <Icon name="effacer" size={26} color={colors.plumDeep} />
      </Touche>
    </View>
  );
}

function Touche({
  label,
  onPress,
  transparent,
  children,
}: {
  label: string;
  onPress: () => void;
  transparent?: boolean;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.touche,
        { backgroundColor: pressed ? colors.lilacLight : transparent ? 'transparent' : colors.primarySoft },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  points: { flexDirection: 'row', gap: 18 },
  point: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  grille: {
    width: '100%',
    maxWidth: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  touche: {
    width: '30%',
    height: 66,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chiffre: { fontFamily: fonts.displayMedium, fontSize: 28, color: colors.plumDeep },
});
