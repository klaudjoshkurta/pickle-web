-- ONLY run against an isolated Supabase database after both migrations.
-- psql -X -v ON_ERROR_STOP=1 -f supabase/tests/creator_flow.sql
-- All fixtures, injected faults, and mutations are rolled back.
begin;
insert into auth.users(id) values
 ('10000000-0000-4000-8000-000000000001'),
 ('10000000-0000-4000-8000-000000000002');
create temporary table creator_test_ids(label text primary key, id uuid);
grant select, insert on creator_test_ids to authenticated;
create function public.pickle_test_insert_failure() returns trigger language plpgsql as $$
begin
  if new.text = 'TEST_FORCE_FAILURE' then raise exception 'Injected option failure'; end if;
  return new;
end;
$$;
create trigger pickle_test_insert_failure before insert on public.poll_options for each row execute function public.pickle_test_insert_failure();

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
do $$
declare p uuid; retry uuid; n integer; failed boolean := false;
begin
  p := public.create_poll(' Dinner? ', array[' Pizza ', 'pizza', '', 'Soup'], true, true, false, true, null, 10, '20000000-0000-4000-8000-000000000001');
  retry := public.create_poll('Ignored retry payload', array['A','B'], false, false, true, false, null, null, '20000000-0000-4000-8000-000000000001');
  assert p = retry, 'Creation retry duplicated a poll';
  assert (select creator_id = auth.uid() and question = 'Dinner?' from public.polls where id = p), 'Ownership/normalization failed';
  assert (select count(*) = 2 from public.poll_options where poll_id = p), 'Option deduplication failed';
  assert (select count(*) = 1 from public.notifications where poll_id = p and type = 'POLL_CREATED' and user_id = auth.uid()), 'Creation notification missing or duplicated';
  insert into creator_test_ids values ('poll', p);
  insert into creator_test_ids select 'pizza', id from public.poll_options where poll_id = p and text = 'Pizza';
  insert into creator_test_ids select 'soup', id from public.poll_options where poll_id = p and text = 'Soup';
  select count(*) into n from public.polls;
  begin
    perform public.create_poll('Atomic failure', array['A','TEST_FORCE_FAILURE'], false, true, false, true, null, null, '20000000-0000-4000-8000-000000000002');
  exception when others then
    if sqlerrm <> 'Injected option failure' then raise; end if;
    failed := true;
  end;
  assert failed, 'Fault injection did not fail';
  assert (select count(*) = n from public.polls), 'Creation left an orphan poll';
  failed := false;
  begin
    insert into public.polls(question, creator_id) values ('Forged', '10000000-0000-4000-8000-000000000002');
  exception when insufficient_privilege then failed := true;
  end;
  assert failed, 'Forged ownership was accepted';
end;
$$;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
do $$
declare p uuid := (select id from creator_test_ids where label = 'poll'); s uuid; failed boolean := false;
begin
  -- The public vote and Android contracts are unchanged.
  perform public.cast_vote(p, (select id from creator_test_ids where label = 'pizza'));
  perform public.cast_vote(p, (select id from creator_test_ids where label = 'soup'));
  assert (select vote_count = 0 from public.poll_options where id = (select id from creator_test_ids where label = 'pizza')), 'Old count was not decremented';
  assert (select vote_count = 1 from public.poll_options where id = (select id from creator_test_ids where label = 'soup')), 'New count was not incremented';
  insert into public.poll_options(poll_id, text, suggested_by, status) values (p, 'Salad', auth.uid(), 'PENDING') returning id into s;
  insert into creator_test_ids values ('suggestion', s);
  begin perform public.moderate_option(p, s, true); exception when insufficient_privilege then failed := true; end;
  assert failed, 'Non-owner moderation succeeded';
  failed := false;
  begin perform public.close_poll(p); exception when insufficient_privilege then failed := true; end;
  assert failed, 'Non-owner closing succeeded';
  update public.polls set question = 'Tampered' where id = p;
  assert not found, 'Non-owner poll update succeeded';
  update public.poll_options set status = 'APPROVED' where id = s;
  assert not found, 'Non-owner option update succeeded';
  failed := false;
  begin insert into public.poll_options(poll_id, text, suggested_by, status) values (p, 'Approval bypass', auth.uid(), 'APPROVED'); exception when insufficient_privilege then failed := true; end;
  assert failed, 'Suggestion approval was bypassed';
  failed := false;
  begin insert into public.votes(poll_id, voter_id, option_id) values(p, auth.uid(), (select id from creator_test_ids where label = 'pizza')); exception when insufficient_privilege then failed := true; end;
  assert failed, 'Direct votes bypassed RPC enforcement';
