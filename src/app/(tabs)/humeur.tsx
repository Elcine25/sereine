import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { JournalGratitude } from '@/components/journal/Gratitude';
import { JournalPensees } from '@/components/journal/Pensees';
import { MoodFace } from '@/components/MoodFace';
import { Segments } from '@/components/Segments';
import { useToast } from '@/components/Toast';
import { Body, Button, Card, Chip, Screen, Subtitle, Title } from '@/components/ui';
import { addMood, deleteMood, getMoods, type MoodEntry } from '@/lib/storage';
import { colors, fonts, moods, radius, spacing, type MoodValue } from '@/lib/theme';

const TAGS = [
  'Anxiété',
  'Tristesse',
  'Stress au travail',
  'Fatigue',
  'Sommeil difficile',
  'Colère',
  'Solitude',
  'Famille',
  'Couple',
  'Cycle / hormones',
  'Gratitude',
  'Fierté',
];

function lireHumeur(param: string | undefined): MoodValue | null {
  const v = Number(param);
  return moods.some((m) => m.value === v) ? (v as MoodValue) : null;
}

type Onglet = 'humeur' | 'gratitude' | 'pensees';

const ONGLETS: { valeur: Onglet; label: string }[] = [
  { valeur: 'humeur', label: 'Humeur' },
  { valeur: 'gratitude', label: 'Gratitude' },
  { valeur: 'pensees', label: 'Pensées' },
];

function lireOnglet(param: string | undefined): Onglet | null {
  return ONGLETS.some((o) => o.valeur === param) ? (param as Onglet) : null;
}

export default function Journal() {
  // ?mood=3 : visage touché sur l'accueil. ?onglet=gratitude : depuis une notification.
  const params = useLocalSearchParams<{ mood?: string; onglet?: string }>();
  const [onglet, setOnglet] = useState<Onglet>(lireOnglet(params.onglet) ?? 'humeur');

  const [paramsVus, setParamsVus] = useState(params);
  if (params.mood !== paramsVus.mood || params.onglet !== paramsVus.onglet) {
    setParamsVus(params);
    if (lireHumeur(params.mood)) setOnglet('humeur');
    else if (lireOnglet(params.onglet)) setOnglet(lireOnglet(params.onglet)!);
  }

  return (
    <Screen>
      <Title>Mon journal</Title>
      <Segments options={ONGLETS} valeur={onglet} onChange={setOnglet} />
      {/* La clé fait rejouer l'apparition à chaque changement d'onglet. */}
      <View key={onglet}>
        {onglet === 'humeur' && <JournalHumeur moodParam={params.mood} />}
        {onglet === 'gratitude' && <JournalGratitude />}
        {onglet === 'pensees' && <JournalPensees />}
      </View>
    </Screen>
  );
}

