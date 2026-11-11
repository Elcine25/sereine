import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { EcranVerrou } from '@/components/EcranVerrou';
import { Intro } from '@/components/Intro';
import { Statistiques } from '@/components/Statistiques';
import { ToastProvider } from '@/components/Toast';
import { CompteProvider } from '@/lib/compte';
import { ContenuProvider } from '@/lib/contenu';
import { OnboardingProvider } from '@/lib/onboarding';
import { Rappels } from '@/lib/rappels';
import { VerrouProvider, useVerrou } from '@/lib/verrou';
import { colors, fonts } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Fraunces_400Regular_Italic,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
  const [introFinie, setIntroFinie] = useState(false);
  const finirIntro = useCallback(() => setIntroFinie(true), []);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ContenuProvider>
      <OnboardingProvider>
        <CompteProvider>
          <VerrouProvider>
            <ToastProvider>
              <StatusBar style="dark" />
              <Rappels />
              <Statistiques />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                  // Glissement doux depuis la droite (Android) ; iOS garde sa transition native.
                  animation: 'slide_from_right',
                  animationDuration: 320,
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="bienvenue" options={{ gestureEnabled: false, animation: 'fade' }} />
                <Stack.Screen name="creer-code" />
                <Stack.Screen name="fiche/[id]" />
                <Stack.Screen name="respirer" options={{ animation: 'fade_from_bottom' }} />
                <Stack.Screen name="exercice-pensee" options={{ animation: 'fade_from_bottom' }} />
                <Stack.Screen name="parametres" options={entete('Paramètres')} />
                <Stack.Screen name="compte" options={entete('Mon compte')} />
              </Stack>
              <Verrou />
              {!introFinie && <Intro onDone={finirIntro} />}
            </ToastProvider>
          </VerrouProvider>
        </CompteProvider>
      </OnboardingProvider>
    </ContenuProvider>
  );
}

function entete(title: string) {
  return {
    headerShown: true,
    title,
    headerShadowVisible: false,
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.primary,
    headerTitleStyle: { fontFamily: fonts.display, color: colors.plumDeep },
  };
}

// Cache l'app tant que l'état du verrou n'est pas connu, puis tant qu'elle est verrouillée.
function Verrou() {
  const { ready, locked } = useVerrou();
  if (!ready) return <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />;
  return locked ? <EcranVerrou /> : null;
}
