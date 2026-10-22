-- Qualify conversation identity against PL/pgSQL output column names.
create or replace function public.match_channel_knowledge(target_run_id uuid,query_embedding extensions.vector(1536))
returns table(id uuid,title text,content text,revision integer,similarity double precision)
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs;
begin
  perform private.require_backend(); r:=private.require_channel_run(target_run_id);
  return query select k.id,k.title,k.runtime_content,k.revision,(1-(k.embedding operator(extensions.<=>) query_embedding))::double precision
    from public.knowledge_items k where k.workspace_id=r.workspace_id and k.status='published' and k.embedding is not null
    and private.agent_can_use_knowledge(r.workspace_id,(select co.agent_id from public.conversations co where co.id=r.conversation_id),k.id)
    and 1-(k.embedding operator(extensions.<=>) query_embedding)>=0.30
    order by k.embedding operator(extensions.<=>) query_embedding,k.id limit 5;
end; $$;
