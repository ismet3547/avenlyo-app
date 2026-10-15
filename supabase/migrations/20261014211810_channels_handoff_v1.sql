-- Additive upgrade from Foundation V1. Its migration and existing rows are preserved.
create extension if not exists supabase_vault with schema vault;
revoke all on schema vault from public,anon,authenticated,service_role;
revoke all on all tables in schema vault from public,anon,authenticated,service_role;
-- Supabase owns the Vault C crypto internals; restrict its supported application interfaces.
-- Use the extension's own name-only form: its supported wrappers include optional key arguments.
revoke all on function vault.create_secret,vault.update_secret from public,anon,authenticated,service_role;

create table public.channel_connections (
  id uuid primary key default gen_random_uuid(),
  public_id uuid not null unique default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel text not null check(channel in ('website_chat','instagram')),
  enabled boolean not null default false,
  status text not null default 'ready' check(status in ('ready','connected','needs_attention','disconnected')),
  approved_origins text[] not null default '{}' check(cardinality(approved_origins)<=10),
  provider_account_id text check(provider_account_id ~ '^[0-9]{3,32}$'),
  provider_username text check(length(provider_username)<=100),
  provider_app_id text check(provider_app_id ~ '^[0-9]{3,32}$'),
  api_version text check(api_version='v26.0'), verified_at timestamptz,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(workspace_id,channel), unique(workspace_id,id), unique(workspace_id,id,channel),
  check(channel<>'website_chat' or (provider_account_id is null and api_version is null and (not enabled or cardinality(approved_origins)>0))),
  check(channel<>'instagram' or (cardinality(approved_origins)=0 and (not enabled or (status='connected' and provider_account_id is not null and provider_app_id is not null and api_version is not null and verified_at is not null))))
);
create unique index instagram_account_one_workspace_idx on public.channel_connections(provider_account_id) where channel='instagram' and provider_account_id is not null;
create table private.channel_credentials (
  connection_id uuid primary key references public.channel_connections(id) on delete cascade,
  secret_id uuid not null references vault.secrets(id)
);
alter table private.channel_credentials enable row level security;
revoke all on private.channel_credentials from public,anon,authenticated,service_role;

alter table public.conversations drop constraint conversations_channel_check;
alter table public.conversations add constraint conversations_channel_check check(channel in ('test_agent','website_chat','instagram'));
alter table public.conversations alter column created_by drop not null;
alter table public.conversations add column channel_connection_id uuid;
alter table public.conversations add column external_customer_ref text check(length(external_customer_ref)<=100);
alter table public.conversations add column assignee_id uuid;
alter table public.conversations add column handoff_state text not null default 'none' check(handoff_state in ('none','requested','claimed'));
alter table public.conversations add column handoff_at timestamptz;
alter table public.conversations add column claimed_at timestamptz;
alter table public.conversations add column last_customer_at timestamptz;
alter table public.conversations add column state_version integer not null default 0;
update public.conversations set handoff_state='requested',handoff_at=updated_at where ai_mode='paused';
update public.conversations c set last_customer_at=(select max(created_at) from public.messages m where m.conversation_id=c.id and m.role='customer');
alter table public.conversations add constraint conversation_channel_authority check(
  (channel='test_agent' and created_by is not null and channel_connection_id is null and external_customer_ref is null)
  or (channel<>'test_agent' and created_by is null and channel_connection_id is not null and external_customer_ref is not null));
alter table public.conversations add constraint conversation_connection_scope foreign key(workspace_id,channel_connection_id,channel) references public.channel_connections(workspace_id,id,channel);
alter table public.conversations add constraint conversation_assignee_scope foreign key(workspace_id,assignee_id) references public.workspace_members(workspace_id,user_id) on delete set null (assignee_id);
alter table public.conversations add constraint conversation_connection_unique unique(workspace_id,id,channel_connection_id);
create unique index conversation_external_customer_idx on public.conversations(channel_connection_id,external_customer_ref) where channel_connection_id is not null;
create index conversation_assignee_idx on public.conversations(workspace_id,assignee_id) where assignee_id is not null;

alter table public.messages drop constraint messages_role_check;
alter table public.messages add constraint messages_role_check check(role in ('customer','assistant','human'));
alter table public.messages add column human_actor_id uuid references auth.users(id);
alter table public.messages add column client_message_id uuid;
alter table public.messages add constraint human_message_authority check((role='human' and human_actor_id is not null and client_message_id is not null) or (role<>'human' and human_actor_id is null and client_message_id is null));
alter table public.messages add constraint message_delivery_scope unique(workspace_id,id,conversation_id);
create unique index human_reply_idempotency_idx on public.messages(conversation_id,human_actor_id,client_message_id) where role='human';
create index human_message_actor_idx on public.messages(human_actor_id) where human_actor_id is not null;
alter table public.leads drop constraint leads_source_check;
alter table public.leads add constraint leads_source_check check(source in ('test_agent','website_chat','instagram'));

