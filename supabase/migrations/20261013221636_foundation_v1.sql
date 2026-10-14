-- Independent foundation: no legacy schema, grants or migration version is assumed.
create schema if not exists extensions;
create extension if not exists vector with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 100),
  slug text not null unique,
  created_at timestamptz not null default now()
);
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','member')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (workspace_id,user_id)
);
create index workspace_members_user_idx on public.workspace_members(user_id,workspace_id) where active;
create index workspace_members_user_fk_idx on public.workspace_members(user_id);
create table public.agent_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  tone text not null default 'professional' check (tone in ('professional','warm','concise')),
  goals text[] not null default array['answer_questions','identify_interest','qualify_inquiries','collect_contact','human_handoff'],
  contact_fields text[] not null default array['name','email'],
  human_handoff_enabled boolean not null default true check (human_handoff_enabled),
  setup_brief text not null default '' check (length(setup_brief)<=1500),
  updated_at timestamptz not null default now(),
  check (goals <@ array['answer_questions','identify_interest','qualify_inquiries','collect_contact','human_handoff'] and 'human_handoff'=any(goals)),
  check (contact_fields <@ array['name','email','phone','company']),
  check (cardinality(contact_fields)=0 or 'collect_contact'=any(goals))
);
create table public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type text not null check (type in ('text','faq')),
  title text not null check (length(btrim(title)) between 3 and 180),
  content text not null check (length(btrim(content)) between 3 and 6000),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  revision integer not null default 1 check (revision>0),
  embedding extensions.vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,id),
  check(status <> 'published' or embedding is not null)
);
create index knowledge_workspace_status_idx on public.knowledge_items(workspace_id,status);
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel text not null default 'test_agent' check (channel='test_agent'),
  status text not null default 'open' check (status in ('open','needs_human')),
  ai_mode text not null default 'active' check (ai_mode in ('active','paused')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,id),
  check ((status='needs_human')=(ai_mode='paused'))
);
create index conversations_workspace_updated_idx on public.conversations(workspace_id,updated_at desc);
create index conversations_created_by_idx on public.conversations(created_by);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  conversation_id uuid not null,
  role text not null check (role in ('customer','assistant')),
  content text not null check (length(btrim(content)) between 1 and 2500),
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources)='array'),
  created_at timestamptz not null default clock_timestamp(),
  foreign key(workspace_id,conversation_id) references public.conversations(workspace_id,id) on delete cascade
);
create index messages_conversation_idx on public.messages(workspace_id,conversation_id,created_at,id);
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  conversation_id uuid not null unique,
  name text check(length(name)<=120),
  email text check(length(email)<=254),
  phone text check(length(phone)<=40),
  company text check(length(company)<=120),
  intent text not null check (intent='service_inquiry'),
  qualification text not null check (qualification in ('needs_info','qualified','needs_human')),
  summary text not null check (length(summary) between 1 and 600),
  status text not null default 'new' check (status='new'),
  source text not null default 'test_agent' check (source='test_agent'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key(workspace_id,conversation_id) references public.conversations(workspace_id,id) on delete cascade
);
create index leads_workspace_created_idx on public.leads(workspace_id,created_at desc);
create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  conversation_id uuid not null,
  actor_id uuid not null references auth.users(id),
  idempotency_key uuid not null,
  customer_content text not null check(length(customer_content) between 1 and 2000),
  status text not null default 'processing' check (status in ('processing','completed','failed')),
  response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,actor_id,idempotency_key),
  foreign key(workspace_id,conversation_id) references public.conversations(workspace_id,id) on delete cascade,
  check ((status='completed')=(response is not null))
);
create unique index one_processing_turn_idx on public.agent_runs(conversation_id) where status='processing';
create index agent_runs_conversation_idx on public.agent_runs(workspace_id,conversation_id);
create index agent_runs_actor_idx on public.agent_runs(actor_id);

create function private.is_member(target_workspace_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.workspace_members m where m.workspace_id=target_workspace_id and m.user_id=(select auth.uid()) and m.active);
$$;
revoke all on function private.is_member(uuid) from public,anon,authenticated,service_role;
grant execute on function private.is_member(uuid) to authenticated;

create function private.require_member(target_workspace_id uuid, actor_id uuid, owner_required boolean default false) returns void
language plpgsql security definer set search_path='' as $$
begin
  if actor_id is null or not exists(select 1 from public.workspace_members m where m.workspace_id=target_workspace_id and m.user_id=actor_id and m.active and (not owner_required or m.role='owner')) then
    raise exception using errcode='42501',message='Workspace access denied';
  end if;
