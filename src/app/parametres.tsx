import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Application from 'expo-application';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Icon } from '@/components/icons';
import { useToast } from '@/components/Toast';
import { Body, Button, Card, Chip, Screen, Subtitle } from '@/components/ui';
import { useCompte } from '@/lib/compte';
import { useOnboarding } from '@/lib/onboarding';
import { demanderAutorisation, rappelsDisponibles } from '@/lib/rappels';
import { clearAllData, getPrenom, getRappel, setPrenom, setRappel, type Rappel } from '@/lib/storage';
import { useVerrou, verrouDisponible } from '@/lib/verrou';
import { colors, fonts, radius, spacing } from '@/lib/theme';

export default function Parametres() {
  const { reset } = useOnboarding();
  const { hasPin, removePin, bioAvailable, bioEnabled, setBioEnabled } = useVerrou();
  const compte = useCompte();
  const toast = useToast();
  const [confirmer, setConfirmer] = useState(false);
  const [confirmerVerrou, setConfirmerVerrou] = useState(false);
  const [prenom, setPrenomSaisi] = useState('');
  const [prenomEnregistre, setPrenomEnregistre] = useState(false);

  useEffect(() => {
    getPrenom().then(setPrenomSaisi);
  }, []);

  const enregistrerPrenom = async () => {
    await setPrenom(prenom);
    setPrenomEnregistre(true);
  };

  const toutEffacer = async () => {
    await clearAllData();
    await removePin();
    // Les données du compte en ligne ne sont pas touchées : on se déconnecte seulement.
    if (compte.email) await compte.deconnecter();
    reset();
    router.replace('/bienvenue');
    toast('Toutes tes données ont été effacées de ce téléphone.');
  };

  const desactiverVerrou = async () => {
    await removePin();
    setConfirmerVerrou(false);
  };

  return (
    <Screen safeTop={false}>
      {compte.disponible && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/compte')}
          style={({ pressed }) => [styles.compte, pressed && { opacity: 0.8 }]}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.compteTitre}>{compte.email ? 'Mon compte' : 'Créer un compte ou me connecter'}</Text>
            <Text style={styles.compteTexte}>
              {compte.email ?? 'Retrouve ton journal sur tous tes appareils'}
            </Text>
          </View>
          <Icon name="suivant" size={20} color={colors.onDark} strokeWidth={2.2} />
        </Pressable>
      )}

      {rappelsDisponibles && <CarteRappel />}

      <Card>
        <Subtitle>Ton prénom</Subtitle>
        <TextInput
          value={prenom}
          onChangeText={(t) => {
            setPrenomSaisi(t);
            setPrenomEnregistre(false);
          }}
          placeholder="Ton prénom ou un surnom"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
          maxLength={30}
          accessibilityLabel="Ton prénom"
          style={styles.input}
        />
        <Button
          label={prenomEnregistre ? 'Enregistré' : 'Enregistrer'}
          variant="secondary"
          onPress={enregistrerPrenom}
          disabled={prenomEnregistre}
        />
      </Card>

      <Card>
        <Subtitle>Verrouillage</Subtitle>
        {!verrouDisponible ? (
          <Body muted>
            Le code n’est pas disponible dans la version web. Utilise l’application sur ton téléphone pour protéger ton
            journal.
          </Body>
        ) : hasPin ? (
          <>
            <Body muted>Un code est demandé à chaque ouverture de Sereine.</Body>
            {bioAvailable && (
              <View style={styles.ligne}>
                <Text style={styles.ligneTexte}>Déverrouiller avec l’empreinte ou Face ID</Text>
                <Switch
                  value={bioEnabled}
                  onValueChange={setBioEnabled}
                  trackColor={{ true: colors.primary, false: colors.borderStrong }}
                  thumbColor={colors.surface}
                  accessibilityLabel="Déverrouiller avec l’empreinte ou Face ID"
                />
              </View>
            )}
            <Button
              label="Changer mon code"
              variant="secondary"
              onPress={() => router.push({ pathname: '/creer-code', params: { depuis: 'parametres' } })}
            />
            {confirmerVerrou ? (
              <>
                <Body>Sans code, toute personne qui prend ton téléphone pourra ouvrir Sereine.</Body>
                <Button label="Oui, désactiver" onPress={desactiverVerrou} />
                <Button label="Annuler" variant="outline" onPress={() => setConfirmerVerrou(false)} />
              </>
            ) : (
              <Button label="Désactiver le verrou" variant="outline" onPress={() => setConfirmerVerrou(true)} />
            )}
          </>
        ) : (
          <>
            <Body muted>Protège ton journal et tes humeurs avec un code à 4 chiffres.</Body>
            <Button
              label="Créer un code"
              onPress={() => router.push({ pathname: '/creer-code', params: { depuis: 'parametres' } })}
            />
          </>
        )}
      </Card>

      <Card>
        <Subtitle>Confidentialité</Subtitle>
        {verrouDisponible ? (
          <Body>
            Tes données (humeurs, notes, exercices) sont enregistrées sur ce téléphone. Sans compte, rien n’est envoyé
            sur internet. Avec un compte, une copie est sauvegardée en ligne, accessible uniquement par toi.
          </Body>
        ) : (
          <Body>
            Dans la version web, tes données (humeurs, notes) restent uniquement dans ce navigateur. Rien n’est envoyé
            sur internet. Toute personne qui utilise ce navigateur peut les voir, et elles disparaissent si tu effaces
            les données de navigation.
          </Body>
        )}
      </Card>

      <Card>
        <Subtitle>Effacer mes données</Subtitle>
        <Body muted>Supprime définitivement de ce téléphone ton journal (humeurs, gratitude, exercices), tes favoris, tes rappels et ton code.{compte.email ? ' Ton compte en ligne n’est pas supprimé : tu seras seulement déconnectée.' : ''}</Body>
        {confirmer ? (
          <>
            <Body>Es-tu sûre ? Cette action est irréversible.</Body>
            <Button label="Oui, tout effacer" onPress={toutEffacer} />
            <Button label="Annuler" variant="outline" onPress={() => setConfirmer(false)} />
          </>
        ) : (
          <Button label="Effacer toutes mes données" variant="outline" onPress={() => setConfirmer(true)} />
        )}
      </Card>

      <Body muted>Sereine — {versionApp()}</Body>
    </Screen>
  );
}

