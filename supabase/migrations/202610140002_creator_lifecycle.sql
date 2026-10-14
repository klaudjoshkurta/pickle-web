begin;
-- Shared finalization helper is callable only by the function owner.
create function public.pickle_finalize_poll(p_poll_id uuid, p_closed_at timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
declare v_winner uuid; v_max integer; v_count integer;
begin
  select max(vote_count) into v_max from public.poll_options where poll_id = p_poll_id and status = 'APPROVED';
  if coalesce(v_max, 0) > 0 then
    select count(*) into v_count from public.poll_options where poll_id = p_poll_id and status = 'APPROVED' and vote_count = v_max;
    if v_count = 1 then
      select id into v_winner from public.poll_options where poll_id = p_poll_id and status = 'APPROVED' and vote_count = v_max;
    end if;
  end if;
  update public.polls set status = 'CLOSED', closed_at = p_closed_at, winner_option_id = v_winner where id = p_poll_id;
end;
$$;
revoke all on function public.pickle_finalize_poll(uuid,timestamptz) from public, anon, authenticated;

create function public.expire_poll(p_poll_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_poll public.polls%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into v_poll from public.polls where id = p_poll_id for update;
  if v_poll.status = 'OPEN' and v_poll.closed_at <= pg_catalog.clock_timestamp() then
    perform public.pickle_finalize_poll(p_poll_id, v_poll.closed_at);
  end if;
end;
$$;

create or replace function public.close_poll(p_poll_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_poll public.polls%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into v_poll from public.polls where id = p_poll_id for update;
  if v_poll.id is null or v_poll.creator_id <> auth.uid() or v_poll.status <> 'OPEN' then
    raise exception 'Not authorized or poll not open' using errcode = '42501';
  end if;
  perform public.pickle_finalize_poll(p_poll_id, case when v_poll.closed_at <= pg_catalog.clock_timestamp() then v_poll.closed_at else pg_catalog.clock_timestamp() end);
end;
$$;

create or replace function public.cast_vote(p_poll_id uuid, p_option_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_poll public.polls%rowtype; v_old uuid; v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into v_poll from public.polls where id = p_poll_id for update;
  if v_poll.id is null or v_poll.status <> 'OPEN' or v_poll.closed_at <= pg_catalog.clock_timestamp() then
    -- Do not finalize then raise: raising would roll back finalization. Readers call expire_poll.
    raise exception 'Poll is not open';
  end if;
  if not exists (select 1 from public.poll_options where id = p_option_id and poll_id = p_poll_id and status = 'APPROVED') then
    raise exception 'Option not found or not approved';
  end if;
  select option_id into v_old from public.votes where poll_id = p_poll_id and voter_id = v_user;
  if v_old is not null then
    if not v_poll.allow_vote_change then raise exception 'Vote change not allowed'; end if;
    if v_old = p_option_id then return; end if;
    update public.poll_options set vote_count = greatest(vote_count - 1, 0) where id = v_old;
    update public.votes set option_id = p_option_id, created_at = pg_catalog.clock_timestamp() where poll_id = p_poll_id and voter_id = v_user;
  else
    insert into public.votes(poll_id, voter_id, option_id) values(p_poll_id, v_user, p_option_id);
  end if;
  update public.poll_options set vote_count = vote_count + 1 where id = p_option_id;
end;
$$;
-- Both apps use cast_vote. Direct writes bypass its deadline/option/count checks.
revoke insert, update, delete on public.votes from authenticated, anon;

create function public.moderate_option(p_poll_id uuid, p_option_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_poll public.polls%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into v_poll from public.polls where id = p_poll_id for update;
  if v_poll.id is null or v_poll.creator_id <> auth.uid() then raise exception 'Not authorized' using errcode = '42501'; end if;
  if v_poll.status <> 'OPEN' or v_poll.closed_at <= pg_catalog.clock_timestamp() then raise exception 'Poll is not open'; end if;
  if p_approve is null then raise exception 'Decision required'; end if;
  update public.poll_options set status = case when p_approve then 'APPROVED' else 'REJECTED' end
  where id = p_option_id and poll_id = p_poll_id and status = 'PENDING';
  if not found then raise exception 'Suggestion unavailable'; end if;
end;
$$;

-- Replace the supplied permissive insertion policy; creator Android inserts remain valid.
drop policy if exists "poll_options_insert" on public.poll_options;
create policy "poll_options_insert" on public.poll_options for insert to authenticated with check (
  vote_count = 0 and pg_catalog.btrim(text) <> '' and exists (
    select 1 from public.polls p where p.id = poll_id and p.status = 'OPEN'
    and (p.closed_at is null or p.closed_at > pg_catalog.clock_timestamp())
    and ((p.creator_id = auth.uid() and status = 'APPROVED' and (suggested_by is null or suggested_by = auth.uid()))
      or (p.allow_suggestions and suggested_by = auth.uid() and status = case when p.require_approval then 'PENDING' else 'APPROVED' end))
  )
);
-- Explicit check prevents moving an option to another creator's poll.
drop policy if exists "poll_options_update" on public.poll_options;
create policy "poll_options_update" on public.poll_options for update to authenticated
using (exists (select 1 from public.polls p where p.id = poll_id and p.creator_id = auth.uid()))
with check (exists (select 1 from public.polls p where p.id = poll_id and p.creator_id = auth.uid()));
drop policy if exists "polls_update" on public.polls;
create policy "polls_update" on public.polls for update to authenticated using (creator_id = auth.uid()) with check (creator_id = auth.uid());

-- Serialize direct Android suggestions/moderation with RPC voting and closing.
-- Count-only writes inside cast_vote do not need another parent lock.
create function public.pickle_guard_option() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_poll public.polls%rowtype;
begin
  if TG_OP = 'UPDATE' then
    if new.poll_id <> old.poll_id then raise exception 'Cannot move options between polls'; end if;
    if new.status = old.status and new.text = old.text and new.suggested_by is not distinct from old.suggested_by then return new; end if;
  end if;
  select * into v_poll from public.polls where id = new.poll_id for update;
  if v_poll.status <> 'OPEN' or v_poll.closed_at <= pg_catalog.clock_timestamp() then raise exception 'Poll is not open'; end if;
  if TG_OP = 'UPDATE' and v_poll.creator_id is distinct from auth.uid() then raise exception 'Not authorized' using errcode = '42501'; end if;
  return new;
end;
$$;
revoke all on function public.pickle_guard_option() from public, anon, authenticated;
create trigger pickle_guard_option before insert or update on public.poll_options for each row execute function public.pickle_guard_option();

revoke all on function public.expire_poll(uuid), public.close_poll(uuid), public.cast_vote(uuid,uuid), public.moderate_option(uuid,uuid,boolean) from public, anon;
grant execute on function public.expire_poll(uuid), public.close_poll(uuid), public.cast_vote(uuid,uuid), public.moderate_option(uuid,uuid,boolean) to authenticated;
commit;
