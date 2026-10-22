-- Agent V2 foundation. Existing migrations, settings and completion stay intact.
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check(length(btrim(name)) between 2 and 80),
  is_default boolean not null default false,
  setup_brief text not null default '' check(length(setup_brief)<=1500),
  tone text not null default 'professional' check(tone in ('professional','warm','concise')),
  goals text[] not null default array['answer_questions','identify_interest','qualify_inquiries','collect_contact','human_handoff'],
  contact_fields text[] not null default array['name','email'],
  human_handoff_enabled boolean not null default true check(human_handoff_enabled),
  primary_language text not null default 'en' check(primary_language ~ '^[a-z]{2,3}$'),
  additional_languages text[] not null default '{}',
  language_policy text not null default 'configured' check(language_policy in ('configured','legacy_multilingual')),
  knowledge_mode text not null default 'all' check(knowledge_mode in ('all','selected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(workspace_id,id),
  check(goals <@ array['answer_questions','identify_interest','qualify_inquiries','collect_contact','human_handoff'] and 'human_handoff'=any(goals)),
  check(contact_fields <@ array['name','email','phone','company']),
  check(cardinality(contact_fields)=0 or 'collect_contact'=any(goals)),
  check(not primary_language=any(additional_languages)),
  check(cardinality(additional_languages)<=43),
  check(not is_default or archived_at is null)
);
create unique index agents_one_default_idx on public.agents(workspace_id) where is_default;
create index agents_workspace_idx on public.agents(workspace_id,created_at,id);
create table public.agent_knowledge_items (
  workspace_id uuid not null,
  agent_id uuid not null,
  knowledge_item_id uuid not null,
  primary key(agent_id,knowledge_item_id),
  foreign key(workspace_id,agent_id) references public.agents(workspace_id,id) on delete cascade,
  foreign key(workspace_id,knowledge_item_id) references public.knowledge_items(workspace_id,id) on delete cascade
);
create index agent_knowledge_item_fk_idx on public.agent_knowledge_items(workspace_id,knowledge_item_id);
create index agent_knowledge_agent_fk_idx on public.agent_knowledge_items(workspace_id,agent_id);
alter table public.agents enable row level security;
alter table public.agent_knowledge_items enable row level security;
revoke all on public.agents,public.agent_knowledge_items from public,anon,authenticated,service_role;
grant select on public.agents,public.agent_knowledge_items to authenticated;
create policy agents_read on public.agents for select to authenticated using((select private.is_member(workspace_id)));
create policy agent_knowledge_read on public.agent_knowledge_items for select to authenticated using((select private.is_member(workspace_id)));

insert into public.agents(workspace_id,name,is_default,setup_brief,tone,goals,contact_fields,human_handoff_enabled,language_policy,created_at,updated_at)
select s.workspace_id,'Front Office',true,s.setup_brief,s.tone,s.goals,s.contact_fields,s.human_handoff_enabled,'legacy_multilingual',w.created_at,s.updated_at
from public.agent_settings s join public.workspaces w on w.id=s.workspace_id;

-- Compatibility for focused onboarding and older settings clients. Change guards
-- prevent recursion and preserve the original configuration timestamp on backfill.
create function private.sync_default_agent() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into public.agents(workspace_id,name,is_default,setup_brief,tone,goals,contact_fields,human_handoff_enabled,updated_at)
  values(new.workspace_id,'Front Office',true,new.setup_brief,new.tone,new.goals,new.contact_fields,true,new.updated_at)
  on conflict(workspace_id) where is_default do update set setup_brief=excluded.setup_brief,tone=excluded.tone,goals=excluded.goals,contact_fields=excluded.contact_fields,updated_at=excluded.updated_at
  where (agents.setup_brief,agents.tone,agents.goals,agents.contact_fields,agents.updated_at) is distinct from
    (excluded.setup_brief,excluded.tone,excluded.goals,excluded.contact_fields,excluded.updated_at);
  return new;
end; $$;
create trigger sync_default_agent after insert or update on public.agent_settings for each row execute function private.sync_default_agent();
create function private.sync_legacy_agent_settings() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.is_default then
    update public.agent_settings set setup_brief=new.setup_brief,tone=new.tone,goals=new.goals,contact_fields=new.contact_fields,updated_at=new.updated_at
    where workspace_id=new.workspace_id and (setup_brief,tone,goals,contact_fields,updated_at) is distinct from
      (new.setup_brief,new.tone,new.goals,new.contact_fields,new.updated_at);
  end if;
  return new;
end; $$;
create trigger sync_legacy_agent_settings after update of setup_brief,tone,goals,contact_fields on public.agents for each row execute function private.sync_legacy_agent_settings();

create function private.require_agent(target_workspace_id uuid,target_agent_id uuid) returns public.agents
language plpgsql security definer set search_path='' as $$
declare a public.agents;
begin
  select * into a from public.agents where workspace_id=target_workspace_id and id=target_agent_id and archived_at is null for share;
  if not found then raise exception using errcode='42501',message='Agent unavailable'; end if;
  return a;
end; $$;
create function private.validate_agent_languages(primary_code text,additional_codes text[]) returns void
language plpgsql set search_path='' as $$
declare supported text[]:=array['en','tr','de','fr','es','it','pt','nl','ar','ru','uk','pl','ro','el','bg','sv','da','no','fi','cs','hu','he','hi','bn','ur','fa','zh','ja','ko','id','ms','vi','th','sw','af','sr','hr','sk','sl','lt','lv','et','ca','fil'];
begin
  if primary_code is null or not primary_code=any(supported) or additional_codes is null or
    not additional_codes <@ supported or cardinality(additional_codes)>43 or
    array_position(additional_codes,null) is not null or primary_code=any(additional_codes) or
    cardinality(additional_codes)<>(select count(distinct x) from unnest(additional_codes) x) then
    raise exception using errcode='22023',message='Invalid language selection';
  end if;
end; $$;
create function public.create_agent(target_workspace_id uuid,agent_name text,role_brief text,primary_code text) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
  perform private.require_member(target_workspace_id,auth.uid(),true);
  perform private.validate_agent_languages(primary_code,'{}');
  if role_brief is null or length(btrim(role_brief)) not between 3 and 1500 then raise exception using errcode='22023',message='Describe the agent role'; end if;
  insert into public.agents(workspace_id,name,setup_brief,primary_language) values(target_workspace_id,btrim(agent_name),btrim(role_brief),primary_code) returning id into result;
  return result;
end; $$;
create function public.save_agent(target_workspace_id uuid,target_agent_id uuid,agent_name text,settings jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare selected_goals text[]; fields text[];
begin
  perform private.require_member(target_workspace_id,auth.uid(),true);
  perform private.require_agent(target_workspace_id,target_agent_id);
  if settings is null or jsonb_typeof(settings)<>'object' or settings-array['tone','goals','contact_fields','human_handoff_enabled','setup_brief']<>'{}'::jsonb or
    not settings ?& array['tone','goals','contact_fields','human_handoff_enabled','setup_brief'] or
    jsonb_typeof(settings->'goals')<>'array' or jsonb_typeof(settings->'contact_fields')<>'array' or
    settings->'human_handoff_enabled'<>'true'::jsonb or jsonb_typeof(settings->'setup_brief')<>'string' then
    raise exception using errcode='22023',message='Invalid agent settings';
  end if;
  selected_goals:=array(select jsonb_array_elements_text(settings->'goals'));
  fields:=array(select jsonb_array_elements_text(settings->'contact_fields'));
  if array_position(selected_goals,null) is not null or array_position(fields,null) is not null or
    cardinality(selected_goals)<>(select count(distinct x) from unnest(selected_goals) x) or cardinality(fields)<>(select count(distinct x) from unnest(fields) x) then
    raise exception using errcode='22023',message='Duplicate or invalid choices';
  end if;
  update public.agents set name=btrim(agent_name),setup_brief=settings->>'setup_brief',tone=settings->>'tone',goals=selected_goals,contact_fields=fields,updated_at=now()
  where id=target_agent_id and workspace_id=target_workspace_id and archived_at is null;
end; $$;
create function public.set_agent_languages(target_workspace_id uuid,target_agent_id uuid,primary_code text,additional_codes text[]) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_member(target_workspace_id,auth.uid(),true);
  perform private.require_agent(target_workspace_id,target_agent_id);
  perform private.validate_agent_languages(primary_code,additional_codes);
  update public.agents set primary_language=primary_code,additional_languages=additional_codes,language_policy='configured',updated_at=now() where id=target_agent_id and workspace_id=target_workspace_id;
end; $$;
create function public.set_agent_knowledge_scope(target_workspace_id uuid,target_agent_id uuid,scope_mode text,item_ids uuid[]) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform private.require_member(target_workspace_id,auth.uid(),true);
  perform private.require_agent(target_workspace_id,target_agent_id);
  -- Serialize replacement of scope and bindings with other owner mutations.
  perform 1 from public.agents where id=target_agent_id for update;
  if scope_mode is null or scope_mode not in ('all','selected') or item_ids is null or cardinality(item_ids)>500 or
    cardinality(item_ids)<>(select count(distinct x) from unnest(item_ids) x) or
    (scope_mode='all' and cardinality(item_ids)>0) or exists(select 1 from unnest(item_ids) x where x is null or not exists(select 1 from public.knowledge_items k where k.id=x and k.workspace_id=target_workspace_id)) then
    raise exception using errcode='22023',message='Invalid knowledge selection';
  end if;
  delete from public.agent_knowledge_items where agent_id=target_agent_id;
  insert into public.agent_knowledge_items(workspace_id,agent_id,knowledge_item_id) select target_workspace_id,target_agent_id,x from unnest(item_ids) x;
  update public.agents set knowledge_mode=scope_mode,updated_at=now() where id=target_agent_id;
end; $$;
create function public.archive_agent(target_workspace_id uuid,target_agent_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare a public.agents;
begin
  perform private.require_member(target_workspace_id,auth.uid(),true);
  a:=private.require_agent(target_workspace_id,target_agent_id);
  if a.is_default then raise exception using errcode='22023',message='The initial agent is required for workspace setup'; end if;
  update public.agents set archived_at=now(),updated_at=now() where id=a.id;
end; $$;
revoke all on function private.sync_default_agent(),private.sync_legacy_agent_settings(),private.require_agent(uuid,uuid),private.validate_agent_languages(text,text[]) from public,anon,authenticated,service_role;
revoke all on function public.create_agent(uuid,text,text,text),public.save_agent(uuid,uuid,text,jsonb),public.set_agent_languages(uuid,uuid,text,text[]),public.set_agent_knowledge_scope(uuid,uuid,text,uuid[]),public.archive_agent(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.create_agent(uuid,text,text,text),public.save_agent(uuid,uuid,text,jsonb),public.set_agent_languages(uuid,uuid,text,text[]),public.set_agent_knowledge_scope(uuid,uuid,text,uuid[]),public.archive_agent(uuid,uuid) to authenticated;
