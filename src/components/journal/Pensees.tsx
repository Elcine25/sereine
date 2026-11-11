import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Icon } from '@/components/icons';
import { Body, Button, Subtitle } from '@/components/ui';
import { deletePensee, getPensees, type PenseeTravaillee } from '@/lib/storage';
import { colors, fonts, radius, spacing } from '@/lib/theme';

// Onglet « Pensées » du Journal : lance l'exercice guidé et garde les exercices faits.
export function JournalPensees() {
  const [pensees, setPensees] = useState<PenseeTravaillee[]>([]);

  const charger = useCallback(() => {
    getPensees().then(setPensees);
  }, []);
  useFocusEffect(charger);

  return (
    <View style={styles.colonne}>
      <View style={styles.intro}>
        <Subtitle>Démêler une pensée</Subtitle>
        <Body muted>
          Quand une pensée fait mal, l’examiner pas à pas aide à prendre du recul. Cet exercice vient des thérapies
          cognitives et comportementales. Compte cinq minutes.
        </Body>
        <Button label="Commencer l’exercice" onPress={() => router.push('/exercice-pensee')} />
      </View>

      <Subtitle>Mes pensées démêlées</Subtitle>
      {pensees.length === 0 && <Body muted>Tes exercices apparaîtront ici.</Body>}
      <View>
        {pensees.slice(0, 30).map((p, i) => (
          <PenseeResume key={p.id} pensee={p} premiere={i === 0} onDelete={() => deletePensee(p.id).then(charger)} />
        ))}
      </View>
    </View>
  );
}

function PenseeResume({
  pensee,
  premiere,
  onDelete,
}: {
  pensee: PenseeTravaillee;
  premiere: boolean;
  onDelete: () => void;
}) {
  const [ouverte, setOuverte] = useState(false);
  const [confirmer, setConfirmer] = useState(false);
  const date = new Date(pensee.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  return (
    <View style={[styles.item, !premiere && styles.itemBordure]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: ouverte }}
        onPress={() => setOuverte((v) => !v)}
        style={styles.entete}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.date}>
            {date} · {pensee.emotion} {pensee.intensiteAvant} → {pensee.intensiteApres}/10
          </Text>
          <Text style={styles.avant} numberOfLines={ouverte ? undefined : 1}>
            « {pensee.pensee} »
          </Text>
          <Text style={styles.apres} numberOfLines={ouverte ? undefined : 2}>
            {pensee.alternative}
          </Text>
        </View>
        <View style={{ transform: [{ rotate: ouverte ? '90deg' : '0deg' }] }}>
          <Icon name="suivant" size={18} color={colors.textMuted} strokeWidth={2.2} />
        </View>
      </Pressable>

      {ouverte && (
        <View style={styles.details}>
          {pensee.situation !== '' && <Detail titre="Situation" texte={pensee.situation} />}
          {pensee.pieges.length > 0 && <Detail titre="Pièges repérés" texte={pensee.pieges.join(', ')} />}
          {pensee.pour !== '' && <Detail titre="Ce qui la confirme" texte={pensee.pour} />}
          {pensee.contre !== '' && <Detail titre="Ce qui la nuance" texte={pensee.contre} />}
          <Pressable accessibilityRole="button" onPress={() => (confirmer ? onDelete() : setConfirmer(true))}>
            <Text style={styles.supprimer}>{confirmer ? 'Confirmer la suppression' : 'Supprimer'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Detail({ titre, texte }: { titre: string; texte: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={styles.detailTitre}>{titre}</Text>
      <Text style={styles.detailTexte}>{texte}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  colonne: { gap: spacing.md + 2 },
  intro: { gap: spacing.sm + 2, backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: 18 },
  item: { paddingVertical: spacing.md, gap: spacing.sm },
  itemBordure: { borderTopWidth: 1, borderTopColor: colors.border },
  entete: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  date: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primary },
  avant: { fontFamily: fonts.displayItalic, fontSize: 16, color: colors.textMuted },
  apres: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 23, color: colors.plumDeep },
  details: { gap: spacing.sm + 2, paddingTop: spacing.xs },
  detailTitre: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.4, color: colors.textMuted },
  detailTexte: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.textSoft },
  supprimer: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primary },
});
