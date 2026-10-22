-- Scope can only narrow Published Knowledge authority.
create function private.agent_can_use_knowledge(target_workspace_id uuid,target_agent_id uuid,target_item_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.agents a join public.knowledge_items k on k.workspace_id=a.workspace_id
    where a.id=target_agent_id and a.workspace_id=target_workspace_id and a.archived_at is null
      and k.id=target_item_id and k.status='published' and
      (a.knowledge_mode='all' or exists(select 1 from public.agent_knowledge_items b where b.workspace_id=a.workspace_id and b.agent_id=a.id and b.knowledge_item_id=k.id)));
$$;
create function public.match_agent_knowledge(target_workspace_id uuid,target_agent_id uuid,query_embedding extensions.vector(1536),match_limit integer default 5)
returns table(id uuid,title text,content text,revision integer,similarity double precision)
language plpgsql stable security definer set search_path='' as $$
begin
  perform private.require_member(target_workspace_id,auth.uid());
  if not exists(select 1 from public.agents a where a.id=target_agent_id and a.workspace_id=target_workspace_id and a.archived_at is null) then
    raise exception using errcode='42501',message='Agent unavailable';
  end if;
  return query select k.id,k.title,k.runtime_content,k.revision,(1-(k.embedding operator(extensions.<=>) query_embedding))::double precision
    from public.knowledge_items k where k.workspace_id=target_workspace_id and k.status='published' and k.embedding is not null
      and private.agent_can_use_knowledge(target_workspace_id,target_agent_id,k.id)
      and 1-(k.embedding operator(extensions.<=>) query_embedding)>=0.30
    order by k.embedding operator(extensions.<=>) query_embedding,k.id limit least(greatest(match_limit,1),5);
end; $$;
revoke all on function private.agent_can_use_knowledge(uuid,uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function public.match_agent_knowledge(uuid,uuid,extensions.vector,integer) from public,anon,authenticated,service_role;
grant execute on function public.match_agent_knowledge(uuid,uuid,extensions.vector,integer) to authenticated;