function JournalHumeur({ moodParam }: { moodParam: string | undefined }) {
  const toast = useToast();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [mood, setMood] = useState<MoodValue | null>(lireHumeur(moodParam));
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [dernierEnregistre, setDernierEnregistre] = useState<MoodValue | null>(null);

  // Visage touché sur l'accueil : présélectionne cette humeur.
  const [paramVu, setParamVu] = useState(moodParam);
  if (moodParam !== paramVu) {
    setParamVu(moodParam);
    const v = lireHumeur(moodParam);
    if (v) setMood(v);
  }

  const charger = useCallback(() => {
    getMoods().then(setEntries);
  }, []);
  useFocusEffect(charger);

  const toggleTag = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const enregistrer = async () => {
    if (!mood) return;
    await addMood({ mood, tags, note: note.trim() });
    setDernierEnregistre(mood);
    toast('Humeur enregistrée');
    setMood(null);
    setTags([]);
    setNote('');
    router.setParams({ mood: undefined });
    charger();
  };

  return (
    <View style={styles.colonne}>
      <Card>
        <Subtitle>Comment te sens-tu en ce moment ?</Subtitle>
        <View style={styles.moodRow}>
          {moods.map((m) => {
            const choisie = mood === m.value;
            return (
              <Pressable
                key={m.value}
                accessibilityRole="radio"
                accessibilityLabel={m.label}
                accessibilityState={{ checked: choisie }}
                onPress={() => setMood(m.value)}
                style={styles.moodBtn}
              >
                <View style={[styles.anneau, choisie && { borderColor: colors.primary }]}>
                  <MoodFace value={m.value} size={44} />
                </View>
                <Text style={[styles.moodLabel, choisie && { color: colors.primary }]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Qu’est-ce qui joue sur ton humeur ?</Text>
        <View style={styles.tags}>
          {TAGS.map((t) => (
            <Chip key={t} label={t} selected={tags.includes(t)} onPress={() => toggleTag(t)} />
          ))}
        </View>

        <Text style={styles.label}>Note libre (facultatif)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Ce que tu ressens, ce qui s’est passé, une chose positive…"
          placeholderTextColor={colors.textMuted}
          multiline
          style={styles.input}
        />
        <Button label="Enregistrer" onPress={enregistrer} disabled={!mood} />
      </Card>

      {dernierEnregistre !== null && dernierEnregistre <= 2 && (
        <Card style={{ backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }}>
          <Body>
            Merci de l’avoir noté. Ce moment est difficile, et tu n’as pas à le traverser seule. Un exercice de
            respiration peut aider maintenant, et si tu te sens en danger, appelle un numéro d’aide.
          </Body>
          <View style={{ gap: spacing.sm }}>
            <Button label="Respirer 2 minutes" onPress={() => router.push('/respirer')} />
            <Button label="Voir les numéros d’aide" variant="outline" onPress={() => router.navigate('/sos')} />
          </View>
        </Card>
      )}

      <Graphique entries={entries} />

      <Subtitle>Historique</Subtitle>
      {entries.length === 0 && <Body muted>Tes notes apparaîtront ici.</Body>}
      {entries.slice(0, 30).map((e) => (
        <EntreeHistorique key={e.id} entry={e} onDelete={() => deleteMood(e.id).then(charger)} />
      ))}
    </View>
  );
}

// Moyenne de l'humeur par jour sur les 14 derniers jours.
function Graphique({ entries }: { entries: MoodEntry[] }) {
  const jours = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const duJour = entries.filter((e) => new Date(e.date).toDateString() === d.toDateString());
    const moyenne = duJour.length ? duJour.reduce((s, e) => s + e.mood, 0) / duJour.length : null;
    return { d, moyenne };
  });

  return (
    <Card>
      <Subtitle>Tes 14 derniers jours</Subtitle>
      <View style={styles.chart}>
        {jours.map(({ d, moyenne }) => (
          <View key={d.toISOString()} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${((moyenne ?? 0.15) / 5) * 100}%`,
                    backgroundColor: moyenne ? colors.primary : colors.border,
                    opacity: moyenne ? 0.35 + (moyenne / 5) * 0.65 : 1,
                  },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{d.getDate()}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function EntreeHistorique({ entry, onDelete }: { entry: MoodEntry; onDelete: () => void }) {
  const [confirmer, setConfirmer] = useState(false);
  const m = moods.find((x) => x.value === entry.mood);
  const date = new Date(entry.date).toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <Card>
      <View style={styles.entryHeader}>
        <View style={styles.entryMood}>
          <MoodFace value={entry.mood} size={28} />
          <Text style={styles.entryMoodLabel}>{m?.label}</Text>
        </View>
        <Text style={styles.entryDate}>{date}</Text>
      </View>
      {entry.tags.length > 0 && <Body muted>{entry.tags.join(' · ')}</Body>}
      {entry.note !== '' && <Body>{entry.note}</Body>}
      <Pressable accessibilityRole="button" onPress={() => (confirmer ? onDelete() : setConfirmer(true))}>
        <Text style={styles.delete}>{confirmer ? 'Confirmer la suppression' : 'Supprimer'}</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  colonne: { gap: spacing.md + 2 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  moodBtn: { alignItems: 'center', gap: 6, minWidth: 54 },
  anneau: { borderRadius: radius.pill, padding: 3, borderWidth: 2, borderColor: 'transparent' },
  moodLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textMuted },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.plumDeep, marginTop: spacing.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  input: {
    minHeight: 90,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
  },
  chart: { flexDirection: 'row', height: 120, gap: 4, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 4, height: '100%' },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { fontFamily: fonts.body, fontSize: 10, color: colors.textMuted },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  entryMood: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  entryMoodLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.plumDeep },
  entryDate: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  delete: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primary, marginTop: spacing.xs },
});