create table public.website_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  connection_id uuid not null,
  conversation_id uuid not null,
  origin text not null,
  token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null default now()+interval '7 days',
  created_at timestamptz not null default now(),
  unique(workspace_id,id,conversation_id),
  foreign key(workspace_id,connection_id) references public.channel_connections(workspace_id,id) on delete cascade,
  foreign key(workspace_id,conversation_id,connection_id) references public.conversations(workspace_id,id,channel_connection_id) on delete cascade
);
create index website_session_conversation_idx on public.website_sessions(workspace_id,conversation_id,connection_id);
create index website_session_connection_idx on public.website_sessions(workspace_id,connection_id);
create table public.channel_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null, connection_id uuid not null,
  provider_message_id text not null check(length(provider_message_id) between 1 and 200),
  sender_id text not null check(sender_id ~ '^[0-9]{3,32}$'),
  content text not null check(length(btrim(content)) between 1 and 2000),
  payload_hash text not null check(payload_hash ~ '^[a-f0-9]{64}$'),
  provider_timestamp timestamptz not null,
  status text not null default 'pending' check(status in ('pending','processing','completed','failed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(connection_id,provider_message_id), unique(workspace_id,id),
  foreign key(workspace_id,connection_id) references public.channel_connections(workspace_id,id) on delete cascade
);
create index channel_events_connection_idx on public.channel_events(workspace_id,connection_id);
create index channel_events_pending_idx on public.channel_events(created_at,id) where status='pending';

alter table public.agent_runs alter column actor_id drop not null;
alter table public.agent_runs add column website_session_id uuid;
alter table public.agent_runs add column channel_event_id uuid;
alter table public.agent_runs add column state_version integer;
alter table public.agent_runs add constraint agent_run_one_authority check(num_nonnulls(actor_id,website_session_id,channel_event_id)=1);
alter table public.agent_runs add constraint run_website_authority_scope foreign key(workspace_id,website_session_id,conversation_id) references public.website_sessions(workspace_id,id,conversation_id);
alter table public.agent_runs add constraint run_instagram_authority_scope foreign key(workspace_id,channel_event_id) references public.channel_events(workspace_id,id);
create unique index website_turn_idempotency_idx on public.agent_runs(website_session_id,idempotency_key) where website_session_id is not null;
create unique index instagram_turn_idempotency_idx on public.agent_runs(channel_event_id) where channel_event_id is not null;
create index run_website_session_fk_idx on public.agent_runs(workspace_id,website_session_id,conversation_id) where website_session_id is not null;
create index run_channel_event_fk_idx on public.agent_runs(workspace_id,channel_event_id) where channel_event_id is not null;

create table public.message_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null, conversation_id uuid not null, connection_id uuid not null,
  message_id uuid not null unique,
  conversation_state_version integer not null default 0,
  handoff_notice boolean not null default false,
  status text not null default 'pending' check(status in ('pending','sending','available','sent','failed','unknown','blocked')),
  provider_message_id text check(length(provider_message_id)<=200), error_code text check(length(error_code)<=80),
  claimed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(workspace_id,message_id,conversation_id) references public.messages(workspace_id,id,conversation_id) on delete cascade,
  foreign key(workspace_id,conversation_id,connection_id) references public.conversations(workspace_id,id,channel_connection_id) on delete cascade
);
create index delivery_conversation_idx on public.message_deliveries(workspace_id,conversation_id,connection_id);
create index delivery_message_fk_idx on public.message_deliveries(workspace_id,message_id,conversation_id);
create index delivery_pending_idx on public.message_deliveries(created_at,id) where status='pending';
create table public.business_notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null, conversation_id uuid not null,
  kind text not null check(kind in ('qualified_lead','human_assistance')),
  status text not null default 'pending' check(status in ('pending','sending','sent','failed','unknown','suppressed')),
  recipient_user_id uuid references auth.users(id), error_code text check(length(error_code)<=80),
  claimed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(conversation_id,kind),
  foreign key(workspace_id,conversation_id) references public.conversations(workspace_id,id) on delete cascade
);
create index notification_conversation_idx on public.business_notifications(workspace_id,conversation_id);
create index notification_recipient_idx on public.business_notifications(recipient_user_id) where recipient_user_id is not null;
create index notification_pending_idx on public.business_notifications(created_at,id) where status='pending';

alter table public.channel_connections enable row level security;
alter table public.website_sessions enable row level security;
alter table public.channel_events enable row level security;
alter table public.message_deliveries enable row level security;
alter table public.business_notifications enable row level security;
revoke all on public.channel_connections,public.website_sessions,public.channel_events,public.message_deliveries,public.business_notifications from public,anon,authenticated,service_role;
grant select on public.channel_connections,public.message_deliveries,public.business_notifications to authenticated;
grant select(id,workspace_id,connection_id,conversation_id,origin,expires_at,created_at) on public.website_sessions to authenticated;
grant select(id,workspace_id,connection_id,provider_message_id,status,created_at,updated_at) on public.channel_events to authenticated;
create policy channel_read on public.channel_connections for select to authenticated using((select private.is_member(workspace_id)));
create policy website_session_read on public.website_sessions for select to authenticated using((select private.is_member(workspace_id)));
create policy channel_event_read on public.channel_events for select to authenticated using((select private.is_member(workspace_id)));
create policy delivery_read on public.message_deliveries for select to authenticated using((select private.is_member(workspace_id)));
create policy notification_read on public.business_notifications for select to authenticated using((select private.is_member(workspace_id)));

create function public.configure_website_channel(target_workspace_id uuid,channel_enabled boolean,origins text[]) returns uuid
language plpgsql security definer set search_path='' as $$
declare connection uuid;
begin
  perform private.require_member(target_workspace_id,auth.uid(),true);
  if channel_enabled is null or origins is null or cardinality(origins) not between 1 and 10 or
    cardinality(origins)<>(select count(distinct o) from unnest(origins) o) or
    exists(select 1 from unnest(origins) o where o is null or length(o)>240 or
      (o !~ '^https://[a-z0-9][a-z0-9.-]*(:[0-9]{1,5})?$' and o !~ '^http://(localhost|127\.0\.0\.1|\[::1\])(:[0-9]{1,5})?$')) then
    raise exception using errcode='22023',message='Exact approved origins required';
  end if;
  insert into public.channel_connections(workspace_id,channel,enabled,approved_origins,status)
    values(target_workspace_id,'website_chat',channel_enabled,origins,'ready')
    on conflict(workspace_id,channel) do update set enabled=excluded.enabled,approved_origins=excluded.approved_origins,updated_at=now()
    returning id into connection;
  return connection;
end; $$;
create function public.website_origin_allowed(public_channel_id uuid,request_origin text) returns boolean
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_backend();
  return exists(select 1 from public.channel_connections c where c.public_id=public_channel_id and c.channel='website_chat' and c.enabled and request_origin=any(c.approved_origins));
end; $$;
create function private.require_website_session(public_channel_id uuid,request_origin text,credential_hash text) returns public.website_sessions
language plpgsql security definer set search_path='' as $$
declare s public.website_sessions;
begin
  select sess.* into s from public.website_sessions sess join public.channel_connections c on c.id=sess.connection_id
    where c.public_id=public_channel_id and c.channel='website_chat' and c.enabled and c.workspace_id=sess.workspace_id
      and request_origin=any(c.approved_origins) and sess.origin=request_origin and sess.token_hash=credential_hash and sess.expires_at>now();
  if not found then raise exception using errcode='42501',message='Visitor session unavailable'; end if;
  return s;
end; $$;
create function public.create_website_session(public_channel_id uuid,request_origin text,credential_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c public.channel_connections; session_uuid uuid:=gen_random_uuid(); conversation_uuid uuid; business_name text; expiry timestamptz;
begin
  perform private.require_backend();
  select * into c from public.channel_connections ch where ch.public_id=public_channel_id and ch.channel='website_chat' and ch.enabled and request_origin=any(ch.approved_origins) for share;
  if not found then raise exception using errcode='42501',message='Website channel unavailable'; end if;
  if credential_hash is null or credential_hash !~ '^[a-f0-9]{64}$' then raise exception using errcode='22023',message='Invalid session hash'; end if;
  insert into public.conversations(workspace_id,channel,channel_connection_id,external_customer_ref)
    values(c.workspace_id,'website_chat',c.id,session_uuid::text) returning id into conversation_uuid;
  insert into public.website_sessions(id,workspace_id,connection_id,conversation_id,origin,token_hash)
    values(session_uuid,c.workspace_id,c.id,conversation_uuid,request_origin,credential_hash) returning expires_at into expiry;
  select name into business_name from public.workspaces where id=c.workspace_id;
  return jsonb_build_object('businessName',business_name,'expiresAt',expiry);
end; $$;
create function public.read_website_thread(public_channel_id uuid,request_origin text,credential_hash text,before_message_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.website_sessions; c public.conversations; business_name text; thread jsonb; boundary public.messages; earliest public.messages; more boolean;
begin
  perform private.require_backend();
  s:=private.require_website_session(public_channel_id,request_origin,credential_hash);
  select * into c from public.conversations where id=s.conversation_id;
  select name into business_name from public.workspaces where id=s.workspace_id;
  if before_message_id is not null then
    select * into boundary from public.messages where id=before_message_id and conversation_id=c.id;
    if not found then raise exception using errcode='42501',message='Message unavailable'; end if;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'role',m.role,'content',m.content,'createdAt',m.created_at) order by m.created_at,m.id),'[]'::jsonb) into thread
    from (select msg.id,msg.role,msg.content,msg.created_at from public.messages msg where msg.conversation_id=c.id and (before_message_id is null or (msg.created_at,msg.id)<(boundary.created_at,boundary.id)) order by msg.created_at desc,msg.id desc limit 100) m;
  if jsonb_array_length(thread)>0 then
    select * into earliest from public.messages where id=(thread->0->>'id')::uuid;
    more:=exists(select 1 from public.messages where conversation_id=c.id and (created_at,id)<(earliest.created_at,earliest.id));
  else more:=false; end if;
  return jsonb_build_object('businessName',business_name,'needsHuman',c.ai_mode='paused','messages',thread,'hasEarlier',more,'beforeMessageId',earliest.id,'expiresAt',s.expires_at);