// Notification quotidienne à l'heure choisie (réglage par pas de 15 minutes).
function CarteRappel() {
  const toast = useToast();
  const [rappel, setRappelAffiche] = useState<Rappel | null>(null);
  const [refuse, setRefuse] = useState(false);
  const [saisie, setSaisie] = useState('');
  const [erreurHeure, setErreurHeure] = useState(false);

  useEffect(() => {
    getRappel().then((r) => {
      setRappelAffiche(r);
      setSaisie(heureTexte(r));
    });
  }, []);

  if (!rappel) return null;

  const enregistrer = async (r: Rappel) => {
    setRappelAffiche(r);
    await setRappel(r);
  };

  const basculer = async (actif: boolean) => {
    if (actif && !(await demanderAutorisation())) {
      setRefuse(true);
      return;
    }
    setRefuse(false);
    await enregistrer({ ...rappel, actif });
    if (actif) toast(`Rappel activé à ${heureTexte(rappel)}`);
  };

  const choisirHeure = async (heure: number, minute: number) => {
    const r = { ...rappel, heure, minute };
    setSaisie(heureTexte(r));
    setErreurHeure(false);
    if (heure === rappel.heure && minute === rappel.minute) return;
    await enregistrer(r);
    toast(`Rappel programmé à ${heureTexte(r)}`);
  };

  // Valide l'heure tapée (« 20:30 », « 20h30 », « 2030 », « 8 »…).
  const validerSaisie = () => {
    const h = lireHeure(saisie);
    if (h) choisirHeure(h.heure, h.minute);
    else setErreurHeure(true);
  };

  return (
    <Card>
      <Subtitle>Rappel quotidien</Subtitle>
      <View style={styles.ligne}>
        <Text style={styles.ligneTexte}>Recevoir une notification chaque jour</Text>
        <Switch
          value={rappel.actif}
          onValueChange={basculer}
          trackColor={{ true: colors.primary, false: colors.borderStrong }}
          thumbColor={colors.surface}
          accessibilityLabel="Recevoir une notification chaque jour"
        />
      </View>
      <Body muted>
        Une invitation à noter ton humeur, un message apaisant les jours difficiles, ou la sortie d’un nouvel article.
      </Body>
      {refuse && (
        <Body>Les notifications sont bloquées pour Sereine. Autorise-les dans les réglages de ton téléphone.</Body>
      )}
      {rappel.actif && (
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.ligneTexte} nativeID="label-heure">
            Heure du rappel
          </Text>
          <View style={styles.heure}>
            <TextInput
              value={saisie}
              onChangeText={(t) => {
                setSaisie(t.replace(/[^d:hH]/g, '').slice(0, 5));
                setErreurHeure(false);
              }}
              onSubmitEditing={validerSaisie}
              onBlur={validerSaisie}
              placeholder="20:00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              returnKeyType="done"
              maxLength={5}
              selectTextOnFocus
              accessibilityLabelledBy="label-heure"
              accessibilityHint="Saisis une heure, par exemple 20:30"
              style={[styles.heureSaisie, erreurHeure && { borderColor: colors.primary }]}
            />
            <Button label="Valider" variant="secondary" onPress={validerSaisie} />
          </View>
          {erreurHeure && <Text style={styles.erreur}>Heure invalide. Exemple : 20:30</Text>}
          <View style={styles.raccourcis}>
            {RACCOURCIS.map(([heure, minute]) => {
              const texte = heureTexte({ ...rappel, heure, minute });
              return (
                <Chip
                  key={texte}
                  role="radio"
                  label={texte}
                  selected={rappel.heure === heure && rappel.minute === minute}
                  onPress={() => choisirHeure(heure, minute)}
                />
              );
            })}
          </View>
        </View>
      )}
    </Card>
  );
}

