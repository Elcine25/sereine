import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useToast } from '@/components/Toast';
import { Body, Button, Card, Subtitle } from '@/components/ui';
import { IDEES_GRATITUDE } from '@/data/exercices';
import { duJour } from '@/lib/contenu';
import { addGratitude, deleteGratitude, getGratitudes, type Gratitude } from '@/lib/storage';
import { colors, fonts, radius, spacing } from '@/lib/theme';

const VIDE = ['', '', ''];

// Journal de gratitude : noter jusqu'à trois choses positives de la journée.
export function JournalGratitude() {
  const toast = useToast();
  const [notes, setNotes] = useState<Gratitude[]>([]);
  const [choses, setChoses] = useState(VIDE);

  const charger = useCallback(() => {
    getGratitudes().then(setNotes);
  }, []);
  useFocusEffect(charger);

  const remplies = choses.map((c) => c.trim()).filter(Boolean);

  const enregistrer = async () => {
    if (remplies.length === 0) return;
    await addGratitude({ choses: remplies });
    setChoses(VIDE);
    toast('Ajouté à ton journal de gratitude');
    charger();
  };

  return (
    <View style={styles.colonne}>
      <Card>
        <Subtitle>Trois choses positives</Subtitle>
        <Body muted>Même minuscules, elles comptent. Idée du jour : {duJour(IDEES_GRATITUDE).toLowerCase()}.</Body>
        {choses.map((c, i) => (
          <TextInput
            key={i}
            value={c}
            onChangeText={(t) => setChoses((cur) => cur.map((x, j) => (j === i ? t : x)))}
            placeholder={`${i + 1}.`}
            placeholderTextColor={colors.textMuted}
            maxLength={200}
            accessibilityLabel={`Chose positive numéro ${i + 1}`}
            style={styles.input}
          />
        ))}
        <Button label="Enregistrer" onPress={enregistrer} disabled={remplies.length === 0} />
      </Card>

      <Subtitle>Mes moments positifs</Subtitle>
      {notes.length === 0 && <Body muted>Tes notes de gratitude apparaîtront ici.</Body>}
      <View>
        {notes.slice(0, 30).map((n, i) => (
          <NoteGratitude key={n.id} note={n} premiere={i === 0} onDelete={() => deleteGratitude(n.id).then(charger)} />
        ))}
      </View>
    </View>
  );
}

function NoteGratitude({ note, premiere, onDelete }: { note: Gratitude; premiere: boolean; onDelete: () => void }) {
  const [confirmer, setConfirmer] = useState(false);
  const date = new Date(note.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <View style={[styles.note, !premiere && styles.noteBordure]}>
      <Text style={styles.date}>{date}</Text>
      {note.choses.map((c, i) => (
        <View key={i} style={styles.ligne}>
          <View style={styles.puce} />
          <Text style={styles.texte}>{c}</Text>
        </View>
      ))}
      <Pressable accessibilityRole="button" onPress={() => (confirmer ? onDelete() : setConfirmer(true))}>
        <Text style={styles.supprimer}>{confirmer ? 'Confirmer la suppression' : 'Supprimer'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  colonne: { gap: spacing.md + 2 },
  input: {
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
  },
  note: { paddingVertical: spacing.md, gap: 6 },
  noteBordure: { borderTopWidth: 1, borderTopColor: colors.border },
  date: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primary, textTransform: 'capitalize' },
  ligne: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  puce: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lilac, marginTop: 9 },
  texte: { flex: 1, fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.textSoft },
  supprimer: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primary, marginTop: spacing.xs },
});