end; $$;

create function private.begin_external_turn(conversation_uuid uuid,session_uuid uuid,event_uuid uuid,request_key uuid,message_content text,customer_timestamp timestamptz) returns public.agent_runs
language plpgsql security definer set search_path='' as $$
declare c public.conversations; r public.agent_runs;
begin
  select * into c from public.conversations where id=conversation_uuid and channel<>'test_agent' for update;
  if not found then raise exception using errcode='42501',message='Channel conversation unavailable'; end if;
  if request_key is null or message_content is null or length(btrim(message_content)) not between 1 and 2000 then raise exception using errcode='22023',message='Invalid customer message'; end if;
  update public.channel_events e set status='failed',updated_at=now() where e.id in (select a.channel_event_id from public.agent_runs a where a.conversation_id=c.id and a.status='processing' and a.created_at<now()-interval '2 minutes');
  update public.agent_runs a set status='failed',updated_at=now() where a.conversation_id=c.id and a.status='processing' and a.created_at<now()-interval '2 minutes';
  if exists(select 1 from public.agent_runs where conversation_id=c.id and status='processing') then raise exception using errcode='40001',message='Turn processing'; end if;
  insert into public.agent_runs(workspace_id,conversation_id,website_session_id,channel_event_id,idempotency_key,customer_content,state_version)
    values(c.workspace_id,c.id,session_uuid,event_uuid,request_key,message_content,c.state_version) returning * into r;
  insert into public.messages(workspace_id,conversation_id,role,content) values(c.workspace_id,c.id,'customer',message_content);
  update public.conversations set updated_at=clock_timestamp(),last_customer_at=greatest(last_customer_at,customer_timestamp) where id=c.id;
  update public.channel_connections set last_activity_at=now() where id=c.channel_connection_id;
  return r;
end; $$;
create function public.begin_website_turn(public_channel_id uuid,request_origin text,credential_hash text,client_message_id uuid,customer_content text)
returns table(run_id uuid,conversation_id uuid,workspace_id uuid,state text,existing boolean,response jsonb)
language plpgsql security definer set search_path='' as $$
declare s public.website_sessions; r public.agent_runs;
begin
  perform private.require_backend();
  s:=private.require_website_session(public_channel_id,request_origin,credential_hash);
  perform pg_advisory_xact_lock(hashtextextended(s.id::text||client_message_id::text,0));
  select * into r from public.agent_runs a where a.website_session_id=s.id and a.idempotency_key=client_message_id;
  if found then
    if r.customer_content is distinct from customer_content then raise exception using errcode='22023',message='Idempotency conflict'; end if;
    return query select r.id,r.conversation_id,r.workspace_id,r.status,true,r.response; return;
  end if;
  if (select count(*) from public.agent_runs where website_session_id=s.id and created_at>now()-interval '1 minute')>=20 then raise exception using errcode='P0001',message='Visitor turn rate exceeded'; end if;
  r:=private.begin_external_turn(s.conversation_id,s.id,null,client_message_id,customer_content,clock_timestamp());
  return query select r.id,r.conversation_id,r.workspace_id,r.status,false,r.response;
end; $$;
create function public.accept_instagram_event(provider_account_id text,sender_id text,provider_message_id text,customer_content text,payload_hash text,provider_timestamp timestamptz) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c public.channel_connections; e public.channel_events;
begin
  perform private.require_backend();
  select * into c from public.channel_connections ch where ch.channel='instagram' and ch.provider_account_id=accept_instagram_event.provider_account_id and ch.enabled and ch.status='connected' and ch.verified_at is not null for share;
  if not found then return jsonb_build_object('ignored',true); end if;
  if sender_id is null or sender_id !~ '^[0-9]{3,32}$' or sender_id=provider_account_id or provider_message_id is null or length(provider_message_id) not between 1 and 200 or customer_content is null or length(btrim(customer_content)) not between 1 and 2000 or payload_hash is null or payload_hash !~ '^[a-f0-9]{64}$' or provider_timestamp is null or provider_timestamp>now()+interval '5 minutes' then raise exception using errcode='22023',message='Invalid Instagram event'; end if;
  perform pg_advisory_xact_lock(hashtextextended(c.id::text||provider_message_id,0));
  select * into e from public.channel_events ev where ev.connection_id=c.id and ev.provider_message_id=accept_instagram_event.provider_message_id;
  if found then
    if e.payload_hash<>payload_hash then raise exception using errcode='22023',message='Provider replay conflict'; end if;
    return jsonb_build_object('eventId',e.id,'replayed',true);
  end if;
  insert into public.channel_events(workspace_id,connection_id,provider_message_id,sender_id,content,payload_hash,provider_timestamp)
    values(c.workspace_id,c.id,provider_message_id,sender_id,customer_content,payload_hash,least(provider_timestamp,now())) returning * into e;
  return jsonb_build_object('eventId',e.id,'replayed',false);
end; $$;
create function public.claim_instagram_event()
returns table(run_id uuid,conversation_id uuid,workspace_id uuid,state text,existing boolean,response jsonb)
language plpgsql security definer set search_path='' as $$
declare e public.channel_events; c public.channel_connections; conversation_uuid uuid; r public.agent_runs;
begin
  perform private.require_backend();
  select ev.* into e from public.channel_events ev join public.channel_connections ch on ch.id=ev.connection_id where ev.status='pending' and ch.enabled and ch.status='connected'
    and not exists(select 1 from public.conversations co join public.agent_runs a on a.conversation_id=co.id where co.channel_connection_id=ch.id and co.external_customer_ref=ev.sender_id and a.status='processing' and a.created_at>=now()-interval '2 minutes')
    order by ev.created_at,ev.id for update of ev skip locked limit 1;
  if not found then return; end if;
  select * into c from public.channel_connections where id=e.connection_id for share;
  if not c.enabled or c.status<>'connected' then return; end if;
  insert into public.conversations(workspace_id,channel,channel_connection_id,external_customer_ref)
    values(c.workspace_id,'instagram',c.id,e.sender_id)
    on conflict(channel_connection_id,external_customer_ref) where channel_connection_id is not null do update set external_customer_ref=excluded.external_customer_ref returning id into conversation_uuid;
  r:=private.begin_external_turn(conversation_uuid,null,e.id,e.id,e.content,e.provider_timestamp);
  update public.channel_events set status='processing',updated_at=now() where id=e.id;
  return query select r.id,r.conversation_id,r.workspace_id,r.status,false,r.response;
