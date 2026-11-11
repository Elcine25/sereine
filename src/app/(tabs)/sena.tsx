import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FleurStatique } from '@/components/Fleur';
import { Button } from '@/components/ui';
import type { Choix, EtapeId } from '@/data/sena';
import { useContenu } from '@/lib/contenu';
import { getPrenom } from '@/lib/storage';
import { colors, fonts, radius, spacing } from '@/lib/theme';

type Message = { id: number; de: 'sena' | 'moi'; texte: string };

function salutation() {
  const h = new Date().getHours();
  if (h < 5) return 'Bonne nuit';
  if (h < 18) return 'Bonjour';
  return 'Bonsoir';
}

// Temps « d'écriture » de Sena, selon la longueur du message.
function delai(texte: string) {
  return 500 + Math.min(texte.length * 18, 1400);
}

// La conversation n'est pas enregistrée : elle disparaît quand on quitte l'app.
export default function Sena() {
  const insets = useSafeAreaInsets();
  // Parcours lu via une référence : une mise à jour des contenus ne relance pas la discussion en cours.
  const { etapes } = useContenu();
  const parcours = useRef(etapes);
  useEffect(() => {
    parcours.current = etapes;
  }, [etapes]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [choix, setChoix] = useState<Choix[]>([]);
  const [ecrit, setEcrit] = useState(false);
  // Choix touchés dans la discussion, en attente de validation.
  const [selection, setSelection] = useState<Choix[]>([]);
  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prochainId = useRef(0);
  const defilement = useRef<ComponentRef<typeof ScrollView>>(null);

  const ajouter = useCallback((de: Message['de'], texte: string) => {
    prochainId.current += 1;
    const id = prochainId.current;
    setMessages((m) => [...m, { id, de, texte }]);
  }, []);

  // Sena écrit les messages d'une ou plusieurs étapes un par un, puis propose
  // les choix de ces étapes (sans doublon).
  const aller = useCallback(
    (etapes: EtapeId[], avant: string[] = []) => {
      const textes = etapes.flatMap((e) => parcours.current[e].messages);
      const suivants = etapes
        .flatMap((e) => parcours.current[e].choix)
        .filter((c, i, tous) => tous.findIndex((x) => x.label === c.label) === i);
      const file = [...avant, ...textes];
      setChoix([]);
      setSelection([]);
      setEcrit(true);
      let t = 0;
      file.forEach((texte, i) => {
        t += delai(texte);
        minuteurs.current.push(
          setTimeout(() => {
            ajouter('sena', texte);
            if (i === file.length - 1) {
              setEcrit(false);
              setChoix(suivants);
            }
          }, t),
        );
      });
    },
    [ajouter],
  );

  const saluer = useCallback(() => {
    getPrenom().then((prenom) => {
      aller(['debut'], [prenom ? `${salutation()} ${prenom}.` : `${salutation()}.`]);
    });
  }, [aller]);

  useEffect(() => {
    saluer();
    const enCours = minuteurs.current;
    return () => enCours.forEach(clearTimeout);
  }, [saluer]);

  const recommencer = () => {
    // On vide le tableau sur place : l'effet de démontage garde la même référence.
    minuteurs.current.splice(0).forEach(clearTimeout);
    setMessages([]);
    saluer();
  };

  // Les réponses qui font avancer la discussion se cumulent.
  // Un raccourci (respirer, journal, article, appel…) est toujours choisi seul.
  const basculer = (c: Choix) => {
    setSelection((actuelle) => {
      if (actuelle.includes(c)) return actuelle.filter((x) => x !== c);
      if (c.action.type !== 'etape') return [c];
      return [...actuelle.filter((x) => x.action.type === 'etape'), c];
    });
  };

  const valider = () => {
    if (selection.length === 0) return;
    setSelection([]);
    const etapes = selection.flatMap((c) => (c.action.type === 'etape' ? [c.action.vers] : []));
    if (etapes.length > 0) {
      ajouter('moi', selection.map((c) => c.label).join(', '));
      // Sécurité d'abord : si « idées noires » fait partie des réponses, on ne parle que de ça.
      if (etapes.includes('danger')) aller(['danger']);
      else aller(etapes, etapes.length > 1 ? ['Merci de me dire tout ça. Prenons les choses une par une.'] : []);
      return;
    }
    const a = selection[0].action;
    switch (a.type) {
      case 'respirer':
        router.push('/respirer');
        break;
      case 'journal':
        router.navigate('/humeur');
        break;
      case 'sos':
        router.navigate('/sos');
        break;
      case 'fiche':
        router.push(`/fiche/${a.id}`);
        break;
      case 'appel':
        Linking.openURL(`tel:${a.numero}`);
        break;
    }
  };

  return (
    <View style={styles.ecran}>
      <View style={[styles.entete, { paddingTop: insets.top + 10 }]}>
        <View style={styles.avatar}>
          <FleurStatique size={34} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nom}>Sena</Text>
          <Text style={styles.role}>Ta compagne d’écoute</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={recommencer} hitSlop={8} style={styles.recommencer}>
          <Text style={styles.recommencerTexte}>Recommencer</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={defilement}
        style={{ flex: 1 }}
        contentContainerStyle={styles.fil}
        onContentSizeChange={() => defilement.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m) => (
          <View key={m.id} style={[styles.bulle, m.de === 'sena' ? styles.bulleSena : styles.bulleMoi]}>
            <Text style={[styles.bulleTexte, m.de === 'moi' && { color: colors.onDark }]}>{m.texte}</Text>
          </View>
        ))}

        {ecrit && <Points />}

        {choix.length > 0 && (
          <View style={styles.choix}>
            {choix.filter((c) => c.action.type === 'etape').length > 1 && (
              <Text style={styles.aide}>Tu peux choisir plusieurs réponses.</Text>
            )}
            {choix.map((c) => {
              const choisi = selection.includes(c);
              return (
                <Pressable
                  key={c.label}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: choisi }}
                  onPress={() => basculer(c)}
                  style={({ pressed }) => [
                    styles.choixBouton,
                    pressed && !choisi && { backgroundColor: colors.primarySoft },
                    choisi && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.choixTexte, choisi && { color: colors.onDark }]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={styles.bas}>
        <Text style={styles.avertissement}>
          Sena n’est pas une thérapeute. En cas d’urgence, ouvre l’onglet SOS.
        </Text>
        <Button label="Valider" onPress={valider} disabled={selection.length === 0 || ecrit} />
      </View>
    </View>
  );
}

// Les trois points qui montrent que Sena écrit.
function Points() {
  const [valeurs] = useState(() => [0, 1, 2].map(() => new Animated.Value(0.25)));

  useEffect(() => {
    const boucle = Animated.loop(
      Animated.stagger(
        150,
        valeurs.map((v) =>
          Animated.sequence([
            Animated.timing(v, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(v, { toValue: 0.25, duration: 300, useNativeDriver: true }),
          ]),
        ),
      ),
    );
    boucle.start();
    return () => boucle.stop();
  }, [valeurs]);

  return (
    <View style={[styles.bulle, styles.bulleSena, styles.points]} accessibilityLabel="Sena écrit">
      {valeurs.map((v, i) => (
        <Animated.View key={i} style={[styles.point, { opacity: v }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: colors.background },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nom: { fontFamily: fonts.display, fontSize: 19, color: colors.plumDeep },
  role: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  recommencer: { minHeight: 44, justifyContent: 'center' },
  recommencerTexte: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primary },
  fil: { padding: 16, gap: 10 },
  bulle: { maxWidth: '82%', paddingVertical: 11, paddingHorizontal: 14 },
  bulleSena: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
  },
  bulleMoi: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  bulleTexte: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.plumDeep },
  points: { flexDirection: 'row', gap: 5, paddingVertical: 15 },
  point: { width: 7, height: 7, borderRadius: radius.pill, backgroundColor: colors.primary },
  choix: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },
  aide: { width: '100%', fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
  choixBouton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  choixTexte: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.primary },
  bas: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, gap: 8 },
  avertissement: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
