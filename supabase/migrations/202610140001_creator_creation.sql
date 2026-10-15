-- Reviewed against Android's supabase_schema.sql. Apply to a staging clone first.
begin;
create table public.poll_creation_requests (
  creator_id uuid not null references auth.users(id),
  request_id uuid not null,
  poll_id uuid not null references public.polls(id) on delete cascade,
  primary key (creator_id, request_id)
);
alter table public.poll_creation_requests enable row level security;
revoke all on public.poll_creation_requests from anon, authenticated;

create function public.create_poll(
  p_question text, p_options text[], p_allow_suggestions boolean,
  p_require_approval boolean, p_show_results_before_voting boolean,
  p_allow_vote_change boolean, p_deadline_seconds integer,
  p_expected_voters integer, p_request_id uuid
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_poll uuid;
  v_options text[];
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_request_id is null then raise exception 'Request ID required'; end if;
  -- Serialize retries before inserting anything. Hash collisions merely serialize unrelated requests.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text || ':' || p_request_id::text, 0));
  select poll_id into v_poll from public.poll_creation_requests where creator_id = v_user and request_id = p_request_id;
  if v_poll is not null then return v_poll; end if;
  if p_question is null or pg_catalog.btrim(p_question) = '' then raise exception 'Question required'; end if;
  if p_options is null or pg_catalog.cardinality(p_options) > 10 then raise exception 'Two to ten options required'; end if;
  select pg_catalog.array_agg(text order by ordinal) into v_options from (
    select distinct on (pg_catalog.lower(pg_catalog.btrim(text))) pg_catalog.btrim(text) as text, ordinal
    from pg_catalog.unnest(p_options) with ordinality as entries(text, ordinal)
    where text is not null and pg_catalog.btrim(text) <> ''
    order by pg_catalog.lower(pg_catalog.btrim(text)), ordinal
  ) cleaned;
  if coalesce(pg_catalog.cardinality(v_options), 0) < 2 then raise exception 'Two distinct options required'; end if;
  if p_expected_voters is not null and p_expected_voters <= 0 then raise exception 'Expected voters must be positive'; end if;
  if p_deadline_seconds is not null and p_deadline_seconds not in (3600, 86400, 259200, 604800) then raise exception 'Invalid deadline'; end if;
  if p_allow_suggestions is null or p_require_approval is null or p_show_results_before_voting is null or p_allow_vote_change is null then raise exception 'Settings required'; end if;
  insert into public.polls(question, creator_id, allow_suggestions, require_approval, show_results_before_voting, allow_vote_change, closed_at, expected_voters)
  values (pg_catalog.btrim(p_question), v_user, p_allow_suggestions, p_require_approval, p_show_results_before_voting, p_allow_vote_change,
    case when p_deadline_seconds is not null then pg_catalog.clock_timestamp() + pg_catalog.make_interval(secs => p_deadline_seconds) end, p_expected_voters)
  returning id into v_poll;
  insert into public.poll_options(poll_id, text, status, vote_count)
  select v_poll, text, 'APPROVED', 0 from pg_catalog.unnest(v_options) as texts(text);
  insert into public.poll_creation_requests values (v_user, p_request_id, v_poll);
  -- Match Android's creation notification without duplicating it on retries.
  insert into public.notifications(user_id, type, poll_id, poll_question)
  values (v_user, 'POLL_CREATED', v_poll, pg_catalog.btrim(p_question));
  return v_poll;
end;
$$;
revoke all on function public.create_poll(text,text[],boolean,boolean,boolean,boolean,integer,integer,uuid) from public, anon;
grant execute on function public.create_poll(text,text[],boolean,boolean,boolean,boolean,integer,integer,uuid) to authenticated;
commit;
