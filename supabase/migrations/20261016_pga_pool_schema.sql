-- PGA pool schema (lives in the `pga` schema of the shared Supabase project).
create schema if not exists pga;

create table pga.tournaments (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  espn_event_id text,
  picks_per_round int[] not null default '{4,4,3,3}',
  cut_after_round int not null default 2,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table pga.rounds (
  tournament_id uuid not null references pga.tournaments(id) on delete cascade,
  round_no int not null check (round_no between 1 and 4),
  lock_at timestamptz,
  primary key (tournament_id, round_no)
);

create table pga.golfers (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references pga.tournaments(id) on delete cascade,
  espn_athlete_id text,
  name text not null,
  country text,
  status text not null default 'active' check (status in ('active','cut','wd','dq')),
  unique (tournament_id, espn_athlete_id)
);
create index golfers_tournament_idx on pga.golfers(tournament_id);

create table pga.golfer_rounds (
  golfer_id uuid not null references pga.golfers(id) on delete cascade,
  round_no int not null check (round_no between 1 and 4),
  to_par int,
  strokes int,
  thru int,
  manual_override boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (golfer_id, round_no)
);

create table pga.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table pga.entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references pga.tournaments(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tournament_id, user_id)
);

create table pga.picks (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  round_no int not null,
  golfer_id uuid not null references pga.golfers(id) on delete cascade,
  created_at timestamptz not null default now(),
  foreign key (tournament_id, round_no) references pga.rounds(tournament_id, round_no) on delete cascade,
  -- each person can use a given golfer only once per tournament
  constraint picks_no_reuse unique (tournament_id, user_id, golfer_id)
);
create index picks_user_idx on pga.picks(tournament_id, user_id, round_no);

create or replace function pga.is_admin() returns boolean
language sql stable security definer set search_path = pga, public as $$
  select coalesce((select is_admin from pga.profiles where user_id = auth.uid()), false);
$$;

create or replace function pga.round_locked(p_tournament uuid, p_round int) returns boolean
language sql stable security definer set search_path = pga, public as $$
  select coalesce((select lock_at is not null and now() >= lock_at
                   from pga.rounds where tournament_id = p_tournament and round_no = p_round), false);
$$;

create or replace function pga.validate_pick() returns trigger
language plpgsql security definer set search_path = pga, public as $$
declare
  v_limit int; v_cut int; v_status text; v_gt uuid; v_count int;
begin
  select picks_per_round[new.round_no], cut_after_round into v_limit, v_cut
    from pga.tournaments where id = new.tournament_id;
  if v_limit is null then raise exception 'Invalid round'; end if;
  select tournament_id, status into v_gt, v_status from pga.golfers where id = new.golfer_id;
  if v_gt is distinct from new.tournament_id then raise exception 'Golfer is not in this tournament'; end if;
  if pga.round_locked(new.tournament_id, new.round_no) then raise exception 'Round % is locked', new.round_no; end if;
  if new.round_no > v_cut and v_status <> 'active' then raise exception 'Golfer is not eligible after the cut'; end if;
  select count(*) into v_count from pga.picks
    where tournament_id = new.tournament_id and user_id = new.user_id and round_no = new.round_no;
  if v_count >= v_limit then raise exception 'Round % allows only % picks', new.round_no, v_limit; end if;
  return new;
end $$;

create trigger picks_validate before insert on pga.picks
  for each row execute function pga.validate_pick();

create or replace function pga.get_leaderboard(p_tournament uuid)
returns table (user_id uuid, display_name text, r1 int, r2 int, r3 int, r4 int, total int, picks_made int)
language sql stable security definer set search_path = pga, public as $$
  select e.user_id, p.display_name,
    sum(gr.to_par) filter (where pk.round_no = 1)::int,
    sum(gr.to_par) filter (where pk.round_no = 2)::int,
    sum(gr.to_par) filter (where pk.round_no = 3)::int,
    sum(gr.to_par) filter (where pk.round_no = 4)::int,
    coalesce(sum(gr.to_par), 0)::int,
    count(pk.id)::int
  from pga.entries e
  join pga.profiles p on p.user_id = e.user_id
  left join pga.picks pk on pk.user_id = e.user_id and pk.tournament_id = e.tournament_id
       and pga.round_locked(pk.tournament_id, pk.round_no)
  left join pga.golfer_rounds gr on gr.golfer_id = pk.golfer_id and gr.round_no = pk.round_no
  where e.tournament_id = p_tournament
  group by e.user_id, p.display_name
  order by coalesce(sum(gr.to_par), 0) asc, p.display_name;
$$;

