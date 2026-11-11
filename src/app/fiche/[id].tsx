import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IMAGE_ARTICLE } from '@/components/Vignette';
import { Body, Button, IconButton, Screen } from '@/components/ui';
import { datePublication, minutesDeLecture, texteAPartager, titreArticle } from '@/data/fiches';
import { useContenu } from '@/lib/contenu';
import { getAvis, getFavoris, setAvis, setFavori, type Avis } from '@/lib/storage';
import { colors, fonts, radius, spacing } from '@/lib/theme';

const HAUTEUR_IMAGE = 260;

export default function FicheDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fiches } = useContenu();
  const fiche = fiches.find((f) => f.id === id);
  const [favori, setFavoriAffiche] = useState(false);
  const [avis, setAvisAffiche] = useState<Avis | null>(null);

  useEffect(() => {
    getFavoris().then((liste) => setFavoriAffiche(liste.includes(id)));
    getAvis(id).then(setAvisAffiche);
  }, [id]);

  const basculerFavori = async () => {
    const liste = await setFavori(id, !favori);
    setFavoriAffiche(liste.includes(id));
  };

  const repondre = async (reponse: Avis) => {
    await setAvis(id, reponse);
    setAvisAffiche(reponse);
    if (reponse === 'oui' && !favori) {
      await setFavori(id, true);
      setFavoriAffiche(true);
    }
  };

  const partager = () => {
    if (!fiche) return;
    Share.share({ message: texteAPartager(fiche) }).catch(() => {
      // Partage indisponible (certains navigateurs) ou annulé : rien à faire.
    });
  };

  if (!fiche) {
    return (
      <Screen>
        <IconButton icon="retour" label="Retour" onPress={() => router.back()} />
        <Body>Fiche introuvable.</Body>
      </Screen>
    );
  }

  return (
    <ScrollView style={styles.ecran} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
      <View style={styles.image}>
        <Image
          source={IMAGE_ARTICLE}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessible={false}
          accessibilityIgnoresInvertColors
        />
        <View style={[styles.boutons, { top: insets.top + 8 }]}>
          <IconButton icon="retour" label="Retour" tone="white" onPress={() => router.back()} />
          <View style={styles.boutonsDroite}>
            <IconButton
              icon="favori"
              label={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              tone="white"
              actif={favori}
              onPress={basculerFavori}
            />
            <IconButton icon="partager" label="Partager" tone="white" onPress={partager} />
          </View>
        </View>
      </View>

      <View style={styles.feuille}>
        <View style={{ gap: 10 }}>
          <Text style={styles.theme}>{fiche.theme.toUpperCase()}</Text>
          <Text style={styles.titre} accessibilityRole="header">
            {titreArticle(fiche)}
          </Text>
          <Text style={styles.meta}>
            {[datePublication(fiche) && `Publié le ${datePublication(fiche)}`, `${minutesDeLecture(fiche)} min de lecture`]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>

        <Text style={styles.intro}>{fiche.intro}</Text>

        {fiche.sections.map((s) => (
          <View key={s.titre} style={{ gap: 14 }}>
            <Text style={styles.sectionTitre} accessibilityRole="header">
              {s.titre}
            </Text>
            {s.paragraphes.map((p) => (
              <Text key={p} style={styles.paragraphe}>
                {p}
              </Text>
            ))}
          </View>
        ))}

        <View style={styles.pause}>
          <Text style={styles.pauseTitre}>Envie de souffler un instant ?</Text>
          <Text style={styles.pauseTexte}>
            Deux minutes de cohérence cardiaque peuvent t’aider à relâcher la pression.
          </Text>
          <Button label="Respirer maintenant" variant="secondary" onPress={() => router.push('/respirer')} />
        </View>

        <View style={styles.avis} accessibilityLiveRegion="polite">
          {avis === null ? (
            <>
              <Text style={styles.avisQuestion}>Cet article t’a aidée ?</Text>
              <View style={styles.avisBoutons}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => repondre('oui')}
                  style={({ pressed }) => [styles.avisBouton, styles.avisOui, pressed && { opacity: 0.85 }]}
                >
                  <Text style={[styles.avisBoutonTexte, { color: colors.onDark }]}>Oui</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => repondre('non')}
                  style={({ pressed }) => [styles.avisBouton, styles.avisNon, pressed && { opacity: 0.75 }]}
                >
                  <Text style={[styles.avisBoutonTexte, { color: colors.plumDeep }]}>Pas vraiment</Text>
                </Pressable>
              </View>
            </>
          ) : avis === 'oui' ? (
            <Text style={styles.avisMerci}>Merci ! Cet article est gardé dans tes favoris.</Text>
          ) : (
            <>
              <Text style={styles.avisMerci}>Merci de ton retour. Sena peut te proposer d’autres pistes.</Text>
              <Button label="Parler à Sena" variant="outline" onPress={() => router.navigate('/sena')} />
            </>
          )}
        </View>

        <Body muted>Ces informations sont générales et ne remplacent pas l’avis d’une professionnelle de santé.</Body>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: colors.background },
  image: { height: HAUTEUR_IMAGE + 28, backgroundColor: '#0B0A1F', overflow: 'hidden' },
  boutons: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  boutonsDroite: { flexDirection: 'row', gap: 10 },
  feuille: {
    marginTop: -28,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 26,
    gap: 22,
  },
  theme: {
    alignSelf: 'flex-start',
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.5,
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    overflow: 'hidden',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  titre: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.plumDeep },
  meta: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  sectionTitre: { fontFamily: fonts.display, fontSize: 20, color: colors.plumDeep },
  // Chapeau : l'introduction, un peu plus grande que le corps du texte.
  intro: { fontFamily: fonts.bodySemi, fontSize: 18, lineHeight: 29, color: colors.plumDeep },
  paragraphe: { fontFamily: fonts.body, fontSize: 16, lineHeight: 27, color: colors.textSoft },
  pause: { borderRadius: 22, backgroundColor: colors.plumDeep, padding: 18, gap: 10 },
  pauseTitre: { fontFamily: fonts.display, fontSize: 19, color: colors.onDark },
  pauseTexte: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.onDarkMuted },
  avis: { alignItems: 'center', gap: 12, paddingVertical: spacing.xs },
  avisQuestion: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.plumDeep },
  avisBoutons: { flexDirection: 'row', gap: 10 },
  avisBouton: {
    minHeight: 44,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avisOui: { backgroundColor: colors.plumDeep },
  avisNon: { borderWidth: 1.5, borderColor: colors.borderStrong },
  avisBoutonTexte: { fontFamily: fonts.bodyBold, fontSize: 14 },
  avisMerci: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 22, color: colors.primary, textAlign: 'center' },
});
