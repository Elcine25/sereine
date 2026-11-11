import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Apparition } from '@/components/anim';
import { Icon } from '@/components/icons';
import { useToast } from '@/components/Toast';
import { Body, Button, Chip, IconButton, Label, Title } from '@/components/ui';
import { EMOTIONS, PIEGES } from '@/data/exercices';
import { addPensee } from '@/lib/storage';
import { colors, fonts, radius, spacing } from '@/lib/theme';

const NB_ETAPES = 7;

// « Démêler une pensée » : exercice guidé de restructuration cognitive, une
// question par page. Enregistré dans le Journal (onglet Pensées) à la fin.
export default function ExercicePensee() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [etape, setEtape] = useState(0);
  const [situation, setSituation] = useState('');
  const [pensee, setPensee] = useState('');
  const [emotion, setEmotion] = useState(EMOTIONS[0]);
  const [intensiteAvant, setIntensiteAvant] = useState(6);
  const [pieges, setPieges] = useState<string[]>([]);
  const [pour, setPour] = useState('');
  const [contre, setContre] = useState('');
  const [alternative, setAlternative] = useState('');
  const [intensiteApres, setIntensiteApres] = useState(6);

  const terminee = etape === NB_ETAPES;
  // La pensée et la pensée alternative sont les deux réponses indispensables.
  const peutContinuer = (etape !== 1 || pensee.trim() !== '') && (etape !== 5 || alternative.trim() !== '');

  const suivant = async () => {
    if (etape === NB_ETAPES - 1) {
      await addPensee({
        situation: situation.trim(),
        pensee: pensee.trim(),
        emotion,
        intensiteAvant,
        pieges,
        pour: pour.trim(),
        contre: contre.trim(),
        alternative: alternative.trim(),
        intensiteApres,
      });
      toast('Exercice enregistré dans ton journal');
    }
    if (etape === 5) setIntensiteApres(intensiteAvant);
    setEtape((e) => e + 1);
  };

  return (
    <View style={[styles.ecran, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md }]}>
      <View style={styles.haut}>
        <IconButton
          icon="retour"
          label={etape > 0 && !terminee ? 'Question précédente' : 'Quitter l’exercice'}
          onPress={() => (etape > 0 && !terminee ? setEtape((e) => e - 1) : router.back())}
        />
        <View
          style={styles.progression}
          accessible
          accessibilityLabel={terminee ? 'Exercice terminé' : `Question ${etape + 1} sur ${NB_ETAPES}`}
        >
          <View style={[styles.progressionPleine, { width: `${(Math.min(etape + 1, NB_ETAPES) / NB_ETAPES) * 100}%` }]} />
        </View>
        {!terminee && (
          <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.quitter}>Quitter</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
        {/* La clé fait glisser chaque nouvelle question. */}
        <Apparition key={etape} decalage={24} style={styles.page}>
          {etape === 0 && (
            <Question
              titre="Que s’est-il passé ?"
              aide="Décris la situation en quelques mots : où, quand, avec qui. Reste aux faits."
            >
              <Champ valeur={situation} onChange={setSituation} placeholder="Ex. : réunion de lundi, ma cheffe a critiqué mon dossier" />
            </Question>
          )}

          {etape === 1 && (
            <Question
              titre="Quelle pensée t’est venue ?"
              aide="Écris-la telle qu’elle est arrivée, sans la corriger."
            >
              <Champ valeur={pensee} onChange={setPensee} placeholder="Ex. : « Je suis incompétente, je vais être licenciée »" />
            </Question>
          )}

          {etape === 2 && (
            <Question titre="Qu’as-tu ressenti ?" aide="Choisis l’émotion la plus forte, puis son intensité.">
              <View style={styles.puces}>
                {EMOTIONS.map((e) => (
                  <Chip key={e} label={e} role="radio" selected={emotion === e} onPress={() => setEmotion(e)} />
                ))}
              </View>
              <Echelle valeur={intensiteAvant} onChange={setIntensiteAvant} label={`Intensité de : ${emotion}`} />
            </Question>
          )}

          {etape === 3 && (
            <Question
              titre="Reconnais-tu un piège de pensée ?"
              aide="Notre esprit prend parfois des raccourcis. Coche ceux qui ressemblent à ta pensée, s’il y en a."
            >
              <View>
                {PIEGES.map((p, i) => {
                  const choisi = pieges.includes(p.nom);
                  return (
                    <Pressable
                      key={p.nom}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: choisi }}
                      onPress={() => setPieges((cur) => (choisi ? cur.filter((x) => x !== p.nom) : [...cur, p.nom]))}
                      style={[styles.piege, i > 0 && styles.piegeBordure]}
                    >
                      <View style={[styles.case, choisi && styles.caseCochee]}>
                        {choisi && <Icon name="valider" size={14} color={colors.onDark} strokeWidth={3} />}
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.piegeNom}>{p.nom}</Text>
                        <Text style={styles.piegeTexte}>{p.description}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Question>
          )}

          {etape === 4 && (
            <Question titre="Regarde les faits" aide={`Ta pensée : « ${pensee.trim()} »`}>
              <Label>CE QUI LA CONFIRME</Label>
              <Champ valeur={pour} onChange={setPour} placeholder="Les faits, pas les impressions" />
              <Label>CE QUI LA NUANCE OU LA CONTREDIT</Label>
              <Champ valeur={contre} onChange={setContre} placeholder="Ex. : on m’a félicitée pour le dossier précédent" />
            </Question>
          )}

          {etape === 5 && (
            <Question
              titre="Une pensée plus juste"
              aide="Que dirais-tu à une amie qui vivrait la même chose ? Écris une pensée plus équilibrée, et plus douce."
            >
              <Champ
                valeur={alternative}
                onChange={setAlternative}
                placeholder="Ex. : « Une critique sur un dossier ne dit pas que je suis incompétente. Je peux demander ce qu’il faut améliorer. »"
              />
            </Question>
          )}

          {etape === 6 && (
            <Question titre="Et maintenant ?" aide={`Avec cette nouvelle pensée, quelle est l’intensité de : ${emotion.toLowerCase()} ?`}>
              <Echelle valeur={intensiteApres} onChange={setIntensiteApres} label={`Intensité de : ${emotion}`} />
              <Text style={styles.rappel}>Au début : {intensiteAvant}/10</Text>
            </Question>
          )}

          {terminee && (
            <View style={styles.fin}>
              <Title>Bravo d’avoir pris ce temps</Title>
              <View style={styles.bilan}>
                <Text style={styles.bilanAvant}>« {pensee.trim()} »</Text>
                <Icon name="suivant" size={20} color={colors.lilac} strokeWidth={2.2} />
                <Text style={styles.bilanApres}>{alternative.trim()}</Text>
              </View>
              <Body>
                {intensiteApres < intensiteAvant
                  ? `${emotion} : de ${intensiteAvant} à ${intensiteApres}/10. Ta pensée a perdu un peu de sa force.`
                  : 'Même si l’émotion reste forte, tu as pris du recul. Cela demande de l’entraînement : chaque essai compte.'}
              </Body>
              <Body muted>Tu retrouveras cet exercice dans ton journal, onglet Pensées.</Body>
            </View>
          )}
        </Apparition>
      </ScrollView>

      <View style={styles.bas}>
        {terminee ? (
          <Button label="Terminer" onPress={() => router.back()} />
        ) : (
          <Button label={etape === NB_ETAPES - 1 ? 'Enregistrer' : 'Continuer'} onPress={suivant} disabled={!peutContinuer} />
        )}
      </View>
    </View>
  );
}

