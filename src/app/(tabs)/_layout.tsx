import { StyleSheet, Text, type ColorValue } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/icons';
import { useOnboarding } from '@/lib/onboarding';
import { colors, fonts } from '@/lib/theme';

// Onglet inactif : gris neutre (peu violet) pour que l'onglet choisi, en prune,
// ressorte nettement. Reste lisible (contraste 4,8:1 sur blanc).
const INACTIF = '#76717A';

function onglet(title: string, name: IconName) {
  return {
    title,
    tabBarIcon: ({ focused, color }: { focused: boolean; color: ColorValue }) => (
      <Icon name={name} size={24} color={color} strokeWidth={focused ? 2.4 : 1.7} />
    ),
    tabBarLabel: ({ focused, color }: { focused: boolean; color: ColorValue }) => (
      <Text style={[styles.label, { color, fontFamily: focused ? fonts.bodyBold : fonts.bodySemi }]}>{title}</Text>
    ),
  };
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { ready, onboarded } = useOnboarding();
  if (!ready) return null;
  if (!onboarded) return <Redirect href="/bienvenue" />;

  // Hauteur explicite : sur Android (barre de gestes, affichage bord à bord), la
  // hauteur par défaut coupait le bas des libellés.
  const basBarre = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: INACTIF,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60 + basBarre,
          paddingTop: 6,
          paddingBottom: basBarre,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={onglet('Accueil', 'accueil')} />
      <Tabs.Screen name="humeur" options={onglet('Journal', 'journal')} />
      <Tabs.Screen name="sena" options={onglet('Sena', 'sena')} />
      <Tabs.Screen name="ressources" options={onglet('Ressources', 'ressources')} />
      <Tabs.Screen name="sos" options={onglet('SOS', 'sos')} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, lineHeight: 15, marginTop: 2 },
});
