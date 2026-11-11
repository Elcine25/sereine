# Sereine 🌿

Sereine est une application mobile de soutien émotionnel pour les femmes (18 ans et plus). Elle aide à se poser, à suivre son humeur et à trouver de l'aide en cas de détresse, de façon simple et privée.

**Pourquoi Sereine.** La santé mentale est un défi de santé publique, marqué par la stigmatisation, le manque de ressources et un accès limité aux soins adaptés. Sereine offre un premier espace d'écoute et d'outils simples, disponible à tout moment sur le téléphone.
Version 1.1, prototype : Expo (React Native + TypeScript) avec Expo Router.

## Lancer l'application

Prérequis : **Node.js 22.13 ou plus récent** (Expo SDK 58 ne fonctionne pas avec Node 20).

```bash
npm install
npx expo start
```

Scanne ensuite le QR code avec l'application **Expo Go** (Android ou iOS).

## Fonctionnalités

| Écran | Contenu |
|---|---|
| Ouverture | Animation à chaque lancement : la fleur Sereine s'ouvre sur des cercles pointillés (un toucher la passe) |
| Bienvenue | Trois pages qui glissent : présentation et pourquoi « Sereine », prénom (facultatif), avertissement médical et confirmation 18 ans et plus (obligatoires) |
| Code | Création d'un code PIN à 4 chiffres, puis empreinte ou Face ID en option (« Plus tard » possible) |
| Verrou | Demande le code (ou l'empreinte) à l'ouverture et après 1 minute en arrière-plan |
| Accueil | « Bonjour [prénom] », humeur du jour en un geste, raccourcis (respirer, démêler une pensée), pensée du jour, accès SOS |
| Journal | Trois onglets. **Humeur** : note de 1 à 5, étiquettes, note libre, graphique sur 14 jours, historique ; si l'humeur est basse, propose la respiration et les numéros SOS. **Gratitude** : trois choses positives, avec une idée par jour. **Pensées** : historique des exercices « Démêler une pensée » |
| Démêler une pensée | Exercice guidé de restructuration cognitive en 7 étapes : situation, pensée, émotion et intensité, pièges de pensée, faits pour et contre, pensée alternative, nouvelle intensité |
| Sena | Compagne d'écoute à parcours scriptés (stress, tristesse, anxiété, colère, ancrage 5-4-3-2-1). Tout message évoquant le suicide ou l'automutilation mène aux numéros d'urgence. La conversation n'est pas enregistrée |
| Respirer | Page ouverte depuis l'accueil, Sena ou les articles : cohérence cardiaque, respiration carrée, 4-7-8 (2 ou 5 minutes), minuteur, compteur de cycles, pause |
| Ressources | « Vrai ou faux ? » quotidien, filtres par thème et « Mes favoris », badge « Nouveau » (14 jours), éditions spéciales à la une. Articles avec favori, partage et « Cet article t'a aidée ? » : anxiété, dépression, stress au travail, sommeil, charge mentale, cycle et hormones |
| SOS | Numéros du Bénin : gros bouton d'appel du SAMU, police, pompiers, Institut national de la femme. Exercice d'ancrage 5-4-3-2-1 |
| Paramètres | Compte, rappel quotidien (heure au choix), prénom, verrouillage (changer ou désactiver le code, empreinte), confidentialité, effacement des données (avec confirmation) |
| Compte (facultatif) | Connexion par code reçu par e-mail, synchronisation du journal, de la gratitude, des exercices, des favoris et du prénom entre appareils, déconnexion, suppression du compte |
| Rappel quotidien | Notification à l'heure choisie : invitation à noter son humeur, message apaisant si les derniers jours ont été difficiles, annonce d'un nouvel article. Textes neutres, rien de personnel sur l'écran verrouillé |

Les données de l'utilisatrice sont enregistrées **sur le téléphone** (AsyncStorage). Sans compte, rien n'est envoyé. Avec un compte, une copie est gardée dans Supabase, accessible uniquement par ce compte (row level security). Le code PIN reste propre à chaque téléphone, dans son trousseau sécurisé (`expo-secure-store`).

Les transitions sont douces : glissement entre les pages, fondu entre les onglets, apparition progressive du contenu, boutons qui s'enfoncent au toucher, messages de confirmation. Tout est coupé si le téléphone demande de réduire les animations.

## Gérer les contenus (Supabase)

Les articles, pensées du jour, « Vrai ou faux ? », numéros SOS et parcours de Sena se modifient depuis le dashboard Supabase (**Table Editor**), sans republier l'app.

**Mise en place (une fois) :**

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécute dans cet ordre : `supabase/migrations/20261104000000_contenus.sql`, `supabase/seed.sql` (contenus de départ), puis `supabase/migrations/20261105000000_comptes.sql` (comptes, nouveautés).
3. Pour les comptes : dans **Authentication > Emails > Templates**, modifie le modèle **Magic Link** pour qu'il contienne le code : `{{ .Token }}` (l'app demande un code, pas un lien). Sans service d'e-mail configuré (SMTP), Supabase n'envoie que quelques e-mails par heure : suffisant pour tester, pas pour publier.
4. Copie `.env.example` en `.env.local` et renseigne l'URL du projet et la clé *publishable*, puis relance `npx expo start`. Pour les builds EAS, ajoute ces deux variables dans les variables d'environnement du projet EAS.