function Question({ titre, aide, children }: { titre: string; aide: string; children: ReactNode }) {
  return (
    <>
      <Title>{titre}</Title>
      <Body muted>{aide}</Body>
      {children}
    </>
  );
}

function Champ({ valeur, onChange, placeholder }: { valeur: string; onChange: (t: string) => void; placeholder: string }) {
  return (
    <TextInput
      value={valeur}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      multiline
      maxLength={600}
      accessibilityLabel={placeholder}
      style={styles.champ}
    />
  );
}

// Échelle de 0 à 10, en pastilles.
function Echelle({ valeur, onChange, label }: { valeur: number; onChange: (v: number) => void; label: string }) {
  return (
    <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <View style={styles.echelle}>
        {Array.from({ length: 11 }, (_, v) => {
          const choisie = v === valeur;
          return (
            <Pressable
              key={v}
              accessibilityRole="radio"
              accessibilityState={{ checked: choisie }}
              accessibilityLabel={`${v} sur 10`}
              onPress={() => onChange(v)}
              style={[styles.niveau, choisie && styles.niveauChoisi]}
            >
              <Text style={[styles.niveauTexte, choisie && { color: colors.onDark }]}>{v}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.echelleBornes}>
        <Text style={styles.borne}>Pas du tout</Text>
        <Text style={styles.borne}>Très fort</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: colors.background },
  haut: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: 22 },
  progression: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.lilacLight, overflow: 'hidden' },
  progressionPleine: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  quitter: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.textMuted },
  contenu: { padding: 22, paddingTop: spacing.lg },
  page: { gap: spacing.md },
  champ: {
    minHeight: 110,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.text,
    textAlignVertical: 'top',
  },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  echelle: { flexDirection: 'row', justifyContent: 'space-between', gap: 3 },
  niveau: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  niveauChoisi: { backgroundColor: colors.primary },
  niveauTexte: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.plumDeep },
  echelleBornes: { flexDirection: 'row', justifyContent: 'space-between' },
  borne: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  rappel: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.textMuted },
  piege: { flexDirection: 'row', gap: 14, paddingVertical: 14, alignItems: 'flex-start' },
  piegeBordure: { borderTopWidth: 1, borderTopColor: colors.border },
  case: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  caseCochee: { backgroundColor: colors.primary },
  piegeNom: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.plumDeep },
  piegeTexte: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  fin: { gap: spacing.md },
  bilan: { gap: spacing.sm, backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: 18 },
  bilanAvant: { fontFamily: fonts.displayItalic, fontSize: 17, color: colors.textMuted },
  bilanApres: { fontFamily: fonts.displayMedium, fontSize: 19, lineHeight: 27, color: colors.plumDeep },
  bas: { paddingHorizontal: 22, paddingTop: spacing.sm },
});
