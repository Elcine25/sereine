import { Children, isValidElement, type ReactNode } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Apparition, useEnfoncement } from '@/components/anim';
import { Icon, type IconName } from '@/components/icons';
import { colors, font, fonts, radius, spacing } from '@/lib/theme';

// Écran défilant. Par défaut, ajoute la marge du haut (encoche, barre d'état).
// Les blocs apparaissent l'un après l'autre, en fondu, à l'ouverture de l'écran.
export function Screen({ children, safeTop = true }: { children: ReactNode; safeTop?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.screenContent, safeTop && { paddingTop: insets.top + spacing.md }]}
    >
      {Children.toArray(children).map((enfant, i) => (
        // Clé d'origine de l'enfant : un bloc qui apparaît plus tard ne fait pas rejouer les autres.
        <Apparition key={isValidElement(enfant) ? enfant.key : i} delai={Math.min(i, 6) * 55}>
          {enfant}
        </Apparition>
      ))}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children, light }: { children: ReactNode; light?: boolean }) {
  return <Text style={[styles.subtitle, light && { color: colors.onDark }]}>{children}</Text>;
}

export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[styles.body, muted && { color: colors.textMuted }]}>{children}</Text>;
}

// Petit libellé en capitales au-dessus d'une carte ou d'une section.
export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled }: ButtonProps) {
  const bg = { primary: colors.primary, secondary: colors.primarySoft, outline: colors.surface }[variant];
  const fg = variant === 'primary' ? colors.onDark : colors.primary;
  const enfoncement = useEnfoncement();
  return (
    <Animated.View style={enfoncement.style}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        onPress={onPress}
        onPressIn={enfoncement.onPressIn}
        onPressOut={enfoncement.onPressOut}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: pressed && variant === 'primary' ? colors.primaryPressed : bg },
          variant === 'outline' && { borderWidth: 1.5, borderColor: colors.borderStrong },
          { opacity: disabled ? 0.4 : pressed && variant !== 'primary' ? 0.75 : 1 },
        ]}
      >
        <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  role = 'checkbox',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  role?: 'checkbox' | 'radio';
}) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: colors.plumDeep, borderColor: colors.plumDeep }]}
    >
      <Text style={[styles.chipLabel, selected && { color: colors.onDark }]}>{label}</Text>
    </Pressable>
  );
}

// Case à cocher simple : un carré à gauche, le texte à droite.
export function Checkbox({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={styles.checkbox}
    >
      <View style={[styles.checkboxCase, checked && { backgroundColor: colors.primary }]}>
        {checked && <Icon name="valider" size={16} color={colors.onDark} strokeWidth={3} />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </Pressable>
  );
}

// Bouton rond avec une icône (retour, paramètres…).
export function IconButton({
  icon,
  label,
  onPress,
  tone = 'soft',
  actif,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  tone?: 'soft' | 'white';
  actif?: boolean; // bouton bascule (ex. favori) : icône remplie quand actif
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={actif === undefined ? undefined : { selected: actif }}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: tone === 'white' ? colors.surface : colors.primarySoft, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Icon name={icon} size={20} color={colors.primary} strokeWidth={2.1} rempli={actif} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: { padding: 22, gap: spacing.md + 2, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontFamily: fonts.display, fontSize: font.title, color: colors.plumDeep },
  subtitle: { fontFamily: fonts.display, fontSize: font.subtitle, color: colors.plumDeep },
  body: { fontFamily: fonts.body, fontSize: font.body, lineHeight: 24, color: colors.textSoft },
  label: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.5, color: colors.primary },
  button: {
    borderRadius: radius.pill,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  buttonLabel: { fontFamily: fonts.bodyBold, fontSize: font.body },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  chipLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.plumDeep },
  checkbox: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  checkboxCase: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: { flex: 1, fontFamily: fonts.body, fontSize: font.body, color: colors.text },
  iconButton: { width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
