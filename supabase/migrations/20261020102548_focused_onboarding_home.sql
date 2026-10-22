-- Initial activation is a milestone, independent of current operational health.
alter table public.workspaces add column onboarding_completed_at timestamptz;

create function public.sync_onboarding(target_workspace_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare configured boolean; published boolean; tested boolean; connected boolean; completed timestamptz;
begin
  perform private.require_member(target_workspace_id,auth.uid());
  select onboarding_completed_at into completed from public.workspaces where id=target_workspace_id for update;
  select exists(select 1 from public.agent_settings s join public.workspaces w on w.id=s.workspace_id
    where s.workspace_id=target_workspace_id and (btrim(s.setup_brief)<>'' or s.updated_at>w.created_at)) into configured;
  select exists(select 1 from public.knowledge_items where workspace_id=target_workspace_id and status='published') into published;
  -- Creating an empty test session or a failed turn never counts as a test.
  select exists(select 1 from public.agent_runs r join public.conversations c on c.workspace_id=r.workspace_id and c.id=r.conversation_id
    where r.workspace_id=target_workspace_id and c.channel='test_agent' and r.status='completed'
      and length(btrim(r.customer_content))>0 and length(btrim(r.response->>'reply'))>0) into tested;
  select exists(select 1 from public.channel_connections where workspace_id=target_workspace_id and enabled and
    ((channel='website_chat' and status in ('ready','connected') and cardinality(approved_origins)>0)
     or (channel='instagram' and status='connected' and verified_at is not null))) into connected;
  if completed is null and configured and published and tested and connected then
    update public.workspaces set onboarding_completed_at=now() where id=target_workspace_id returning onboarding_completed_at into completed;
  end if;
  return jsonb_build_object('configured',configured,'published',published,'tested',tested,'connected',connected,'completedAt',completed);
end; $$;

-- Bounded Home data, selected across the workspace rather than one Inbox page.
create function public.home_snapshot(target_workspace_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare attention jsonb; recent jsonb; total bigint;
begin
  perform private.require_member(target_workspace_id,auth.uid());
  with waiting as materialized (
    select c.*,coalesce(least(c.handoff_at,d.failed_at),c.last_customer_at,c.created_at) as waiting_since
    from public.conversations c
    left join lateral (select min(created_at) as failed_at from public.message_deliveries
      where workspace_id=target_workspace_id and conversation_id=c.id and status in ('failed','unknown','blocked')) d on true
    where c.workspace_id=target_workspace_id and c.channel<>'test_agent'
      and (c.ai_mode='paused' or c.handoff_state<>'none' or d.failed_at is not null)
  ), selected as (
    select * from waiting order by waiting_since,id limit 3
  )
  select (select count(*) from waiting),coalesce(jsonb_agg(jsonb_build_object(
    'id',c.id,'name',nullif(btrim(l.name),''),'channel',c.channel,'preview',m.content,
    'at',c.waiting_since,'activity','Conversation handed to your team') order by c.waiting_since,c.id),'[]'::jsonb)
  into total,attention from selected c
  left join public.leads l on l.workspace_id=target_workspace_id and l.conversation_id=c.id
  left join lateral (select left(content,180) as content from public.messages
    where workspace_id=target_workspace_id and conversation_id=c.id and role='customer' order by created_at desc,id desc limit 1) m on true;

  -- One latest meaningful activity per conversation; assistant turns are not an event feed.
  select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'name',r.name,'channel',r.channel,
    'preview',r.preview,'at',r.at,'activity',r.activity) order by r.at desc,r.id),'[]'::jsonb) into recent
  from (
    select c.id,nullif(btrim(l.name),'') as name,c.channel,a.at,a.activity,a.preview
    from public.conversations c
    left join public.leads l on l.workspace_id=target_workspace_id and l.conversation_id=c.id
    join lateral (
      select activity,at,preview from (
        select case when m.role='human' then 'Your team replied' else 'Customer asked' end as activity,
          m.created_at as at,case when m.role='customer' then left(m.content,180) end as preview,0 as priority
          from public.messages m where m.workspace_id=target_workspace_id and m.conversation_id=c.id and m.role in ('customer','human')
        union all select 'Conversation handed to your team',c.handoff_at,null,2 where c.handoff_at is not null
        union all select case when l.qualification='qualified' then 'Qualified inquiry captured' else 'Shared contact details' end,
          l.updated_at,null,1 where l.id is not null and (l.qualification='qualified' or l.email is not null or l.phone is not null)
      ) events order by at desc,priority desc limit 1
    ) a on true
    where c.workspace_id=target_workspace_id and c.channel<>'test_agent'
    order by a.at desc,c.id limit 5
  ) r;
  return jsonb_build_object('attentionCount',total,'attention',attention,'recent',recent);
end; $$;

revoke all on function public.sync_onboarding(uuid),public.home_snapshot(uuid) from public,anon,authenticated,service_role;
grant execute on function public.sync_onboarding(uuid),public.home_snapshot(uuid) to authenticated;
-- Existing table grants/RLS, runtime, provider and handoff functions are unchanged.
