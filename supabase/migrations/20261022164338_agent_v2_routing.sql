-- Existing connections and history keep their original default Agent.
alter table public.channel_connections add column agent_id uuid;
alter table public.conversations add column agent_id uuid;
update public.channel_connections c set agent_id=a.id from public.agents a where a.workspace_id=c.workspace_id and a.is_default;
update public.conversations c set agent_id=a.id from public.agents a where a.workspace_id=c.workspace_id and a.is_default;
alter table public.channel_connections alter column agent_id set not null;
alter table public.conversations alter column agent_id set not null;
alter table public.channel_connections add constraint channel_agent_scope foreign key(workspace_id,agent_id) references public.agents(workspace_id,id);
alter table public.conversations add constraint conversation_agent_scope foreign key(workspace_id,agent_id) references public.agents(workspace_id,id);
create index channel_agent_idx on public.channel_connections(workspace_id,agent_id);
create index conversation_agent_idx on public.conversations(workspace_id,agent_id);

create function private.channel_agent_assignment() returns trigger
language plpgsql security definer set search_path='' as $$
declare chosen uuid; choices integer;
begin
  if new.agent_id is null then
    -- Legacy setup updates retain their deliberate existing routing.
    select agent_id into chosen from public.channel_connections where workspace_id=new.workspace_id and channel=new.channel;
    if chosen is null then
      select count(*),min(id::text)::uuid into choices,chosen from public.agents where workspace_id=new.workspace_id and archived_at is null;
      if choices<>1 then raise exception using errcode='22023',message='Choose an agent for this channel'; end if;
    end if;
    new.agent_id:=chosen;
  end if;
  perform private.require_agent(new.workspace_id,new.agent_id);
  return new;
end; $$;
create trigger channel_agent_assignment before insert or update of agent_id,workspace_id on public.channel_connections for each row execute function private.channel_agent_assignment();
create function private.conversation_agent_assignment() returns trigger
language plpgsql security definer set search_path='' as $$
declare chosen uuid;
begin
  if tg_op='UPDATE' then
    if new.agent_id is distinct from old.agent_id or new.workspace_id is distinct from old.workspace_id then
      raise exception using errcode='22023',message='Conversation agent is immutable';
    end if;
    return new;
  end if;
  if new.channel='test_agent' then
    if new.agent_id is null then select id into new.agent_id from public.agents where workspace_id=new.workspace_id and is_default; end if;
  else
    select agent_id into chosen from public.channel_connections where id=new.channel_connection_id and workspace_id=new.workspace_id for share;
    if chosen is null or (new.agent_id is not null and new.agent_id<>chosen) then raise exception using errcode='42501',message='Channel agent unavailable'; end if;
    new.agent_id:=chosen;
  end if;
  perform private.require_agent(new.workspace_id,new.agent_id);
  return new;
end; $$;
create trigger conversation_agent_assignment before insert or update of agent_id,workspace_id on public.conversations for each row execute function private.conversation_agent_assignment();
create function private.guard_agent_archival() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.archived_at is not null and old.archived_at is null and exists(select 1 from public.channel_connections where agent_id=new.id) then
    raise exception using errcode='22023',message='Move this agent''s channels to another agent before removing it.';
  end if;
  return new;