end; $$;
create function private.require_backend() returns void
language plpgsql set search_path='' as $$
begin
  if coalesce(current_setting('request.jwt.claims',true),'')='' or coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','')<>'service_role' then
    raise exception using errcode='42501',message='Backend required';
  end if;
end; $$;
revoke all on function private.require_member(uuid,uuid,boolean),private.require_backend() from public,anon,authenticated,service_role;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.agent_settings enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.leads enable row level security;
alter table public.agent_runs enable row level security;
revoke all on public.profiles,public.workspaces,public.workspace_members,public.agent_settings,public.knowledge_items,public.conversations,public.messages,public.leads,public.agent_runs from public,anon,authenticated,service_role;
grant select on public.profiles,public.workspaces,public.workspace_members,public.agent_settings,public.knowledge_items,public.conversations,public.messages,public.leads to authenticated;
create policy profile_read on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy workspace_read on public.workspaces for select to authenticated using((select private.is_member(id)));
create policy membership_read on public.workspace_members for select to authenticated using((select private.is_member(workspace_id)));
create policy settings_read on public.agent_settings for select to authenticated using((select private.is_member(workspace_id)));
create policy knowledge_read on public.knowledge_items for select to authenticated using((select private.is_member(workspace_id)));
create policy conversations_read on public.conversations for select to authenticated using((select private.is_member(workspace_id)));
create policy messages_read on public.messages for select to authenticated using((select private.is_member(workspace_id)));
create policy leads_read on public.leads for select to authenticated using((select private.is_member(workspace_id)));

create function public.create_workspace(business_name text) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); new_id uuid:=gen_random_uuid();
begin
  if actor is null then raise exception using errcode='42501',message='Sign in required'; end if;
  if length(btrim(business_name)) not between 2 and 100 then raise exception using errcode='22023',message='Invalid business name'; end if;
  insert into public.profiles(id) values(actor) on conflict do nothing;
  insert into public.workspaces(id,name,slug) values(new_id,btrim(business_name),'workspace-'||replace(new_id::text,'-',''));
  insert into public.workspace_members(workspace_id,user_id,role) values(new_id,actor,'owner');
  insert into public.agent_settings(workspace_id) values(new_id);
  return new_id;
end; $$;
create function public.rename_workspace(target_workspace_id uuid,business_name text) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_member(target_workspace_id,auth.uid(),true);
  if length(btrim(business_name)) not between 2 and 100 then raise exception using errcode='22023',message='Invalid business name'; end if;
  update public.workspaces set name=btrim(business_name) where id=target_workspace_id;