const RACCOURCIS: [number, number][] = [
  [8, 0],
  [12, 30],
  [18, 0],
  [20, 0],
  [21, 30],
];

function lireHeure(texte: string): { heure: number; minute: number } | null {
  const t = texte.trim().toLowerCase();
  const m = /^(d{1,2})(?:[:h](d{2})?)?$/.exec(t) ?? /^(d{1,2})(d{2})$/.exec(t);
  if (!m) return null;
  const heure = Number(m[1]);
  const minute = Number(m[2] ?? 0);
  return heure < 24 && minute < 60 ? { heure, minute } : null;
}

const heureTexte = (r: Rappel) => `${String(r.heure).padStart(2, '0')}:${String(r.minute).padStart(2, '0')}`;

// Version exacte (avec le numéro de build) pour que les testeuses puissent l’indiquer dans leurs retours.
// Dans Expo Go, Application renvoie la version d’Expo Go : on lit alors celle de app.json.
function versionApp(): string {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return `version ${Constants.expoConfig?.version ?? '?'} (Expo Go)`;
  }
  const version = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '?';
  const build = Application.nativeBuildVersion;
  return build ? `version ${version} (build ${build})` : `version ${version}`;
}

const styles = StyleSheet.create({
  compte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 18,
  },
  compteTitre: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.onDark },
  compteTexte: { fontFamily: fonts.body, fontSize: 14, color: colors.onDarkMuted },
  heure: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heureSaisie: {
    flex: 1,
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.plumDeep,
    textAlign: 'center',
  },
  erreur: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.primary },
  raccourcis: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  ligneTexte: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 15, color: colors.plumDeep },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
  },
});