end; $$;
create function private.require_channel_run(target_run_id uuid) returns public.agent_runs
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs; c public.conversations; ch public.channel_connections;
begin
  select * into r from public.agent_runs where id=target_run_id;
  if not found or r.actor_id is not null or num_nonnulls(r.website_session_id,r.channel_event_id)<>1 then raise exception using errcode='42501',message='Channel turn unavailable'; end if;
  select * into c from public.conversations where id=r.conversation_id and workspace_id=r.workspace_id;
  select * into ch from public.channel_connections where id=c.channel_connection_id and workspace_id=c.workspace_id and enabled for share;
  if not found then raise exception using errcode='42501',message='Channel disabled'; end if;
  if r.website_session_id is not null then
    if c.channel<>'website_chat' or not exists(select 1 from public.website_sessions s where s.id=r.website_session_id and s.workspace_id=c.workspace_id and s.conversation_id=c.id and s.connection_id=ch.id and s.expires_at>now() and s.origin=any(ch.approved_origins)) then raise exception using errcode='42501',message='Visitor authority expired'; end if;
  else
    if c.channel<>'instagram' or ch.status<>'connected' or ch.verified_at is null or not exists(select 1 from public.channel_events ev where ev.id=r.channel_event_id and ev.connection_id=ch.id and ev.workspace_id=c.workspace_id and ev.sender_id=c.external_customer_ref) then raise exception using errcode='42501',message='Provider authority unavailable'; end if;
  end if;
  return r;