end; $$;
create function public.save_agent_settings(target_workspace_id uuid,settings jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare selected_goals text[]; fields text[];
begin
  perform private.require_member(target_workspace_id,auth.uid(),true);
  if jsonb_typeof(settings)<>'object' or settings - array['tone','goals','contact_fields','human_handoff_enabled','setup_brief'] <> '{}'::jsonb
     or jsonb_typeof(settings->'goals')<>'array' or jsonb_typeof(settings->'contact_fields')<>'array'
     or settings->'human_handoff_enabled'<>'true'::jsonb or jsonb_typeof(settings->'setup_brief')<>'string' then
    raise exception using errcode='22023',message='Invalid agent settings';
  end if;
  selected_goals:=array(select jsonb_array_elements_text(settings->'goals'));
  fields:=array(select jsonb_array_elements_text(settings->'contact_fields'));
  if cardinality(selected_goals)<>(select count(distinct x) from unnest(selected_goals) x) or cardinality(fields)<>(select count(distinct x) from unnest(fields) x) then
    raise exception using errcode='22023',message='Duplicate choices';
  end if;
  update public.agent_settings set tone=settings->>'tone',goals=selected_goals,contact_fields=fields,human_handoff_enabled=true,setup_brief=settings->>'setup_brief',updated_at=now() where workspace_id=target_workspace_id;
end; $$;
create function public.save_knowledge_item(target_workspace_id uuid,target_item_id uuid,item_type text,item_title text,item_content text,expected_revision integer) returns uuid
language plpgsql security definer set search_path='' as $$
declare result_id uuid;
begin
  perform private.require_member(target_workspace_id,auth.uid(),true);
  if target_item_id is null then
    insert into public.knowledge_items(workspace_id,type,title,content) values(target_workspace_id,item_type,btrim(item_title),btrim(item_content)) returning id into result_id;
  else
    update public.knowledge_items set type=item_type,title=btrim(item_title),content=btrim(item_content),status='draft',embedding=null,revision=revision+1,updated_at=now() where workspace_id=target_workspace_id and id=target_item_id and revision=expected_revision returning id into result_id;
    if result_id is null then raise exception using errcode='40001',message='Knowledge changed or unavailable'; end if;
  end if;
  return result_id;
end; $$;
create function public.change_knowledge_status(target_workspace_id uuid,target_item_id uuid,target_status text) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_member(target_workspace_id,auth.uid(),true);
  if target_status not in ('draft','archived') then raise exception using errcode='22023',message='Publish through the trusted API'; end if;
  update public.knowledge_items set status=target_status,embedding=null,revision=revision+1,updated_at=now() where id=target_item_id and workspace_id=target_workspace_id;
  if not found then raise exception using errcode='42501',message='Knowledge unavailable'; end if;
end; $$;
create function public.delete_knowledge_item(target_workspace_id uuid,target_item_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_member(target_workspace_id,auth.uid(),true);
  delete from public.knowledge_items where id=target_item_id and workspace_id=target_workspace_id;
  if not found then raise exception using errcode='42501',message='Knowledge unavailable'; end if;
end; $$;
create function public.publish_knowledge_item(actor_id uuid,target_workspace_id uuid,target_item_id uuid,expected_revision integer,item_embedding extensions.vector(1536)) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_backend();
  perform private.require_member(target_workspace_id,actor_id,true);
  if item_embedding is null or extensions.vector_norm(item_embedding)=0 then raise exception using errcode='22023',message='Embedding required'; end if;
  update public.knowledge_items set status='published',embedding=item_embedding,revision=revision+1,updated_at=now() where workspace_id=target_workspace_id and id=target_item_id and revision=expected_revision;
  if not found then raise exception using errcode='40001',message='Knowledge changed or unavailable'; end if;
end; $$;
create function public.match_knowledge(target_workspace_id uuid,query_embedding extensions.vector(1536),match_limit integer default 5)
returns table(id uuid,title text,content text,revision integer,similarity double precision)
language sql stable security invoker set search_path='' as $$
  select k.id,k.title,k.content,k.revision,1-(k.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.knowledge_items k where k.workspace_id=target_workspace_id and k.status='published' and k.embedding is not null
    and 1-(k.embedding operator(extensions.<=>) query_embedding)>=0.30
  order by k.embedding operator(extensions.<=>) query_embedding,k.id limit least(greatest(match_limit,1),5);
$$;

create function public.begin_agent_turn(actor_id uuid,target_workspace_id uuid,target_conversation_id uuid,target_idempotency_key uuid,customer_content text)
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
  select * into c from public.conversations co where co.id=conversation_uuid and co.workspace_id=target_workspace_id for update;
  if not found then raise exception using errcode='42501',message='Conversation unavailable'; end if;
  update public.agent_runs a set status='failed',updated_at=now() where a.conversation_id=conversation_uuid and a.status='processing' and a.created_at<now()-interval '2 minutes';
  if exists(select 1 from public.agent_runs a where a.conversation_id=conversation_uuid and a.status='processing') then raise exception using errcode='40001',message='Turn processing'; end if;
  insert into public.agent_runs(workspace_id,conversation_id,actor_id,idempotency_key,customer_content) values(target_workspace_id,conversation_uuid,actor_id,target_idempotency_key,customer_content) returning * into r;
  insert into public.messages(workspace_id,conversation_id,role,content) values(target_workspace_id,conversation_uuid,'customer',customer_content);
  update public.conversations set updated_at=clock_timestamp() where id=conversation_uuid;
  return query select r.id,conversation_uuid,r.status,false,r.response;
end; $$;

create function public.finish_agent_turn(actor_id uuid,target_run_id uuid,assistant_content text,source_references jsonb,request_human boolean,lead_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs; c public.conversations; settings public.agent_settings; lead_id uuid; evidence text; contact_key text; proposed text; effective_human boolean; result jsonb; facts jsonb; prior public.leads; qualification text;
begin
  perform private.require_backend();
  select * into r from public.agent_runs a where a.id=target_run_id;
  if not found or r.actor_id<>actor_id then raise exception using errcode='42501',message='Turn unavailable'; end if;
  perform private.require_member(r.workspace_id,actor_id);
  select * into c from public.conversations co where co.id=r.conversation_id for update;
  select * into r from public.agent_runs a where a.id=target_run_id for update;
  if r.status='completed' then return r.response; end if;
  if r.status<>'processing' then raise exception using errcode='40001',message='Turn not active'; end if;
  if length(btrim(assistant_content)) not between 1 and 2500 or jsonb_typeof(source_references)<>'array' or jsonb_array_length(source_references)>5 then raise exception using errcode='22023',message='Invalid response'; end if;
  select * into settings from public.agent_settings s where s.workspace_id=r.workspace_id;
  -- Publication and scope are rechecked at commit: stale retrieved material does not become durable reply authority.
  if exists(select 1 from jsonb_array_elements(source_references) src where not exists(select 1 from public.knowledge_items k where k.id::text=src->>'id' and k.workspace_id=r.workspace_id and k.status='published' and k.revision::text=src->>'revision')) then raise exception using errcode='40001',message='Knowledge publication changed'; end if;
  effective_human:=request_human or c.ai_mode='paused' or not ('answer_questions'=any(settings.goals));
  if effective_human then update public.conversations set status='needs_human',ai_mode='paused',updated_at=now() where id=c.id; end if;
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
    insert into public.leads(workspace_id,conversation_id,name,email,phone,company,intent,qualification,summary)
      values(r.workspace_id,c.id,facts->>'name',facts->>'email',facts->>'phone',facts->>'company','service_inquiry',qualification,lead_payload->>'summary')
      on conflict(conversation_id) do update set name=excluded.name,email=excluded.email,phone=excluded.phone,company=excluded.company,qualification=excluded.qualification,summary=excluded.summary,updated_at=now() returning id into lead_id;
  else
    select l.id into lead_id from public.leads l where l.conversation_id=c.id;
    if effective_human then update public.leads set qualification='needs_human',updated_at=now() where conversation_id=c.id; end if;
  end if;
  insert into public.messages(workspace_id,conversation_id,role,content,sources) values(r.workspace_id,c.id,'assistant',case when c.ai_mode='paused' or not ('answer_questions'=any(settings.goals)) then 'This test conversation is paused for human assistance. No automatic customer answer has been sent.' else assistant_content end,source_references);
  result:=jsonb_build_object('conversationId',c.id,'reply',case when c.ai_mode='paused' or not ('answer_questions'=any(settings.goals)) then 'This test conversation is paused for human assistance. No automatic customer answer has been sent.' else assistant_content end,'leadId',lead_id,'needsHuman',effective_human,'sources',source_references,'replayed',false);
  update public.agent_runs set status='completed',response=result,updated_at=now() where id=r.id;
  update public.conversations set updated_at=clock_timestamp() where id=c.id;
  return result;
end; $$;
create function public.fail_agent_turn(actor_id uuid,target_run_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs;
begin
  perform private.require_backend();
  select * into r from public.agent_runs a where a.id=target_run_id and a.actor_id=fail_agent_turn.actor_id;
  if not found then raise exception using errcode='42501',message='Turn unavailable'; end if;
  perform private.require_member(r.workspace_id,actor_id);
  update public.agent_runs set status='failed',updated_at=now() where id=r.id and status='processing';
end; $$;
create function public.resume_test_conversation(target_workspace_id uuid,target_conversation_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_member(target_workspace_id,auth.uid());
  update public.conversations set ai_mode='active',status='open',updated_at=now() where id=target_conversation_id and workspace_id=target_workspace_id;
  if not found then raise exception using errcode='42501',message='Conversation unavailable'; end if;
end; $$;

-- PostgreSQL grants EXECUTE to PUBLIC by default; make the allowlist explicit.
revoke all on function public.create_workspace(text),public.rename_workspace(uuid,text),public.save_agent_settings(uuid,jsonb),public.save_knowledge_item(uuid,uuid,text,text,text,integer),public.change_knowledge_status(uuid,uuid,text),public.delete_knowledge_item(uuid,uuid),public.match_knowledge(uuid,extensions.vector,integer),public.publish_knowledge_item(uuid,uuid,uuid,integer,extensions.vector),public.begin_agent_turn(uuid,uuid,uuid,uuid,text),public.finish_agent_turn(uuid,uuid,text,jsonb,boolean,jsonb),public.fail_agent_turn(uuid,uuid),public.resume_test_conversation(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.create_workspace(text),public.rename_workspace(uuid,text),public.save_agent_settings(uuid,jsonb),public.save_knowledge_item(uuid,uuid,text,text,text,integer),public.change_knowledge_status(uuid,uuid,text),public.delete_knowledge_item(uuid,uuid),public.match_knowledge(uuid,extensions.vector,integer),public.resume_test_conversation(uuid,uuid) to authenticated;
grant execute on function public.publish_knowledge_item(uuid,uuid,uuid,integer,extensions.vector),public.begin_agent_turn(uuid,uuid,uuid,uuid,text),public.finish_agent_turn(uuid,uuid,text,jsonb,boolean,jsonb),public.fail_agent_turn(uuid,uuid) to service_role;
