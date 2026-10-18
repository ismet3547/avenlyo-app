-- Additive Knowledge workspace model. Existing text/FAQ IDs, content, revisions,
-- publication status and embeddings are retained byte-for-byte.
create table public.knowledge_collections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(btrim(name)) between 2 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id,id)
);
create unique index knowledge_collection_name_idx on public.knowledge_collections(workspace_id,lower(name));
alter table public.knowledge_collections enable row level security;
revoke all on public.knowledge_collections from public,anon,authenticated,service_role;
grant select on public.knowledge_collections to authenticated;
create policy knowledge_collection_read on public.knowledge_collections for select to authenticated
  using ((select private.is_member(workspace_id)));

alter table public.knowledge_items drop constraint knowledge_items_type_check;
alter table public.knowledge_items add constraint knowledge_items_type_check
  check (type in ('text','faq','service','pricing','policy','business_info','custom_note'));
alter table public.knowledge_items add column collection_id uuid,
  add column price_statement text not null default '',
  add column currency text not null default '',
  add column details text not null default '';
alter table public.knowledge_items add constraint knowledge_collection_workspace_fk
  foreign key(workspace_id,collection_id) references public.knowledge_collections(workspace_id,id);
create index knowledge_collection_fk_idx on public.knowledge_items(workspace_id,collection_id);
alter table public.knowledge_items drop constraint knowledge_items_content_check;
alter table public.knowledge_items add constraint knowledge_items_content_check
  check (length(btrim(content)) between (case when type='pricing' then 0 else 3 end) and 6000);
alter table public.knowledge_items add constraint knowledge_structured_fields_check check (
  length(price_statement)<=240 and currency ~ '^([A-Z]{3})?$' and length(details)<=2000
  and (case when type='pricing' then length(btrim(price_statement))>0 else price_statement='' and currency='' end)
  and (type='service' or details='')
  and (type<>'service' or length(content)<=4000)
);
-- A single database-owned representation is used by both embeddings and retrieval.
-- Collections are deliberately absent: they organize content, never confer authority.
alter table public.knowledge_items add column runtime_content text generated always as (
  case when type='pricing' then 'Price: ' || price_statement ||
    case when currency<>'' then E'\nCurrency: ' || currency else '' end ||
    case when content<>'' then E'\nConditions: ' || content else '' end
  when type='service' then content || case when details<>'' then E'\nDetails and limits: ' || details else '' end
  else content end
) stored;

create function public.save_knowledge_collection(target_workspace_id uuid,target_collection_id uuid,collection_name text) returns uuid
language plpgsql security definer set search_path='' as $$
declare result_id uuid;
begin
  perform private.require_member(target_workspace_id,auth.uid(),true);
  if target_collection_id is null then
    insert into public.knowledge_collections(workspace_id,name) values(target_workspace_id,btrim(collection_name)) returning id into result_id;
  else
    update public.knowledge_collections set name=btrim(collection_name),updated_at=now()
      where workspace_id=target_workspace_id and id=target_collection_id returning id into result_id;
    if result_id is null then raise exception using errcode='42501',message='Collection unavailable'; end if;
  end if;
  return result_id;
end; $$;

create function public.save_business_knowledge(
  target_workspace_id uuid,target_item_id uuid,item_type text,item_title text,item_content text,expected_revision integer,
  item_price_statement text,item_currency text,item_details text,item_collection_id uuid
) returns uuid
language plpgsql security definer set search_path='' as $$
declare result_id uuid;
begin
  perform private.require_member(target_workspace_id,auth.uid(),true);
  if item_collection_id is not null and not exists(select 1 from public.knowledge_collections where workspace_id=target_workspace_id and id=item_collection_id) then
    raise exception using errcode='42501',message='Collection unavailable';
  end if;
  if target_item_id is null then
    insert into public.knowledge_items(workspace_id,type,title,content,price_statement,currency,details,collection_id)
    values(target_workspace_id,case when item_type='text' then 'custom_note' else item_type end,btrim(item_title),btrim(item_content),btrim(item_price_statement),btrim(item_currency),btrim(item_details),item_collection_id)
    returning id into result_id;
  else
    update public.knowledge_items set type=case when item_type='text' then 'custom_note' else item_type end,
      title=btrim(item_title),content=btrim(item_content),price_statement=btrim(item_price_statement),currency=btrim(item_currency),details=btrim(item_details),collection_id=item_collection_id,
      status='draft',embedding=null,revision=revision+1,updated_at=now()
      where workspace_id=target_workspace_id and id=target_item_id and revision=expected_revision returning id into result_id;
    if result_id is null then raise exception using errcode='40001',message='Knowledge changed or unavailable'; end if;
  end if;
  return result_id;
end; $$;
-- Keep the original six-argument RPC for older clients and existing integrations.
-- An older edit retains organization but cannot silently erase structured fields.
create or replace function public.save_knowledge_item(target_workspace_id uuid,target_item_id uuid,item_type text,item_title text,item_content text,expected_revision integer) returns uuid
language plpgsql security definer set search_path='' as $$
declare existing public.knowledge_items;
begin
  perform private.require_member(target_workspace_id,auth.uid(),true);
  if target_item_id is not null then
    select * into existing from public.knowledge_items where workspace_id=target_workspace_id and id=target_item_id;
    if existing.type not in ('text','faq','custom_note') then raise exception using errcode='22023',message='Use the structured Knowledge editor'; end if;
  end if;
  return public.save_business_knowledge(target_workspace_id,target_item_id,item_type,item_title,item_content,expected_revision,'','','',existing.collection_id);
end; $$;

create or replace function public.match_knowledge(target_workspace_id uuid,query_embedding extensions.vector(1536),match_limit integer default 5)
returns table(id uuid,title text,content text,revision integer,similarity double precision)
language sql stable security invoker set search_path='' as $$
  select k.id,k.title,k.runtime_content,k.revision,1-(k.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.knowledge_items k where k.workspace_id=target_workspace_id and k.status='published' and k.embedding is not null
    and 1-(k.embedding operator(extensions.<=>) query_embedding)>=0.30
  order by k.embedding operator(extensions.<=>) query_embedding,k.id limit least(greatest(match_limit,1),5);
$$;
create or replace function public.match_channel_knowledge(target_run_id uuid,query_embedding extensions.vector(1536))
returns table(id uuid,title text,content text,revision integer,similarity double precision)
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs;
begin
  perform private.require_backend(); r:=private.require_channel_run(target_run_id);
  return query select k.id,k.title,k.runtime_content,k.revision,(1-(k.embedding operator(extensions.<=>) query_embedding))::double precision
    from public.knowledge_items k where k.workspace_id=r.workspace_id and k.status='published' and k.embedding is not null
    and 1-(k.embedding operator(extensions.<=>) query_embedding)>=0.30
    order by k.embedding operator(extensions.<=>) query_embedding,k.id limit 5;
end; $$;
revoke all on function public.save_knowledge_collection(uuid,uuid,text),public.save_business_knowledge(uuid,uuid,text,text,text,integer,text,text,text,uuid) from public,anon,authenticated,service_role;
grant execute on function public.save_knowledge_collection(uuid,uuid,text),public.save_business_knowledge(uuid,uuid,text,text,text,integer,text,text,text,uuid) to authenticated;
