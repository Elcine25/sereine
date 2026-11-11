import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useToast } from '@/components/Toast';
import { Body, Button, Card, Screen, Subtitle } from '@/components/ui';
import { useCompte } from '@/lib/compte';
import { colors, fonts, radius, spacing } from '@/lib/theme';

// Compte facultatif : connexion par code reçu par e-mail, puis synchronisation.
export default function Compte() {
  const { disponible, email } = useCompte();

  if (!disponible) {
    return (
      <Screen safeTop={false}>
        <Body>La création de compte n’est pas encore disponible dans cette version de l’application.</Body>
      </Screen>
    );
  }
  return email ? <Connectee email={email} /> : <Connexion />;
}

function Connexion() {
  const { envoyerCode, verifierCode } = useCompte();
  const toast = useToast();
  const [adresse, setAdresse] = useState('');
  const [code, setCode] = useState('');
  const [codeEnvoye, setCodeEnvoye] = useState(false);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const adresseValide = /^\S+@\S+\.\S+$/.test(adresse.trim());

  const agir = async (action: () => Promise<void>) => {
    setAttente(true);
    setErreur(null);
    try {
      await action();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setAttente(false);
    }
  };

  const demanderCode = () =>
    agir(async () => {
      await envoyerCode(adresse.trim());
      setCodeEnvoye(true);
      setCode('');
    });

  const valider = () =>
    agir(async () => {
      await verifierCode(adresse.trim(), code.trim());
      toast('Connectée. Tes données se synchronisent.');
    });

  return (
    <Screen safeTop={false}>
      <View style={styles.intro}>
        <Subtitle>Retrouve tes données partout</Subtitle>
        <Body muted>
          Avec un compte, ton journal, tes notes de gratitude, tes exercices, tes favoris et ton prénom sont sauvegardés
          et se retrouvent sur tous tes appareils. Pas de mot de passe : tu reçois un code par e-mail.
        </Body>
      </View>

      {!codeEnvoye ? (
        <Card>
          <Text style={styles.label}>Ton adresse e-mail</Text>
          <TextInput
            value={adresse}
            onChangeText={setAdresse}
            placeholder="prenom@exemple.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            accessibilityLabel="Ton adresse e-mail"
            style={styles.input}
          />
          {erreur && <Text style={styles.erreur}>{erreur}</Text>}
          <Button
            label={attente ? 'Envoi…' : 'Recevoir un code'}
            onPress={demanderCode}
            disabled={!adresseValide || attente}
          />
        </Card>
      ) : (
        <Card>
          <Text style={styles.label}>Code reçu à {adresse.trim()}</Text>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
            placeholder="123456"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={10}
            accessibilityLabel="Code reçu par e-mail"
            style={[styles.input, styles.inputCode]}
          />
          {erreur && <Text style={styles.erreur}>{erreur}</Text>}
          <Button label={attente ? 'Vérification…' : 'Valider'} onPress={valider} disabled={code.length < 6 || attente} />
          <Button label="Renvoyer un code" variant="outline" onPress={demanderCode} disabled={attente} />
          <Button
            label="Changer d’adresse"
            variant="outline"
            onPress={() => {
              setCodeEnvoye(false);
              setErreur(null);
            }}
          />
        </Card>
      )}

      <Body muted>
        Tes données sont protégées : seul ton compte peut y accéder. Le code de verrouillage reste propre à chaque
        téléphone.
      </Body>
    </Screen>
  );
}

function Connectee({ email }: { email: string }) {
  const { synchro, synchroniser, deconnecter, supprimerCompte } = useCompte();
  const toast = useToast();
  const [confirmerSuppression, setConfirmerSuppression] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const etat = synchro.enCours
    ? 'Synchronisation en cours…'
    : synchro.erreur
      ? synchro.erreur
      : synchro.derniere
        ? `Synchronisé à ${synchro.derniere.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
        : 'En attente de synchronisation';

  const seDeconnecter = async () => {
    await deconnecter();
    toast('Déconnectée. Tes données restent sur ce téléphone.');
    router.back();
  };

  const supprimer = async () => {
    setErreur(null);
    try {
      await supprimerCompte();
      toast('Ton compte et tes données en ligne ont été supprimés.');
      router.back();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Suppression impossible.');
    }
  };

  return (
    <Screen safeTop={false}>
      <Card>
        <Subtitle>Connectée</Subtitle>
        <Body>{email}</Body>
        <View style={styles.etat}>
          <View style={[styles.pastille, { backgroundColor: synchro.erreur ? colors.lilac : colors.primary }]} />
          <Text style={styles.etatTexte}>{etat}</Text>
        </View>
        <Button label="Synchroniser maintenant" variant="secondary" onPress={synchroniser} disabled={synchro.enCours} />
        <Button label="Me déconnecter" variant="outline" onPress={seDeconnecter} />
      </Card>

      <Card>
        <Subtitle>Supprimer mon compte</Subtitle>
        <Body muted>
          Supprime ton compte et toutes tes données en ligne. Les données de ce téléphone sont conservées.
        </Body>
        {erreur && <Text style={styles.erreur}>{erreur}</Text>}
        {confirmerSuppression ? (
          <>
            <Body>Es-tu sûre ? Cette action est irréversible.</Body>
            <Button label="Oui, supprimer mon compte" onPress={supprimer} />
            <Button label="Annuler" variant="outline" onPress={() => setConfirmerSuppression(false)} />
          </>
        ) : (
          <Button label="Supprimer mon compte" variant="outline" onPress={() => setConfirmerSuppression(true)} />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.plumDeep },
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
  inputCode: { fontFamily: fonts.bodyBold, fontSize: 24, letterSpacing: 6, textAlign: 'center' },
  erreur: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.primary },
  etat: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pastille: { width: 8, height: 8, borderRadius: 4 },
  etatTexte: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
});
