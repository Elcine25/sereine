import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/components/icons';
import { Motif } from '@/components/Motif';
import { Button, Label, Screen, Title } from '@/components/ui';
import type { Contact } from '@/data/sos';
import { useContenu } from '@/lib/contenu';
import { colors, fonts, radius, spacing } from '@/lib/theme';

const ANCRAGE = [
  'choses que tu vois autour de toi',
  'choses que tu peux toucher',
  'sons que tu entends',
  'odeurs que tu sens',
  'goût dans ta bouche',
];

function appeler(numero: string) {
  Linking.openURL(`tel:${numero.replace(/\s/g, '')}`);
}

export default function SOS() {
  const { urgence, autres: autresNumeros } = useContenu().sos;
  return (
    <Screen>
      <Title>Besoin d’aide</Title>

      <View style={styles.alerte}>
        <Motif size={300} style={{ right: -110, top: -120 }} couleurs={[colors.lilac, colors.plumMid]} />
        <Text style={styles.alerteTitre}>Tu n’es pas seule.</Text>
        <Text style={styles.alerteTexte}>
          Si tu penses à te faire du mal ou si tu es en danger, appelle maintenant. Ces lignes sont là pour t’aider,
          sans jugement.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Appeler ${urgence.nom}, ${urgence.numero}`}
          onPress={() => appeler(urgence.numero)}
          style={({ pressed }) => [styles.appelUrgence, pressed && { backgroundColor: colors.lilacLight }]}
        >
          <View style={styles.appelIcone}>
            <Icon name="telephone" size={22} color={colors.onDark} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.appelNom}>{urgence.nom}</Text>
            <Text style={styles.appelDesc}>{urgence.description}</Text>
          </View>
          <Text style={styles.appelNumero}>{urgence.numero}</Text>
        </Pressable>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Label>AUTRES NUMÉROS</Label>
        {autresNumeros.map((c) => (
          <LigneContact key={c.nom} contact={c} />
        ))}
      </View>

      <View style={styles.attente}>
        <Text style={styles.attenteTitre}>En attendant, reviens au moment présent</Text>
        <Text style={styles.attenteTexte}>Prends le temps de nommer, sans te presser :</Text>
        {ANCRAGE.map((texte, i) => (
          <View key={texte} style={styles.etape}>
            <View style={styles.chiffre}>
              <Text style={styles.chiffreTexte}>{5 - i}</Text>
            </View>
            <Text style={styles.etapeTexte}>{texte}</Text>
          </View>
        ))}
        <View style={{ marginTop: spacing.xs }}>
          <Button label="Respirer avec moi" onPress={() => router.push('/respirer')} />
        </View>
      </View>
    </Screen>
  );
}

function LigneContact({ contact }: { contact: Contact }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Appeler ${contact.nom}, ${contact.numero}`}
      onPress={() => appeler(contact.numero)}
      style={({ pressed }) => [styles.contact, pressed && { backgroundColor: colors.primarySoft }]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.nom}>{contact.nom}</Text>
        <Text style={styles.desc}>{contact.description}</Text>
      </View>
      <View style={styles.appel}>
        <Icon name="telephone" size={16} color={colors.primary} strokeWidth={2} />
        <Text style={styles.numero}>{contact.numero}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  alerte: {
    backgroundColor: colors.plumDeep,
    borderRadius: 26,
    padding: 20,
    gap: 10,
    overflow: 'hidden',
  },
  alerteTitre: { fontFamily: fonts.display, fontSize: 24, color: colors.onDark },
  alerteTexte: { fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.onDarkMuted, maxWidth: 300 },
  appelUrgence: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 12,
  },
  appelIcone: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appelNom: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.plumDeep },
  appelDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  appelNumero: { fontFamily: fonts.display, fontSize: 22, color: colors.primary, paddingRight: 4 },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  nom: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.plumDeep },
  desc: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  appel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  numero: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.primary },
  attente: { borderRadius: 22, backgroundColor: colors.primarySoft, padding: 18, gap: 10 },
  attenteTitre: { fontFamily: fonts.display, fontSize: 19, color: colors.plumDeep },
  attenteTexte: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  etape: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chiffre: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chiffreTexte: { fontFamily: fonts.display, fontSize: 15, color: colors.primary },
  etapeTexte: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 15, color: colors.plumDeep },
});