end; $$;
create trigger guard_agent_archival before update of archived_at on public.agents for each row execute function private.guard_agent_archival();
create function public.assign_channel_agent(target_workspace_id uuid,target_connection_id uuid,target_agent_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_member(target_workspace_id,auth.uid(),true);
  perform private.require_agent(target_workspace_id,target_agent_id);
  update public.channel_connections set agent_id=target_agent_id,updated_at=now() where id=target_connection_id and workspace_id=target_workspace_id;
  if not found then raise exception using errcode='42501',message='Channel unavailable'; end if;
end; $$;

create function public.configure_website_channel_for_agent(target_workspace_id uuid,channel_enabled boolean,origins text[],target_agent_id uuid) returns uuid
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
  insert into public.channel_connections(workspace_id,channel,enabled,approved_origins,status,agent_id)
    values(target_workspace_id,'website_chat',channel_enabled,origins,'ready',target_agent_id)
    on conflict(workspace_id,channel) do update set enabled=excluded.enabled,approved_origins=excluded.approved_origins,agent_id=excluded.agent_id,updated_at=now()
    returning id into connection;
  return connection;
end; $$;
create or replace function public.configure_website_channel(target_workspace_id uuid,channel_enabled boolean,origins text[]) returns uuid
language plpgsql security definer set search_path='' as $$
begin
  return public.configure_website_channel_for_agent(target_workspace_id,channel_enabled,origins,null);
end; $$;

create function public.provision_instagram_channel_for_agent(target_workspace_id uuid,expected_workspace_name text,provider_account_id text,provider_username text,provider_token text,provider_version text,verified_app_id text,target_agent_id uuid) returns uuid
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
  if exists(select 1 from public.channel_connections ch where ch.channel='instagram' and ch.provider_account_id=provision_instagram_channel_for_agent.provider_account_id and ch.workspace_id<>w.id) then raise exception using errcode='42501',message='Provider account already belongs to another workspace'; end if;
  if c.id is null then
    insert into public.channel_connections(workspace_id,channel,status,provider_account_id,provider_username,provider_app_id,api_version,agent_id)
      values(w.id,'instagram','disconnected',provider_account_id,provider_username,verified_app_id,provider_version,target_agent_id) returning id into connection_uuid;
  else connection_uuid:=c.id;
    if target_agent_id is not null then
      perform private.require_agent(w.id,target_agent_id);
      update public.channel_connections set agent_id=target_agent_id where id=c.id;
    end if;
  end if;
  select secret_id into secret_uuid from private.channel_credentials where connection_id=connection_uuid;
  if secret_uuid is null then
    select vault.create_secret(provider_token,'instagram_'||connection_uuid::text,'Avenlyo managed Instagram credential') into secret_uuid;
    insert into private.channel_credentials(connection_id,secret_id) values(connection_uuid,secret_uuid);
  else perform vault.update_secret(secret_uuid,provider_token); end if;
  update public.channel_connections set enabled=true,status='connected',provider_username=provision_instagram_channel_for_agent.provider_username,provider_app_id=verified_app_id,api_version=provider_version,verified_at=now(),updated_at=now() where id=connection_uuid;
  return connection_uuid;
end; $$;
create or replace function public.provision_instagram_channel(target_workspace_id uuid,expected_workspace_name text,provider_account_id text,provider_username text,provider_token text,provider_version text,verified_app_id text) returns uuid
language plpgsql security definer set search_path='' as $$
begin
  return public.provision_instagram_channel_for_agent(target_workspace_id,expected_workspace_name,provider_account_id,provider_username,provider_token,provider_version,verified_app_id,null);
end; $$;

create function public.begin_agent_test_turn(actor_id uuid,target_workspace_id uuid,target_conversation_id uuid,target_idempotency_key uuid,customer_content text,target_agent_id uuid)
returns table(run_id uuid,conversation_id uuid,state text,existing boolean,response jsonb)
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs; c public.conversations; conversation_uuid uuid;
begin
  perform private.require_backend();
  perform private.require_member(target_workspace_id,actor_id);
  if target_idempotency_key is null or length(btrim(customer_content)) not between 1 and 2000 then raise exception using errcode='22023',message='Invalid turn'; end if;
  perform pg_advisory_xact_lock(hashtextextended(target_workspace_id::text||actor_id::text||target_idempotency_key::text,0));
  select * into r from public.agent_runs a where a.workspace_id=target_workspace_id and a.actor_id=begin_agent_test_turn.actor_id and a.idempotency_key=target_idempotency_key;
  if found then
    if target_agent_id is not null and not exists(select 1 from public.conversations co where co.id=r.conversation_id and co.agent_id=target_agent_id) then raise exception using errcode='22023',message='Idempotency conflict'; end if;
    if r.customer_content<>customer_content or (target_conversation_id is not null and r.conversation_id<>target_conversation_id) then raise exception using errcode='22023',message='Idempotency conflict'; end if;
    return query select r.id,r.conversation_id,r.status,true,r.response; return;
  end if;
  if target_conversation_id is null then
    insert into public.conversations(workspace_id,created_by,agent_id) values(target_workspace_id,actor_id,target_agent_id) returning id into conversation_uuid;
  else
    conversation_uuid:=target_conversation_id;
  end if;
  select * into c from public.conversations co where co.id=conversation_uuid and co.workspace_id=target_workspace_id and co.channel='test_agent' for update;
  if not found or (target_agent_id is not null and c.agent_id<>target_agent_id) then raise exception using errcode='42501',message='Conversation unavailable'; end if;
  perform private.require_agent(c.workspace_id,c.agent_id);
  update public.agent_runs a set status='failed',updated_at=now() where a.conversation_id=conversation_uuid and a.status='processing' and a.created_at<now()-interval '2 minutes';
  if exists(select 1 from public.agent_runs a where a.conversation_id=conversation_uuid and a.status='processing') then raise exception using errcode='40001',message='Turn processing'; end if;
  insert into public.agent_runs(workspace_id,conversation_id,actor_id,idempotency_key,customer_content) values(target_workspace_id,conversation_uuid,actor_id,target_idempotency_key,customer_content) returning * into r;
  insert into public.messages(workspace_id,conversation_id,role,content) values(target_workspace_id,conversation_uuid,'customer',customer_content);
  update public.conversations set updated_at=clock_timestamp() where id=conversation_uuid;
  return query select r.id,conversation_uuid,r.status,false,r.response;
end; $$;
create or replace function public.begin_agent_turn(actor_id uuid,target_workspace_id uuid,target_conversation_id uuid,target_idempotency_key uuid,customer_content text)
returns table(run_id uuid,conversation_id uuid,state text,existing boolean,response jsonb)
language plpgsql security definer set search_path='' as $$
begin
  return query select * from public.begin_agent_test_turn(actor_id,target_workspace_id,target_conversation_id,target_idempotency_key,customer_content,null);
end; $$;

create or replace function private.require_channel_run(target_run_id uuid) returns public.agent_runs
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
  perform private.require_agent(c.workspace_id,c.agent_id);
  return r;
end; $$;

create or replace function public.channel_runtime_context(target_run_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs; c public.conversations; business_name text; settings jsonb; history jsonb;
begin
  perform private.require_backend(); r:=private.require_channel_run(target_run_id);
  select * into c from public.conversations where id=r.conversation_id;
  select name into business_name from public.workspaces where id=r.workspace_id;
  select jsonb_build_object('tone',s.tone,'goals',s.goals,'contact_fields',s.contact_fields,'human_handoff_enabled',s.human_handoff_enabled) into settings from public.agents s where s.workspace_id=r.workspace_id and s.id=c.agent_id and s.archived_at is null;
  select coalesce(jsonb_agg(jsonb_build_object('role',m.role,'content',m.content) order by m.created_at,m.id),'[]'::jsonb) into history from (select role,content,created_at,id from public.messages where conversation_id=c.id order by created_at desc,id desc limit 24) m;
  return jsonb_build_object('businessName',business_name,'settings',settings,'aiMode',c.ai_mode,'channel',c.channel,'history',history,'content',r.customer_content,'languages',(select jsonb_build_object('primary',a.primary_language,'additional',a.additional_languages,'legacy',a.language_policy='legacy_multilingual') from public.agents a where a.id=c.agent_id and a.workspace_id=c.workspace_id),'replyWindowOpen',c.channel<>'instagram' or c.last_customer_at>=now()-interval '24 hours');
end; $$;

create or replace function public.match_channel_knowledge(target_run_id uuid,query_embedding extensions.vector(1536))
returns table(id uuid,title text,content text,revision integer,similarity double precision)
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs;
begin
  perform private.require_backend(); r:=private.require_channel_run(target_run_id);
  return query select k.id,k.title,k.runtime_content,k.revision,(1-(k.embedding operator(extensions.<=>) query_embedding))::double precision
    from public.knowledge_items k where k.workspace_id=r.workspace_id and k.status='published' and k.embedding is not null
    and private.agent_can_use_knowledge(r.workspace_id,(select agent_id from public.conversations where id=r.conversation_id),k.id)
    and 1-(k.embedding operator(extensions.<=>) query_embedding)>=0.30
    order by k.embedding operator(extensions.<=>) query_embedding,k.id limit 5;
end; $$;


create or replace function private.commit_runtime_turn(target_run_id uuid,assistant_content text,source_references jsonb,request_human boolean,lead_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs; c public.conversations; settings public.agents; lead_id uuid; evidence text; contact_key text; proposed text; effective_human boolean; result jsonb; facts jsonb; prior public.leads; qualification text; reply_message_id uuid; durable_reply text; suppress_reply boolean; new_handoff boolean;
begin
  select * into r from public.agent_runs where id=target_run_id;
  select * into c from public.conversations where id=r.conversation_id for update;
  select * into r from public.agent_runs where id=target_run_id for update;
  if r.status='completed' then return r.response; end if;
  if r.status<>'processing' then raise exception using errcode='40001',message='Turn not active'; end if;
  if assistant_content is null or length(btrim(assistant_content)) not between 1 and 2500 or source_references is null or jsonb_typeof(source_references)<>'array' or jsonb_array_length(source_references)>5 then raise exception using errcode='22023',message='Invalid response'; end if;
  settings:=private.require_agent(r.workspace_id,c.agent_id);
  suppress_reply:=c.channel<>'test_agent' and (c.ai_mode='paused' or c.state_version is distinct from r.state_version);
  if c.channel<>'test_agent' and c.state_version is distinct from r.state_version then
    request_human:=false; lead_payload:=null; source_references:='[]'::jsonb;
  end if;
  if exists(select 1 from jsonb_array_elements(source_references) src where not exists(select 1 from public.knowledge_items k where k.id::text=src->>'id' and k.workspace_id=r.workspace_id and k.status='published' and k.revision::text=src->>'revision' and private.agent_can_use_knowledge(r.workspace_id,c.agent_id,k.id))) then raise exception using errcode='40001',message='Knowledge publication changed'; end if;
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
revoke all on function private.channel_agent_assignment(),private.conversation_agent_assignment(),private.guard_agent_archival() from public,anon,authenticated,service_role;
revoke all on function public.assign_channel_agent(uuid,uuid,uuid),public.configure_website_channel_for_agent(uuid,boolean,text[],uuid),public.provision_instagram_channel_for_agent(uuid,text,text,text,text,text,text,uuid),public.begin_agent_test_turn(uuid,uuid,uuid,uuid,text,uuid) from public,anon,authenticated,service_role;
grant execute on function public.assign_channel_agent(uuid,uuid,uuid),public.configure_website_channel_for_agent(uuid,boolean,text[],uuid) to authenticated;
grant execute on function public.provision_instagram_channel_for_agent(uuid,text,text,text,text,text,text,uuid),public.begin_agent_test_turn(uuid,uuid,uuid,uuid,text,uuid) to service_role;

-- Managed provisioning can validate an explicit routing target before any
-- provider operation. The verified save path revalidates it transactionally.
create function public.inspect_channel_agent(target_workspace_id uuid,target_channel text,target_agent_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare chosen uuid:=target_agent_id; choices integer;
begin
  perform private.require_backend();
  if target_channel not in ('website_chat','instagram') or target_channel is null then raise exception using errcode='22023',message='Invalid channel'; end if;
  if chosen is null then
    select agent_id into chosen from public.channel_connections where workspace_id=target_workspace_id and channel=target_channel;
    if chosen is null then
      select count(*),min(id::text)::uuid into choices,chosen from public.agents where workspace_id=target_workspace_id and archived_at is null;
      if choices<>1 then raise exception using errcode='22023',message='Choose an agent for this channel'; end if;
    end if;
  end if;
  perform private.require_agent(target_workspace_id,chosen);
  return chosen;
end; $$;
revoke all on function public.inspect_channel_agent(uuid,text,uuid) from public,anon,authenticated,service_role;
grant execute on function public.inspect_channel_agent(uuid,text,uuid) to service_role;
