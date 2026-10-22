-- Completion and channel activation are independent milestones. Skipping the
-- optional channel step must never manufacture an inbound connection.
alter table public.workspaces add column first_channel_activated_at timestamptz;

-- Before this migration, persisted onboarding completion required a real active
-- channel. Preserve that evidence even if the channel is currently offline.
with evidence as (
  select id as workspace_id,onboarding_completed_at as activated_at
  from public.workspaces where onboarding_completed_at is not null
  union all
  select workspace_id,coalesce(verified_at,last_activity_at,now())
  from public.channel_connections where verified_at is not null or last_activity_at is not null or
    (enabled and ((channel='website_chat' and status in ('ready','connected') and cardinality(approved_origins)>0)
      or (channel='instagram' and status='connected' and verified_at is not null)))
), first_activation as (
  select workspace_id,min(activated_at) as activated_at from evidence group by workspace_id
)
update public.workspaces w set first_channel_activated_at=a.activated_at
from first_activation a where w.id=a.workspace_id;

-- Observe the existing secured setup paths; do not alter their validation,
-- permissions, enabled flags, credentials or provider verification.
create function private.record_channel_activation() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.enabled and
    ((new.channel='website_chat' and new.status in ('ready','connected') and cardinality(new.approved_origins)>0)
      or (new.channel='instagram' and new.status='connected' and new.verified_at is not null)) then
    update public.workspaces set first_channel_activated_at=now()
      where id=new.workspace_id and first_channel_activated_at is null;
  end if;
  return new;
end; $$;
revoke all on function private.record_channel_activation() from public,anon,authenticated,service_role;
create trigger record_channel_activation after insert or update of enabled,status,approved_origins,verified_at
  on public.channel_connections for each row execute function private.record_channel_activation();

create function public.complete_onboarding_without_channel(target_workspace_id uuid) returns timestamptz
language plpgsql security definer set search_path='' as $$
declare progress jsonb; completed timestamptz;
begin
  -- Reuse membership validation, the workspace row lock and the exact three
  -- required milestones, including persisted evidence of a successful test.
  progress:=public.sync_onboarding(target_workspace_id);
  completed:=(progress->>'completedAt')::timestamptz;
  if completed is not null then return completed; end if;
  if not (progress->>'configured')::boolean or not (progress->>'published')::boolean or not (progress->>'tested')::boolean then
    raise exception using errcode='22023',message='Complete agent, published knowledge and a successful real test first';
  end if;
  update public.workspaces set onboarding_completed_at=now()
    where id=target_workspace_id returning onboarding_completed_at into completed;
  return completed;
end; $$;
revoke all on function public.complete_onboarding_without_channel(uuid) from public,anon,authenticated,service_role;
grant execute on function public.complete_onboarding_without_channel(uuid) to authenticated;
