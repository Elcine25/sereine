import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Vignette } from '@/components/Vignette';
import { Chip, Label, Screen, Title } from '@/components/ui';
import { Icon } from '@/components/icons';
import { datePublication, estNouvelle, minutesDeLecture, titreArticle, type Fiche } from '@/data/fiches';
import { duJour, useContenu } from '@/lib/contenu';
import { getFavoris } from '@/lib/storage';
import { colors, fonts, radius, spacing } from '@/lib/theme';

const TOUT = 'Tout';
const FAVORIS = 'Mes favoris';

export default function Ressources() {
  const { fiches } = useContenu();
  const [choix, setChoix] = useState(TOUT);
  const [favoris, setFavoris] = useState<string[]>([]);

  // Recharge les favoris en revenant d'un article.
  useFocusEffect(
    useCallback(() => {
      getFavoris().then(setFavoris);
    }, []),
  );

  const themes = [...new Set(fiches.map((f) => f.theme))];
  // Le filtre « Mes favoris » n'existe que s'il y a des favoris.
  const filtres = favoris.length > 0 ? [TOUT, FAVORIS, ...themes] : [TOUT, ...themes];
  const theme = filtres.includes(choix) ? choix : TOUT;
  const articles =
    theme === TOUT
      ? fiches
      : theme === FAVORIS
        ? fiches.filter((f) => favoris.includes(f.id))
        : fiches.filter((f) => f.theme === theme);

  return (
    <Screen>
      <Title>Ressources</Title>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chips}
        accessibilityLabel="Thèmes"
      >
        {filtres.map((t) => (
          <Chip key={t} role="radio" label={t} selected={t === theme} onPress={() => setChoix(t)} />
        ))}
      </ScrollView>

      {theme === TOUT && fiches.filter((f) => f.edition).map((f) => <ALaUne key={f.id} fiche={f} />)}

      <VraiOuFaux />

      <View style={styles.listeEntete}>
        <Text style={styles.listeTitre}>{theme === TOUT ? 'Tous les articles' : theme}</Text>
        <Text style={styles.compte}>
          {articles.length} {articles.length > 1 ? 'articles' : 'article'}
        </Text>
      </View>

      <View>
        {articles.map((f) => (
          <Pressable
            key={f.id}
            accessibilityRole="button"
            onPress={() => router.push(`/fiche/${f.id}`)}
            style={({ pressed }) => [styles.article, pressed && { backgroundColor: colors.primarySoft }]}
          >
            <Vignette />
            <View style={styles.articleTexte}>
              <View style={styles.articleHaut}>
                <Text style={styles.articleTheme}>{f.theme}</Text>
                {estNouvelle(f) && <Text style={styles.nouveau}>NOUVEAU</Text>}
              </View>
              <Text style={styles.articleTitre}>{titreArticle(f)}</Text>
              <Text style={styles.articleMeta}>
                {[datePublication(f, true), `${minutesDeLecture(f)} min de lecture`].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

// Édition spéciale (renseignée dans Supabase) : mise en avant en haut de la liste.
function ALaUne({ fiche }: { fiche: Fiche }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${fiche.edition} : ${titreArticle(fiche)}`}
      onPress={() => router.push(`/fiche/${fiche.id}`)}
      style={({ pressed }) => [styles.une, pressed && { opacity: 0.9 }]}
    >
      <Text style={styles.uneEdition}>{fiche.edition?.toUpperCase()}</Text>
      <Text style={styles.uneTitre}>{titreArticle(fiche)}</Text>
      <Text style={styles.uneIntro} numberOfLines={2}>
        {fiche.intro}
      </Text>
      <View style={styles.uneLire}>
        <Text style={styles.uneLireTexte}>Lire l’article</Text>
        <Icon name="suivant" size={18} color={colors.lilac} strokeWidth={2.2} />
      </View>
    </Pressable>
  );
}

// Une idée reçue par jour : l'utilisatrice répond, puis découvre l'explication.
function VraiOuFaux() {
  const idee = duJour(useContenu().ideesRecues);
  const [reponse, setReponse] = useState<'vrai' | 'faux' | null>(null);

  return (
    <View style={styles.quiz}>
      <Label>VRAI OU FAUX ?</Label>
      <Text style={styles.quizTexte}>« {idee.affirmation} »</Text>
      {reponse === null ? (
        <View style={styles.quizBoutons}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setReponse('vrai')}
            style={({ pressed }) => [styles.quizBouton, styles.quizVrai, pressed && { opacity: 0.75 }]}
          >
            <Text style={[styles.quizBoutonTexte, { color: colors.primary }]}>Vrai</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setReponse('faux')}
            style={({ pressed }) => [styles.quizBouton, styles.quizFaux, pressed && { opacity: 0.85 }]}
          >
            <Text style={[styles.quizBoutonTexte, { color: colors.onDark }]}>Faux</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.quizReponse} accessibilityLiveRegion="polite">
          <Text style={styles.quizVerdict}>{reponse === 'faux' ? 'Bien vu : c’est faux.' : 'Eh non, c’est faux.'}</Text>
          <Text style={styles.quizExplication}>{idee.explication}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chipsScroll: { marginHorizontal: -22, flexGrow: 0 },
  chips: { gap: spacing.sm, paddingHorizontal: 22 },
  quiz: { borderRadius: 22, backgroundColor: colors.primarySoft, padding: 18, gap: 12 },
  quizTexte: { fontFamily: fonts.displayItalic, fontSize: 18, lineHeight: 25, color: colors.plumDeep },
  quizBoutons: { flexDirection: 'row', gap: 10 },
  quizBouton: { flex: 1, minHeight: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  quizVrai: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface },
  quizFaux: { backgroundColor: colors.primary },
  quizBoutonTexte: { fontFamily: fonts.bodyBold, fontSize: 15 },
  quizReponse: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, gap: 6 },
  quizVerdict: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.plumDeep },
  quizExplication: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: '#5A3F6A' },
  listeEntete: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 },
  listeTitre: { fontFamily: fonts.display, fontSize: 21, color: colors.plumDeep },
  compte: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  article: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    borderRadius: radius.md,
  },
  articleTexte: { flex: 1, gap: 4 },
  articleHaut: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nouveau: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.onDark,
    backgroundColor: colors.plumMid,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  une: { backgroundColor: colors.plumDeep, borderRadius: radius.lg, padding: 20, gap: spacing.sm },
  uneEdition: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.8, color: colors.lilac },
  uneTitre: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, color: colors.onDark },
  uneIntro: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.onDarkMuted },
  uneLire: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs },
  uneLireTexte: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.lilac },
  articleTheme: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary },
  articleTitre: { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 21, color: colors.plumDeep },
  articleMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
});