alter table pga.tournaments enable row level security;
alter table pga.rounds enable row level security;
alter table pga.golfers enable row level security;
alter table pga.golfer_rounds enable row level security;
alter table pga.profiles enable row level security;
alter table pga.entries enable row level security;
alter table pga.picks enable row level security;

create policy tournaments_read on pga.tournaments for select using (true);
create policy rounds_read on pga.rounds for select using (true);
create policy golfers_read on pga.golfers for select using (true);
create policy golfer_rounds_read on pga.golfer_rounds for select using (true);
create policy tournaments_admin on pga.tournaments for all to authenticated using (pga.is_admin()) with check (pga.is_admin());
create policy rounds_admin on pga.rounds for all to authenticated using (pga.is_admin()) with check (pga.is_admin());
create policy golfers_admin on pga.golfers for all to authenticated using (pga.is_admin()) with check (pga.is_admin());
create policy golfer_rounds_admin on pga.golfer_rounds for all to authenticated using (pga.is_admin()) with check (pga.is_admin());
create policy profiles_read on pga.profiles for select to authenticated using (true);
create policy profiles_insert on pga.profiles for insert to authenticated with check (user_id = auth.uid() and is_admin = false);
create policy profiles_update on pga.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy entries_read on pga.entries for select to authenticated using (true);
create policy entries_insert on pga.entries for insert to authenticated with check (user_id = auth.uid());
create policy picks_read on pga.picks for select to authenticated
  using (user_id = auth.uid() or pga.round_locked(tournament_id, round_no));
create policy picks_insert on pga.picks for insert to authenticated
  with check (user_id = auth.uid() and not pga.round_locked(tournament_id, round_no));
create policy picks_delete on pga.picks for delete to authenticated
  using (user_id = auth.uid() and not pga.round_locked(tournament_id, round_no));

grant usage on schema pga to anon, authenticated, service_role;
grant select on pga.tournaments, pga.rounds, pga.golfers, pga.golfer_rounds to anon, authenticated;
grant insert, update, delete on pga.tournaments, pga.rounds, pga.golfers, pga.golfer_rounds to authenticated;
grant select on pga.profiles to authenticated;
grant insert (user_id, display_name) on pga.profiles to authenticated;
grant update (display_name) on pga.profiles to authenticated;
grant select, insert on pga.entries to authenticated;
grant select, insert, delete on pga.picks to authenticated;
grant all on all tables in schema pga to service_role;
grant execute on function pga.get_leaderboard(uuid) to anon, authenticated;
grant execute on function pga.is_admin() to authenticated;
grant execute on function pga.round_locked(uuid, int) to authenticated;

-- Score ingest: called by the app's /api/sync route with a shared secret kept in pga.private_config.
create table pga.private_config (key text primary key, value text not null);
alter table pga.private_config enable row level security;
revoke all on pga.private_config from anon, authenticated;
-- insert into pga.private_config(key, value) values ('ingest_secret', '<random secret; same value as the INGEST_SECRET env var>');

create or replace function pga.apply_scores(p_secret text, p_tournament uuid, p_payload jsonb)
returns int
language plpgsql security definer set search_path = pga, public as $$
declare g jsonb; r jsonb; v_gid uuid; v_n int := 0;
begin
  if p_secret is distinct from (select value from pga.private_config where key = 'ingest_secret') then
    raise exception 'unauthorized';
  end if;
  for g in select * from jsonb_array_elements(p_payload->'golfers') loop
    insert into pga.golfers (tournament_id, espn_athlete_id, name, country, status)
    values (p_tournament, g->>'espn_id', g->>'name', g->>'country', coalesce(g->>'status','active'))
    on conflict (tournament_id, espn_athlete_id) do update
      set name = excluded.name, country = coalesce(excluded.country, pga.golfers.country), status = excluded.status
    returning id into v_gid;
    for r in select * from jsonb_array_elements(coalesce(g->'rounds','[]'::jsonb)) loop
      insert into pga.golfer_rounds (golfer_id, round_no, to_par, strokes, thru, updated_at)
      values (v_gid, (r->>'round_no')::int, (r->>'to_par')::int, (r->>'strokes')::int, (r->>'thru')::int, now())
      on conflict (golfer_id, round_no) do update
        set to_par = excluded.to_par, strokes = excluded.strokes, thru = excluded.thru, updated_at = now()
        where pga.golfer_rounds.manual_override = false;
    end loop;
    v_n := v_n + 1;
  end loop;
  return v_n;
end $$;
revoke all on function pga.apply_scores(text, uuid, jsonb) from public;
grant execute on function pga.apply_scores(text, uuid, jsonb) to anon, authenticated;