end; $$;
create function public.channel_runtime_context(target_run_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs; c public.conversations; business_name text; settings jsonb; history jsonb;
begin
  perform private.require_backend(); r:=private.require_channel_run(target_run_id);
  select * into c from public.conversations where id=r.conversation_id;
  select name into business_name from public.workspaces where id=r.workspace_id;
  select jsonb_build_object('tone',s.tone,'goals',s.goals,'contact_fields',s.contact_fields,'human_handoff_enabled',s.human_handoff_enabled) into settings from public.agent_settings s where s.workspace_id=r.workspace_id;
  select coalesce(jsonb_agg(jsonb_build_object('role',m.role,'content',m.content) order by m.created_at,m.id),'[]'::jsonb) into history from (select role,content,created_at,id from public.messages where conversation_id=c.id order by created_at desc,id desc limit 24) m;
  return jsonb_build_object('businessName',business_name,'settings',settings,'aiMode',c.ai_mode,'channel',c.channel,'history',history,'content',r.customer_content,'replyWindowOpen',c.channel<>'instagram' or c.last_customer_at>=now()-interval '24 hours');
end; $$;
create function public.match_channel_knowledge(target_run_id uuid,query_embedding extensions.vector(1536))
returns table(id uuid,title text,content text,revision integer,similarity double precision)
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs;
begin
  perform private.require_backend(); r:=private.require_channel_run(target_run_id);
  return query select k.id,k.title,k.content,k.revision,(1-(k.embedding operator(extensions.<=>) query_embedding))::double precision from public.knowledge_items k where k.workspace_id=r.workspace_id and k.status='published' and k.embedding is not null and 1-(k.embedding operator(extensions.<=>) query_embedding)>=0.30 order by k.embedding operator(extensions.<=>) query_embedding,k.id limit 5;
end; $$;

create function private.enqueue_business_notification(conversation_uuid uuid,notification_kind text) returns void
language plpgsql security definer set search_path='' as $$
begin
  insert into public.business_notifications(workspace_id,conversation_id,kind)
    select workspace_id,id,notification_kind from public.conversations where id=conversation_uuid and channel<>'test_agent'
    on conflict(conversation_id,kind) do nothing;
end; $$;
create function private.create_message_delivery(message_uuid uuid,handoff_notice boolean default false) returns void
language plpgsql security definer set search_path='' as $$
begin
  insert into public.message_deliveries(workspace_id,conversation_id,connection_id,message_id,status,conversation_state_version,handoff_notice)
    select m.workspace_id,m.conversation_id,c.channel_connection_id,m.id,case when c.channel='website_chat' then 'available' else 'pending' end,c.state_version,handoff_notice
    from public.messages m join public.conversations c on c.id=m.conversation_id where m.id=message_uuid and m.role in ('assistant','human') and c.channel<>'test_agent'
    on conflict(message_id) do nothing;
end; $$;

-- One shared commit preserves Foundation contact evidence and qualification rules.
create function private.commit_runtime_turn(target_run_id uuid,assistant_content text,source_references jsonb,request_human boolean,lead_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs; c public.conversations; settings public.agent_settings; lead_id uuid; evidence text; contact_key text; proposed text; effective_human boolean; result jsonb; facts jsonb; prior public.leads; qualification text; reply_message_id uuid; durable_reply text; suppress_reply boolean; new_handoff boolean;
begin
  select * into r from public.agent_runs where id=target_run_id;
  select * into c from public.conversations where id=r.conversation_id for update;
  select * into r from public.agent_runs where id=target_run_id for update;
  if r.status='completed' then return r.response; end if;
  if r.status<>'processing' then raise exception using errcode='40001',message='Turn not active'; end if;
  if assistant_content is null or length(btrim(assistant_content)) not between 1 and 2500 or source_references is null or jsonb_typeof(source_references)<>'array' or jsonb_array_length(source_references)>5 then raise exception using errcode='22023',message='Invalid response'; end if;
  select * into settings from public.agent_settings s where s.workspace_id=r.workspace_id;
  suppress_reply:=c.channel<>'test_agent' and (c.ai_mode='paused' or c.state_version is distinct from r.state_version);
  if c.channel<>'test_agent' and c.state_version is distinct from r.state_version then
    request_human:=false; lead_payload:=null; source_references:='[]'::jsonb;
  end if;
  if exists(select 1 from jsonb_array_elements(source_references) src where not exists(select 1 from public.knowledge_items k where k.id::text=src->>'id' and k.workspace_id=r.workspace_id and k.status='published' and k.revision::text=src->>'revision')) then raise exception using errcode='40001',message='Knowledge publication changed'; end if;
  effective_human:=request_human or c.ai_mode='paused' or not ('answer_questions'=any(settings.goals));
  new_handoff:=effective_human and c.ai_mode='active';
  if effective_human then
    update public.conversations set status='needs_human',ai_mode='paused',handoff_state=case when assignee_id is null then 'requested' else 'claimed' end,handoff_at=coalesce(handoff_at,now()),state_version=state_version+case when new_handoff then 1 else 0 end,updated_at=now() where id=c.id;
  end if;
  select string_agg(m.content,E'\n' order by m.created_at,m.id) into evidence from (select msg.content,msg.created_at,msg.id from public.messages msg where msg.conversation_id=c.id and msg.role='customer' order by msg.created_at desc,msg.id desc limit 24) m;
  if lead_payload is not null then
    if jsonb_typeof(lead_payload)<>'object' or lead_payload-array['name','email','phone','company','intent','qualification','summary']<>'{}'::jsonb or lead_payload->>'intent'<>'service_inquiry' or length(lead_payload->>'summary') not between 1 and 600 then raise exception using errcode='22023',message='Invalid lead'; end if;
    if not ('identify_interest'=any(settings.goals) and 'collect_contact'=any(settings.goals)) then raise exception using errcode='42501',message='Lead collection restricted'; end if;
    if evidence !~* '(interested (in|to)|looking for|would like|I.d like|I (want|need)|request (a )?quote|ilgileniyorum|teklif (almak|istiyorum)|hizmet almak)' or evidence !~* '(service|project|design|manufactur|quote|consultation|repair|restoration|order|hizmet|proje|tasarım|üretim|teklif|onarım)' then raise exception using errcode='22023',message='Service interest required'; end if;
    if r.customer_content ~* '(not interested|just browsing|no thanks|do not contact|don.t contact|ilgilenmiyorum|istemiyorum|sadece bakıyorum)' then raise exception using errcode='22023',message='Customer declined'; end if;
    facts:='{}'::jsonb;
    foreach contact_key in array array['name','email','phone','company'] loop
      proposed:=nullif(btrim(lead_payload->>contact_key),'');
      if proposed is not null then
        if not contact_key=any(settings.contact_fields) or position(lower(proposed) in lower(evidence))=0 then raise exception using errcode='22023',message='Contact evidence required'; end if;
        if contact_key='email' and proposed !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception using errcode='22023',message='Invalid email'; end if;
        facts:=facts||jsonb_build_object(contact_key,proposed);
      end if;
    end loop;
    if facts='{}'::jsonb then raise exception using errcode='22023',message='Contact details required'; end if;
    select * into prior from public.leads l where l.conversation_id=c.id;
    facts:=jsonb_strip_nulls(jsonb_build_object('name',prior.name,'email',prior.email,'phone',prior.phone,'company',prior.company))||facts;
    qualification:=case when effective_human then 'needs_human' when 'qualify_inquiries'=any(settings.goals) and not exists(select 1 from unnest(settings.contact_fields) f where nullif(facts->>f,'') is null) then 'qualified' else 'needs_info' end;
    insert into public.leads(workspace_id,conversation_id,name,email,phone,company,intent,qualification,summary,source)
      values(r.workspace_id,c.id,facts->>'name',facts->>'email',facts->>'phone',facts->>'company','service_inquiry',qualification,lead_payload->>'summary',c.channel)
      on conflict(conversation_id) do update set name=excluded.name,email=excluded.email,phone=excluded.phone,company=excluded.company,qualification=excluded.qualification,summary=excluded.summary,updated_at=now() returning id into lead_id;
    if qualification='qualified' then perform private.enqueue_business_notification(c.id,'qualified_lead'); end if;
  else
    select l.id into lead_id from public.leads l where l.conversation_id=c.id;
    if effective_human then update public.leads set qualification='needs_human',updated_at=now() where conversation_id=c.id; end if;
  end if;
  durable_reply:=case when suppress_reply then '' when c.channel='test_agent' and (c.ai_mode='paused' or not ('answer_questions'=any(settings.goals))) then 'This test conversation is paused for human assistance. No automatic customer answer has been sent.' when c.channel<>'test_agent' and not ('answer_questions'=any(settings.goals)) then 'A team member can continue this conversation. Automated answers are paused.' else assistant_content end;
  if not suppress_reply then
    if c.channel='instagram' and octet_length(durable_reply)>1000 then raise exception using errcode='22023',message='Instagram response too large'; end if;
    insert into public.messages(workspace_id,conversation_id,role,content,sources) values(r.workspace_id,c.id,'assistant',durable_reply,source_references) returning id into reply_message_id;
    perform private.create_message_delivery(reply_message_id,new_handoff);
  end if;
  if new_handoff then perform private.enqueue_business_notification(c.id,'human_assistance'); end if;
  result:=jsonb_build_object('conversationId',c.id,'reply',durable_reply,'messageId',reply_message_id,'leadId',lead_id,'needsHuman',effective_human,'sources',source_references,'replayed',false);
  update public.agent_runs set status='completed',response=result,updated_at=now() where id=r.id;
  if r.channel_event_id is not null then update public.channel_events set status='completed',updated_at=now() where id=r.channel_event_id; end if;
  update public.conversations set updated_at=clock_timestamp() where id=c.id;
  return result;
end; $$;
create or replace function public.finish_agent_turn(actor_id uuid,target_run_id uuid,assistant_content text,source_references jsonb,request_human boolean,lead_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs;
begin
  perform private.require_backend();
  select * into r from public.agent_runs where id=target_run_id;
  if not found or actor_id is null or r.actor_id is null or r.actor_id<>actor_id or not exists(select 1 from public.conversations where id=r.conversation_id and channel='test_agent') then raise exception using errcode='42501',message='Test turn unavailable'; end if;
  perform private.require_member(r.workspace_id,actor_id);
  return private.commit_runtime_turn(target_run_id,assistant_content,source_references,request_human,lead_payload);
end; $$;
create function public.finish_channel_turn(target_run_id uuid,assistant_content text,source_references jsonb,request_human boolean,lead_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_backend(); perform private.require_channel_run(target_run_id);
  return private.commit_runtime_turn(target_run_id,assistant_content,source_references,request_human,lead_payload);
end; $$;
create function public.fail_channel_turn(target_run_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs; c public.conversations;
begin
  perform private.require_backend();
  select * into r from public.agent_runs where id=target_run_id;
  if not found or r.actor_id is not null then raise exception using errcode='42501',message='Channel turn unavailable'; end if;
  select * into c from public.conversations where id=r.conversation_id for update;
  update public.agent_runs set status='failed',updated_at=now() where id=r.id and status='processing';
  if not found then return; end if;
  if r.channel_event_id is not null then update public.channel_events set status='failed',updated_at=now() where id=r.channel_event_id; end if;
  if c.state_version is distinct from r.state_version then return; end if;
  update public.conversations set ai_mode='paused',status='needs_human',handoff_state=case when assignee_id is null then 'requested' else 'claimed' end,handoff_at=coalesce(handoff_at,now()),state_version=state_version+1,updated_at=now() where id=c.id;
  update public.leads set qualification='needs_human',updated_at=now() where conversation_id=c.id;
  if c.ai_mode='active' then perform private.enqueue_business_notification(c.id,'human_assistance'); end if;
end; $$;

create function public.conversation_team_action(target_workspace_id uuid,target_conversation_id uuid,team_action text) returns void
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); c public.conversations;
begin
  perform private.require_member(target_workspace_id,actor);
  select * into c from public.conversations where id=target_conversation_id and workspace_id=target_workspace_id and channel<>'test_agent' for update;
  if not found then raise exception using errcode='42501',message='Inbox conversation unavailable'; end if;
  if team_action='claim' then
    if c.assignee_id is not null and c.assignee_id<>actor and exists(select 1 from public.workspace_members where workspace_id=c.workspace_id and user_id=c.assignee_id and active) then raise exception using errcode='40001',message='Conversation already claimed'; end if;
    update public.conversations set assignee_id=actor,claimed_at=now(),status='needs_human',ai_mode='paused',handoff_state='claimed',handoff_at=coalesce(handoff_at,now()),state_version=state_version+1,updated_at=now() where id=c.id;
    update public.leads set qualification='needs_human',updated_at=now() where conversation_id=c.id;
  elsif team_action='release' then
    if c.assignee_id is distinct from actor then raise exception using errcode='42501',message='Claim owner required'; end if;
    update public.conversations set assignee_id=null,claimed_at=null,handoff_state='requested',state_version=state_version+1,updated_at=now() where id=c.id;
  elsif team_action='resume' then
    if c.assignee_id is not null and c.assignee_id<>actor and exists(select 1 from public.workspace_members where workspace_id=c.workspace_id and user_id=c.assignee_id and active) then raise exception using errcode='42501',message='Claim owner required'; end if;
    update public.conversations set assignee_id=null,claimed_at=null,status='open',ai_mode='active',handoff_state='none',state_version=state_version+1,updated_at=now() where id=c.id;
  else raise exception using errcode='22023',message='Unknown team action'; end if;
end; $$;
create function public.create_human_reply(target_workspace_id uuid,target_conversation_id uuid,client_message_id uuid,reply_content text) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); c public.conversations; m public.messages; message_uuid uuid;
begin
  perform private.require_member(target_workspace_id,actor);
  select * into c from public.conversations where id=target_conversation_id and workspace_id=target_workspace_id and channel<>'test_agent' for update;
  if not found then raise exception using errcode='42501',message='Inbox conversation unavailable'; end if;
  if client_message_id is null or reply_content is null or length(btrim(reply_content)) not between 1 and 2000 or (c.channel='instagram' and octet_length(reply_content)>1000) then raise exception using errcode='22023',message='Invalid human reply'; end if;
  select * into m from public.messages where conversation_id=c.id and role='human' and human_actor_id=actor and messages.client_message_id=create_human_reply.client_message_id;
  if found then
    if m.content<>reply_content then raise exception using errcode='22023',message='Human reply idempotency conflict'; end if;
    return m.id;
  end if;
  if c.assignee_id is distinct from actor or c.ai_mode<>'paused' then raise exception using errcode='42501',message='Claim this conversation first'; end if;
  insert into public.messages(workspace_id,conversation_id,role,content,human_actor_id,client_message_id)
    values(c.workspace_id,c.id,'human',reply_content,actor,client_message_id) returning id into message_uuid;
  perform private.create_message_delivery(message_uuid);
  update public.conversations set updated_at=clock_timestamp() where id=c.id;
  return message_uuid;
end; $$;
create function public.inbox_snapshot(target_workspace_id uuid,page_offset integer default 0) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
  perform private.require_member(target_workspace_id,auth.uid());
  if page_offset<0 or page_offset>100000 then raise exception using errcode='22023',message='Invalid page'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'channel',c.channel,'customerRef',coalesce(l.name,l.company,c.external_customer_ref),'aiMode',c.ai_mode,'handoffState',c.handoff_state,'assigneeId',c.assignee_id,'updatedAt',c.updated_at,'preview',left(m.content,180),'leadId',l.id,'qualification',l.qualification,'needsAttention',exists(select 1 from public.message_deliveries d where d.conversation_id=c.id and d.status in ('failed','unknown','blocked')) ) order by c.updated_at desc,c.id),'[]'::jsonb) into result
    from (select * from public.conversations where workspace_id=target_workspace_id and channel<>'test_agent' order by updated_at desc,id limit 50 offset page_offset) c
    left join public.leads l on l.conversation_id=c.id
    left join lateral (select content from public.messages where conversation_id=c.id order by created_at desc,id desc limit 1) m on true;
  return result;
