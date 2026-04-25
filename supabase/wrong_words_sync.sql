create table if not exists public.study_wrong_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  word_key text not null,
  meaning text,
  example text,
  category text,
  wrong_count integer not null default 1,
  added_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, word_key)
);

alter table public.study_wrong_words enable row level security;

drop policy if exists "Users can read own wrong words" on public.study_wrong_words;
create policy "Users can read own wrong words"
on public.study_wrong_words
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own wrong words" on public.study_wrong_words;
create policy "Users can insert own wrong words"
on public.study_wrong_words
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own wrong words" on public.study_wrong_words;
create policy "Users can update own wrong words"
on public.study_wrong_words
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own wrong words" on public.study_wrong_words;
create policy "Users can delete own wrong words"
on public.study_wrong_words
for delete
to authenticated
using ((select auth.uid()) = user_id);