**Fonctionnement :**

| Table | Contenu |
|---|---|
| `fiches` | Articles. `sections` est une liste JSON `[{ "titre", "paragraphes": [...] }]`. `vignette` : inutilisée pour le moment, tous les articles partagent l'image `assets/images/article.jpg`. `publie_le` : badge « Nouveau » pendant 14 jours et notification de nouveauté. `edition` (ex. « Édition spéciale · Octobre rose ») : article mis à la une dans Ressources |
| `pensees` | Pensée du jour (accueil) |
| `idees_recues` | « Vrai ou faux ? » (toutes les affirmations sont fausses) |
| `contacts_sos` | Numéros par pays (`BJ` pour l'instant). Un seul `principal` : le gros bouton d'appel |
| `sena_etapes` | Étapes de Sena (le schéma des actions est décrit dans la migration) |
| `entrees`, `profils` | Données des comptes (ne pas modifier à la main) |

- `publie = false` masque une ligne sans la supprimer, `ordre` règle l'ordre d'affichage.
- L'app lit les contenus au démarrage, les garde en cache pour le hors-connexion, et part de la version intégrée (`src/data/`) au tout premier lancement.
- Chaque contenu est vérifié avant d'être affiché. S'il est vide ou incohérent (par exemple un choix de Sena qui mène à une étape inexistante, ou une étape `danger` sans appel ni lien SOS), l'app garde la version précédente. Après une modification, rouvre l'app pour vérifier qu'elle apparaît bien.
- La détection des mots liés au suicide dans Sena reste dans le code (`src/data/sena.ts`), par sécurité.
- La clé *publishable* ne permet que de lire les lignes publiées (row level security). Seules les personnes qui ont accès au dashboard peuvent modifier les contenus.

L'identité visuelle (palette prune sur fond blanc, polices Fraunces et Nunito, cercles pointillés) est définie dans `src/lib/theme.ts`.

Face ID ne fonctionne pas dans Expo Go sur iPhone : il faut un build de développement pour le tester. Le code PIN fonctionne partout.

## Structure

```
src/
  app/              routes (Expo Router)
    (tabs)/         les 5 onglets : Accueil, Journal, Sena, Ressources, SOS
    bienvenue.tsx   accueil au premier lancement (3 pages)
    creer-code.tsx  création ou changement du code PIN
    respirer.tsx    exercices de respiration
    exercice-pensee.tsx  « Démêler une pensée »
    compte.tsx      connexion et synchronisation
    fiche/[id].tsx  détail d'une fiche
    parametres.tsx
  components/       composants partagés (ui, animations, toast, onglets, journal, icônes, Fleur, Motif, Intro, verrou)
  data/             contenus intégrés : fiches, idées reçues, parcours de Sena, numéros SOS, exercices
  lib/              thème, stockage local, contenus, compte et synchronisation, rappels, onboarding, verrou
```

Les contenus se gèrent dans Supabase (voir plus haut). `src/data/` contient la version intégrée, utilisée en secours : mets-la à jour de temps en temps pour qu'elle reste proche de la version publiée.

## Avant toute publication

- [ ] Faire relire les fiches, les parcours de Sena (`src/data/sena.ts`) et les exercices (`src/data/exercices.ts`) par une psychologue ou une psychiatre.
- [ ] Vérifier chaque numéro SOS et ajouter les pays ciblés.
- [ ] Rédiger une politique de confidentialité et des CGU (données de santé, RGPD ou loi locale), surtout depuis l'ajout des comptes.
- [ ] Configurer un service d'e-mail (SMTP) dans Supabase pour l'envoi des codes de connexion.
- [ ] Remplacer l'icône et l'écran de démarrage (`assets/`).

## Feuille de route

**v1.1** (faite)
- Rappel quotidien et messages adaptés (`expo-notifications`), journal de gratitude, restructuration cognitive
- Comptes et synchronisation entre appareils, nouveautés et éditions spéciales, animations

**v1.2**
- Statistiques : liens entre étiquettes et humeur, suivi du cycle
- Méditations audio (`expo-audio`)
- Mode sombre

**v2**
- Chiffrement de bout en bout des données du compte
- Programmes sur plusieurs semaines (anxiété, burn-out)
- Annuaire de professionnelles, téléconsultation
- Communauté modérée
- Publication sur les stores avec EAS Build (`npx eas-cli@latest build`)
