-- Contenus éditoriaux de Sereine, modifiables depuis le dashboard Supabase
-- (Table Editor). L'app les lit avec la clé publishable : lecture seule, et
-- uniquement les lignes publiées. Aucune donnée d'utilisatrice ici.
--
-- Pour masquer une ligne sans la supprimer : publie = false.
-- L'ordre d'affichage suit la colonne ordre (croissant).

-- Articles de l'onglet Ressources.
create table public.fiches (
  id text primary key, -- utilisé dans les liens (/fiche/<id>) et par les parcours de Sena
  theme text not null, -- sert de filtre dans Ressources
  vignette integer not null default 0, -- illustration : index dans VIGNETTES (src/components/Vignette.tsx)
  titre text not null,
  resume text not null, -- affiché comme titre de l'article
  intro text not null,
  -- [{ "titre": "...", "paragraphes": ["...", "..."] }, ...]
  sections jsonb not null default '[]' check (jsonb_typeof(sections) = 'array'),
  ordre integer not null default 0,
  publie boolean not null default true,
  mis_a_jour timestamptz not null default now()
);

-- Pensée du jour (accueil). Une par jour, à tour de rôle.
create table public.pensees (
  id bigint generated always as identity primary key,
  texte text not null,
  ordre integer not null default 0,
  publie boolean not null default true,
  mis_a_jour timestamptz not null default now()
);

-- Carte « Vrai ou faux ? » (Ressources). Toutes les affirmations sont fausses.
create table public.idees_recues (
  id bigint generated always as identity primary key,
  affirmation text not null,
  explication text not null,
  ordre integer not null default 0,
  publie boolean not null default true,
  mis_a_jour timestamptz not null default now()
);

-- Numéros de l'onglet SOS. Le numéro « principal » est le gros bouton d'appel.
create table public.contacts_sos (
  id bigint generated always as identity primary key,
  pays text not null default 'BJ', -- code ISO à 2 lettres
  nom text not null,
  numero text not null,
  description text not null default '',
  principal boolean not null default false,
  ordre integer not null default 0,
  publie boolean not null default true,
  mis_a_jour timestamptz not null default now()
);

-- Un seul numéro principal publié par pays.
create unique index contacts_sos_un_principal on public.contacts_sos (pays) where principal and publie;

-- Étapes des parcours de Sena.
-- messages : ["...", "..."]
-- choix : [{ "label": "...", "action": { "type": "etape", "vers": "<id d'étape>" } }, ...]
--   autres actions : {"type":"respirer"}, {"type":"journal"}, {"type":"sos"},
--   {"type":"fiche","id":"<id de fiche>"}, {"type":"appel","numero":"112"}
-- Les étapes debut, danger, texteLibre et fin sont obligatoires. Si le parcours
-- publié est incohérent, l'app garde la version intégrée (src/lib/contenu.tsx).
create table public.sena_etapes (
  id text primary key,
  messages jsonb not null check (jsonb_typeof(messages) = 'array'),
  choix jsonb not null check (jsonb_typeof(choix) = 'array'),
  publie boolean not null default true,
  mis_a_jour timestamptz not null default now()
);

-- Date de modification tenue à jour automatiquement.
create function public.toucher_mis_a_jour() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.mis_a_jour := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['fiches', 'pensees', 'idees_recues', 'contacts_sos', 'sena_etapes'] loop
    execute format('create trigger toucher_mis_a_jour before update on public.%I
                    for each row execute function public.toucher_mis_a_jour()', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('create policy "Lecture des contenus publiés" on public.%I
                    for select to anon, authenticated using (publie)', t);
  end loop;
end;
$$;