end;
$$;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
do $$
declare p uuid := (select id from creator_test_ids where label = 'poll'); s uuid; q uuid; cutoff timestamptz; failed boolean := false;
begin
  perform public.moderate_option(p, (select id from creator_test_ids where label = 'suggestion'), true);
  assert (select status = 'APPROVED' from public.poll_options where id = (select id from creator_test_ids where label = 'suggestion')), 'Approval failed';
  insert into public.poll_options(poll_id, text, suggested_by, status) values (p, 'Reject me', auth.uid(), 'PENDING') returning id into s;
  perform public.moderate_option(p, s, false);
  assert (select status = 'REJECTED' from public.poll_options where id = s), 'Rejection failed';
  perform public.cast_vote(p, (select id from creator_test_ids where label = 'soup'));
  perform public.close_poll(p);
  assert (select status = 'CLOSED' and winner_option_id = (select id from creator_test_ids where label = 'soup') from public.polls where id = p), 'Winner finalization failed';
  begin perform public.cast_vote(p, (select id from creator_test_ids where label = 'pizza')); exception when others then
    if sqlerrm <> 'Poll is not open' then raise; end if;
    failed := true;
  end;
  assert failed, 'Closed poll accepted a vote';

  q := public.create_poll('No votes', array['A','B'], false, true, false, true, null, null, gen_random_uuid());
  perform public.close_poll(q);
  assert (select status = 'CLOSED' and winner_option_id is null from public.polls where id = q), 'No-vote outcome failed';

  q := public.create_poll('Tie', array['A','B'], false, true, false, true, null, null, gen_random_uuid());
  perform public.cast_vote(q, (select id from public.poll_options where poll_id = q and text = 'A'));
  perform set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
  perform public.cast_vote(q, (select id from public.poll_options where poll_id = q and text = 'B'));
  perform set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
  perform public.close_poll(q);
  assert (select status = 'CLOSED' and winner_option_id is null from public.polls where id = q), 'Tie incorrectly declared a winner';

  q := public.create_poll('Scheduled', array['A','B'], false, true, false, true, 3600, null, gen_random_uuid());
  perform public.expire_poll(q);
  assert (select status = 'OPEN' and closed_at > clock_timestamp() from public.polls where id = q), 'Future deadline treated as closure';
  cutoff := clock_timestamp() - interval '1 second';
  update public.polls set closed_at = cutoff where id = q;
  failed := false;
  begin perform public.cast_vote(q, (select id from public.poll_options where poll_id = q and text = 'A')); exception when others then
    if sqlerrm <> 'Poll is not open' then raise; end if;
    failed := true;
  end;
  assert failed, 'Expired poll accepted a vote';
  perform public.expire_poll(q);
  assert (select status = 'CLOSED' and closed_at = cutoff and winner_option_id is null from public.polls where id = q), 'Expiry cutoff/outcome failed';

  q := public.create_poll('Locked vote', array['A','B'], false, true, false, false, null, null, gen_random_uuid());
  perform public.cast_vote(q, (select id from public.poll_options where poll_id = q and text = 'A'));
  failed := false;
  begin perform public.cast_vote(q, (select id from public.poll_options where poll_id = q and text = 'B')); exception when others then
    if sqlerrm <> 'Vote change not allowed' then raise; end if;
    failed := true;
  end;
  assert failed, 'Locked vote changed';

  -- Android's existing direct creator insert and APPROVED-option insert still work.
  insert into public.polls(question, creator_id, closed_at) values ('Android shape', auth.uid(), clock_timestamp() + interval '1 day') returning id into q;
  insert into public.poll_options(poll_id, text) values (q, 'Android option');
  assert (select status = 'APPROVED' from public.poll_options where poll_id = q), 'Android option default changed';
end;
$$;
rollback;
