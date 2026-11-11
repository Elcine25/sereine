-- v1.1 : comptes (facultatifs) pour retrouver ses données sur un autre appareil,
-- et nouveautés / éditions spéciales dans les articles.

-- Notes de l'utilisatrice : humeurs, gratitude, exercices « Démêler une pensée ».
-- Une ligne par note. La synchronisation garde la version la plus récente (maj).
-- Une note supprimée devient supprime = true, sans contenu.
create table public.entrees (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  collection text not null check (collection in ('moods', 'gratitudes', 'pensees')),
  contenu jsonb not null default '{}',
  supprime boolean not null default false,
  maj timestamptz not null,
  primary key (user_id, id)
);

-- Prénom, favoris et avis sur les articles.
create table public.profils (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  prenom text not null default '',
  favoris jsonb not null default '[]',
  avis jsonb not null default '{}',
  maj timestamptz not null
);

-- Chaque compte ne voit et ne modifie que ses propres lignes.
do $$
declare t text;
begin
  foreach t in array array['entrees', 'profils'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy "Ses propres données" on public.%I for all to authenticated
                    using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;

-- Supprime le compte de l'utilisatrice connectée et, en cascade, toutes ses données.
create function public.supprimer_mon_compte() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Non connectée';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.supprimer_mon_compte() from public, anon;
grant execute on function public.supprimer_mon_compte() to authenticated;

-- Articles : date de publication (badge « Nouveau » pendant 14 jours, et
-- notification de nouveauté) et édition spéciale (mise à la une dans Ressources).
alter table public.fiches add column publie_le timestamptz not null default now();
alter table public.fiches add column edition text; -- ex. « Édition spéciale · Octobre rose »
update public.fiches set publie_le = '2026-10-01';