end; $$;

create function private.sweep_channel_work() returns void
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs; c public.conversations; d public.message_deliveries;
begin
  for r in select * from public.agent_runs where actor_id is null and status='processing' and created_at<now()-interval '2 minutes' limit 50 loop
    select * into c from public.conversations where id=r.conversation_id for update;
    update public.agent_runs set status='failed',updated_at=now() where id=r.id and status='processing' and created_at<now()-interval '2 minutes';
    if found then
      if r.channel_event_id is not null then update public.channel_events set status='failed',updated_at=now() where id=r.channel_event_id; end if;
      if c.ai_mode='active' and c.state_version=r.state_version then
        update public.conversations set ai_mode='paused',status='needs_human',handoff_state='requested',handoff_at=coalesce(handoff_at,now()),state_version=state_version+1,updated_at=now() where id=c.id;
        perform private.enqueue_business_notification(c.id,'human_assistance');
      end if;
    end if;
  end loop;
  for d in select * from public.message_deliveries where status='sending' and claimed_at<now()-interval '1 minute' for update skip locked loop
    update public.message_deliveries set status='unknown',error_code='SEND_INTERRUPTED',updated_at=now() where id=d.id;
    select * into c from public.conversations where id=d.conversation_id for update;
    if c.ai_mode='active' then
      update public.conversations set ai_mode='paused',status='needs_human',handoff_state='requested',handoff_at=coalesce(handoff_at,now()),state_version=state_version+1,updated_at=now() where id=c.id;
      perform private.enqueue_business_notification(c.id,'human_assistance');
    end if;
  end loop;
  update public.business_notifications set status='unknown',error_code='SEND_INTERRUPTED',updated_at=now() where status='sending' and claimed_at<now()-interval '1 minute';
end; $$;
create function public.claim_message_delivery(target_message_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare d public.message_deliveries; c public.conversations; ch public.channel_connections; m public.messages; provider_token text;
begin
  perform private.require_backend(); perform private.sweep_channel_work();
  select * into d from public.message_deliveries where status='pending' and (target_message_id is null or message_id=target_message_id) order by created_at,id for update skip locked limit 1;
  if not found then return null; end if;
  select * into ch from public.channel_connections where id=d.connection_id for share;
  select * into c from public.conversations where id=d.conversation_id for update;
  select * into m from public.messages where id=d.message_id;
  if not ch.enabled or ch.status<>'connected' or ch.channel<>'instagram' then
    update public.message_deliveries set status='blocked',error_code='CHANNEL_UNAVAILABLE',updated_at=now() where id=d.id;
    return jsonb_build_object('skipped',true);
  end if;
  if m.role='assistant' and (c.state_version<>d.conversation_state_version or (c.ai_mode='paused' and not d.handoff_notice)) then
    update public.message_deliveries set status='blocked',error_code='AI_PAUSED',updated_at=now() where id=d.id;
    return jsonb_build_object('skipped',true);
  end if;
  if c.last_customer_at is null or c.last_customer_at<now()-interval '24 hours' then
    update public.message_deliveries set status='blocked',error_code='REPLY_WINDOW_CLOSED',updated_at=now() where id=d.id;
    return jsonb_build_object('skipped',true);
  end if;
  select v.decrypted_secret into provider_token from private.channel_credentials secret join vault.decrypted_secrets v on v.id=secret.secret_id where secret.connection_id=ch.id;
  if provider_token is null then
    update public.message_deliveries set status='failed',error_code='CREDENTIAL_UNAVAILABLE',updated_at=now() where id=d.id;
    return jsonb_build_object('skipped',true);
  end if;
  update public.message_deliveries set status='sending',claimed_at=now(),updated_at=now() where id=d.id;
  return jsonb_build_object('deliveryId',d.id,'accountId',ch.provider_account_id,'recipientId',c.external_customer_ref,'accessToken',provider_token,'apiVersion',ch.api_version,'text',m.content);
end; $$;
create function public.finish_message_delivery(target_delivery_id uuid,delivery_state text,provider_message_id text,failure_code text) returns void
language plpgsql security definer set search_path='' as $$
declare d public.message_deliveries; c public.conversations;
begin
  perform private.require_backend();
  if delivery_state is null or delivery_state not in ('sent','failed','unknown') or (failure_code is not null and failure_code !~ '^[A-Z0-9_]{1,80}$') or length(provider_message_id)>200 then raise exception using errcode='22023',message='Invalid delivery result'; end if;
  select * into d from public.message_deliveries where id=target_delivery_id for update;
  if not found or d.status<>'sending' then return; end if;
  update public.message_deliveries set status=delivery_state,provider_message_id=finish_message_delivery.provider_message_id,error_code=failure_code,updated_at=now() where id=d.id;
  if delivery_state<>'sent' then
    select * into c from public.conversations where id=d.conversation_id for update;
    if c.ai_mode='active' then
      update public.conversations set ai_mode='paused',status='needs_human',handoff_state='requested',handoff_at=coalesce(handoff_at,now()),state_version=state_version+1,updated_at=now() where id=c.id;
      update public.leads set qualification='needs_human',updated_at=now() where conversation_id=c.id;
      perform private.enqueue_business_notification(c.id,'human_assistance');
    end if;
    if failure_code in ('META_REJECTED_190','META_REJECTED_200','CREDENTIAL_UNAVAILABLE') then update public.channel_connections set enabled=false,status='needs_attention',updated_at=now() where id=d.connection_id; end if;
  end if;
end; $$;
create function public.claim_business_notification(target_conversation_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare n public.business_notifications; recipient record;
begin
  perform private.require_backend(); perform private.sweep_channel_work();
  select * into n from public.business_notifications where status='pending' and (target_conversation_id is null or conversation_id=target_conversation_id) order by created_at,id for update skip locked limit 1;
  if not found then return null; end if;
  select u.id,u.email into recipient from public.workspace_members m join auth.users u on u.id=m.user_id where m.workspace_id=n.workspace_id and m.active and m.role='owner' and u.email_confirmed_at is not null and u.email is not null order by m.created_at,m.user_id limit 1;
  if not found then
    update public.business_notifications set status='suppressed',error_code='NO_VERIFIED_OWNER',updated_at=now() where id=n.id;
    return jsonb_build_object('skipped',true);
  end if;
  update public.business_notifications set status='sending',recipient_user_id=recipient.id,claimed_at=now(),updated_at=now() where id=n.id;
  return jsonb_build_object('notificationId',n.id,'conversationId',n.conversation_id,'kind',n.kind,'to',recipient.email);
end; $$;
create function public.finish_business_notification(target_notification_id uuid,notification_state text,failure_code text) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_backend();
  if notification_state is null or notification_state not in ('sent','failed','unknown') or (failure_code is not null and failure_code !~ '^[A-Z0-9_]{1,80}$') then raise exception using errcode='22023',message='Invalid notification result'; end if;
  update public.business_notifications set status=notification_state,error_code=failure_code,updated_at=now() where id=target_notification_id and status='sending';
end; $$;

create function public.inspect_instagram_target(target_workspace_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare w public.workspaces; existing jsonb;
begin
  perform private.require_backend();
  select * into w from public.workspaces where id=target_workspace_id;
  if not found or not exists(select 1 from public.workspace_members where workspace_id=w.id and role='owner' and active) then raise exception using errcode='42501',message='Provisioning workspace unavailable'; end if;
  select jsonb_build_object('accountId',provider_account_id,'status',status,'enabled',enabled) into existing from public.channel_connections where workspace_id=w.id and channel='instagram';
  return jsonb_build_object('workspaceId',w.id,'workspaceName',w.name,'existing',existing);
end; $$;
create function public.provision_instagram_channel(target_workspace_id uuid,expected_workspace_name text,provider_account_id text,provider_username text,provider_token text,provider_version text,verified_app_id text) returns uuid
language plpgsql security definer set search_path='' as $$
declare w public.workspaces; c public.channel_connections; connection_uuid uuid; secret_uuid uuid;
begin
  perform private.require_backend();
  select * into w from public.workspaces where id=target_workspace_id for share;
  if not found or w.name is distinct from expected_workspace_name or not exists(select 1 from public.workspace_members where workspace_id=w.id and role='owner' and active) then raise exception using errcode='42501',message='Provisioning target mismatch'; end if;
  if provider_account_id is null or provider_account_id !~ '^[0-9]{3,32}$' or verified_app_id is null or verified_app_id !~ '^[0-9]{3,32}$' or provider_username is null or length(provider_username) not between 1 and 100 or provider_token is null or length(provider_token) not between 20 and 4096 or provider_version is distinct from 'v26.0' then raise exception using errcode='22023',message='Invalid verified provider connection'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_workspace_id::text||'instagram',0));
  select * into c from public.channel_connections where workspace_id=w.id and channel='instagram' for update;
  if found and c.provider_account_id is distinct from provider_account_id then raise exception using errcode='42501',message='V1 reconnects only the original Instagram account for this workspace'; end if;
  if exists(select 1 from public.channel_connections ch where ch.channel='instagram' and ch.provider_account_id=provision_instagram_channel.provider_account_id and ch.workspace_id<>w.id) then raise exception using errcode='42501',message='Provider account already belongs to another workspace'; end if;
  if c.id is null then
    insert into public.channel_connections(workspace_id,channel,status,provider_account_id,provider_username,provider_app_id,api_version)
      values(w.id,'instagram','disconnected',provider_account_id,provider_username,verified_app_id,provider_version) returning id into connection_uuid;
  else connection_uuid:=c.id; end if;
  select secret_id into secret_uuid from private.channel_credentials where connection_id=connection_uuid;
  if secret_uuid is null then
    select vault.create_secret(provider_token,'instagram_'||connection_uuid::text,'Avenlyo managed Instagram credential') into secret_uuid;
    insert into private.channel_credentials(connection_id,secret_id) values(connection_uuid,secret_uuid);
  else perform vault.update_secret(secret_uuid,provider_token); end if;
  update public.channel_connections set enabled=true,status='connected',provider_username=provision_instagram_channel.provider_username,provider_app_id=verified_app_id,api_version=provider_version,verified_at=now(),updated_at=now() where id=connection_uuid;
  return connection_uuid;
end; $$;
create function public.disconnect_instagram_channel(target_workspace_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare c public.channel_connections; secret_uuid uuid;
begin
  perform private.require_member(target_workspace_id,auth.uid(),true);
  select * into c from public.channel_connections where workspace_id=target_workspace_id and channel='instagram' for update;
  if not found then return; end if;
  select secret_id into secret_uuid from private.channel_credentials where connection_id=c.id;
  delete from private.channel_credentials where connection_id=c.id;
  delete from vault.secrets where id=secret_uuid;
  update public.channel_connections set enabled=false,status='disconnected',updated_at=now() where id=c.id;
  update public.message_deliveries set status='blocked',error_code='CHANNEL_DISCONNECTED',updated_at=now() where connection_id=c.id and status='pending';
end; $$;

create or replace function public.resume_test_conversation(target_workspace_id uuid,target_conversation_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_member(target_workspace_id,auth.uid());
  update public.conversations set ai_mode='active',status='open',handoff_state='none',state_version=state_version+1,updated_at=now() where id=target_conversation_id and workspace_id=target_workspace_id and channel='test_agent';
  if not found then raise exception using errcode='42501',message='Test conversation unavailable'; end if;
end; $$;

-- No private helper or encrypted-secret function is a Data API capability.
revoke all on all functions in schema private from public,anon,authenticated,service_role;
grant execute on function private.is_member(uuid) to authenticated;
revoke all on function public.configure_website_channel(uuid,boolean,text[]),public.disconnect_instagram_channel(uuid),public.website_origin_allowed(uuid,text),public.create_website_session(uuid,text,text),public.read_website_thread(uuid,text,text,uuid),public.begin_website_turn(uuid,text,text,uuid,text),public.accept_instagram_event(text,text,text,text,text,timestamptz),public.claim_instagram_event(),public.channel_runtime_context(uuid),public.match_channel_knowledge(uuid,extensions.vector),public.finish_channel_turn(uuid,text,jsonb,boolean,jsonb),public.fail_channel_turn(uuid),public.conversation_team_action(uuid,uuid,text),public.create_human_reply(uuid,uuid,uuid,text),public.inbox_snapshot(uuid,integer),public.claim_message_delivery(uuid),public.finish_message_delivery(uuid,text,text,text),public.claim_business_notification(uuid),public.finish_business_notification(uuid,text,text),public.inspect_instagram_target(uuid),public.provision_instagram_channel(uuid,text,text,text,text,text,text) from public,anon,authenticated,service_role;
grant execute on function public.configure_website_channel(uuid,boolean,text[]),public.disconnect_instagram_channel(uuid),public.conversation_team_action(uuid,uuid,text),public.create_human_reply(uuid,uuid,uuid,text),public.inbox_snapshot(uuid,integer) to authenticated;
grant execute on function public.website_origin_allowed(uuid,text),public.create_website_session(uuid,text,text),public.read_website_thread(uuid,text,text,uuid),public.begin_website_turn(uuid,text,text,uuid,text),public.accept_instagram_event(text,text,text,text,text,timestamptz),public.claim_instagram_event(),public.channel_runtime_context(uuid),public.match_channel_knowledge(uuid,extensions.vector),public.finish_channel_turn(uuid,text,jsonb,boolean,jsonb),public.fail_channel_turn(uuid),public.claim_message_delivery(uuid),public.finish_message_delivery(uuid,text,text,text),public.claim_business_notification(uuid),public.finish_business_notification(uuid,text,text),public.inspect_instagram_target(uuid),public.provision_instagram_channel(uuid,text,text,text,text,text,text) to service_role;

-- Preserve authenticated Test Agent authority; it cannot inject into a live channel.
create or replace function public.begin_agent_turn(actor_id uuid,target_workspace_id uuid,target_conversation_id uuid,target_idempotency_key uuid,customer_content text)
returns table(run_id uuid,conversation_id uuid,state text,existing boolean,response jsonb)
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs; c public.conversations; conversation_uuid uuid;
begin
  perform private.require_backend();
  perform private.require_member(target_workspace_id,actor_id);
  if target_idempotency_key is null or length(btrim(customer_content)) not between 1 and 2000 then raise exception using errcode='22023',message='Invalid turn'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_workspace_id::text||actor_id::text||target_idempotency_key::text,0));
  select * into r from public.agent_runs a where a.workspace_id=target_workspace_id and a.actor_id=begin_agent_turn.actor_id and a.idempotency_key=target_idempotency_key;
  if found then
    if r.customer_content<>customer_content or (target_conversation_id is not null and r.conversation_id<>target_conversation_id) then raise exception using errcode='22023',message='Idempotency conflict'; end if;
    return query select r.id,r.conversation_id,r.status,true,r.response; return;
  end if;
  if target_conversation_id is null then
    insert into public.conversations(workspace_id,created_by) values(target_workspace_id,actor_id) returning id into conversation_uuid;
  else
    conversation_uuid:=target_conversation_id;
  end if;
  select * into c from public.conversations co where co.id=conversation_uuid and co.workspace_id=target_workspace_id and co.channel='test_agent' for update;
  if not found then raise exception using errcode='42501',message='Conversation unavailable'; end if;
  update public.agent_runs a set status='failed',updated_at=now() where a.conversation_id=conversation_uuid and a.status='processing' and a.created_at<now()-interval '2 minutes';
  if exists(select 1 from public.agent_runs a where a.conversation_id=conversation_uuid and a.status='processing') then raise exception using errcode='40001',message='Turn processing'; end if;
  insert into public.agent_runs(workspace_id,conversation_id,actor_id,idempotency_key,customer_content) values(target_workspace_id,conversation_uuid,actor_id,target_idempotency_key,customer_content) returning * into r;
  insert into public.messages(workspace_id,conversation_id,role,content) values(target_workspace_id,conversation_uuid,'customer',customer_content);
  update public.conversations set updated_at=clock_timestamp() where id=conversation_uuid;
  return query select r.id,conversation_uuid,r.status,false,r.response;
end; $$;

