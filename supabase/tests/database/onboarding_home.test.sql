begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();
select extensions.ok(not has_function_privilege('anon','public.sync_onboarding(uuid)','EXECUTE'),'Anonymous setup reads/writes denied');
select extensions.ok(not has_function_privilege('anon','public.home_snapshot(uuid)','EXECUTE'),'Anonymous Home reads denied');
select extensions.ok(not has_table_privilege('authenticated','public.workspaces','UPDATE'),'Clients cannot forge the activation milestone');
insert into auth.users(id,aud,role,email) values
 ('ae111111-1111-4111-8111-111111111111','authenticated','authenticated','setup-owner@example.test'),
 ('ae222222-2222-4222-8222-222222222222','authenticated','authenticated','setup-outsider@example.test');
set local role authenticated;
set local request.jwt.claims='{"sub":"ae111111-1111-4111-8111-111111111111","role":"authenticated"}';
do $$ begin perform set_config('test.setup_workspace',public.create_workspace('Setup fixture')::text,true); end $$;
select extensions.is(public.sync_onboarding(current_setting('test.setup_workspace')::uuid)->>'configured','false','A default settings row does not complete configuration');
select extensions.is(public.sync_onboarding(current_setting('test.setup_workspace')::uuid)->>'completedAt',null::text,'A fresh workspace stays in setup');
select public.save_agent_settings(current_setting('test.setup_workspace')::uuid,'{"tone":"warm","goals":["answer_questions","collect_contact","human_handoff"],"contact_fields":["name","email"],"human_handoff_enabled":true,"setup_brief":"Help customers with our design services."}');
do $$ begin perform set_config('test.setup_item',public.save_business_knowledge(current_setting('test.setup_workspace')::uuid,null,'service','Design services','We design logos for businesses.',null,'','','',null)::text,true); end $$;
select extensions.is(public.sync_onboarding(current_setting('test.setup_workspace')::uuid)->>'published','false','Draft knowledge does not complete setup');
select extensions.is(public.sync_onboarding(current_setting('test.setup_workspace')::uuid)->>'tested','false','No test session is not a successful test');
set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
select public.publish_knowledge_item('ae111111-1111-4111-8111-111111111111',current_setting('test.setup_workspace')::uuid,current_setting('test.setup_item')::uuid,1,('['||'1,'||repeat('0,',1534)||'0]')::extensions.vector);
do $$ declare r record; begin
 select * into r from public.begin_agent_turn('ae111111-1111-4111-8111-111111111111',current_setting('test.setup_workspace')::uuid,null,gen_random_uuid(),'What do you offer?');
 perform set_config('test.setup_run',r.run_id::text,true);
end $$;
set local role authenticated;
set local request.jwt.claims='{"sub":"ae111111-1111-4111-8111-111111111111","role":"authenticated"}';
select extensions.is(public.sync_onboarding(current_setting('test.setup_workspace')::uuid)->>'tested','false','An empty/processing test session does not count');
set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
select public.fail_agent_turn('ae111111-1111-4111-8111-111111111111',current_setting('test.setup_run')::uuid);
set local role authenticated;
set local request.jwt.claims='{"sub":"ae111111-1111-4111-8111-111111111111","role":"authenticated"}';
select extensions.is(public.sync_onboarding(current_setting('test.setup_workspace')::uuid)->>'tested','false','A failed test does not count');
set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
do $$ declare r record; begin
 select * into r from public.begin_agent_turn('ae111111-1111-4111-8111-111111111111',current_setting('test.setup_workspace')::uuid,null,gen_random_uuid(),'What do you offer?');
 perform public.finish_agent_turn('ae111111-1111-4111-8111-111111111111',r.run_id,'We design logos for businesses.','[]',false,null);
end $$;
set local role authenticated;
set local request.jwt.claims='{"sub":"ae111111-1111-4111-8111-111111111111","role":"authenticated"}';
select extensions.is(public.sync_onboarding(current_setting('test.setup_workspace')::uuid)->>'tested','true','A completed real test turn counts');
do $$ begin perform set_config('test.setup_channel',public.configure_website_channel(current_setting('test.setup_workspace')::uuid,false,array['https://setup.example'])::text,true); end $$;
select extensions.is(public.sync_onboarding(current_setting('test.setup_workspace')::uuid)->>'connected','false','Preparing a disabled channel does not count');
select public.configure_website_channel(current_setting('test.setup_workspace')::uuid,true,array['https://setup.example']);
select extensions.ok(public.sync_onboarding(current_setting('test.setup_workspace')::uuid)->>'completedAt' is not null,'All four milestones record activation');
select public.configure_website_channel(current_setting('test.setup_workspace')::uuid,false,array['https://setup.example']);
select public.change_knowledge_status(current_setting('test.setup_workspace')::uuid,current_setting('test.setup_item')::uuid,'draft');
select extensions.ok(public.sync_onboarding(current_setting('test.setup_workspace')::uuid)->>'completedAt' is not null,'Unpublishing and disconnecting never reset activation');
select extensions.is(public.home_snapshot(current_setting('test.setup_workspace')::uuid)->>'attentionCount','0','Test conversations are excluded from attention');
select extensions.is(jsonb_array_length(public.home_snapshot(current_setting('test.setup_workspace')::uuid)->'recent'),0,'Test sessions never fill Recent');
reset role;
-- Real database fixtures validate global queue selection beyond a 50-row Inbox page.
insert into public.conversations(workspace_id,channel,status,ai_mode,channel_connection_id,external_customer_ref,handoff_state,handoff_at)
 select current_setting('test.setup_workspace')::uuid,'website_chat','needs_human','paused',current_setting('test.setup_channel')::uuid,'waiting-'||i,'requested',now()-i*interval '1 minute' from generate_series(1,7) i;
insert into public.messages(workspace_id,conversation_id,role,content,created_at)
 select workspace_id,id,'customer','Please help with pricing.',now()-interval '2 hours' from public.conversations where workspace_id=current_setting('test.setup_workspace')::uuid and channel='website_chat';
insert into public.messages(workspace_id,conversation_id,role,content)
 select workspace_id,id,'assistant','Assistant reply is not the customer request.' from public.conversations where workspace_id=current_setting('test.setup_workspace')::uuid and channel='website_chat';
insert into public.conversations(workspace_id,channel,channel_connection_id,external_customer_ref)
 select current_setting('test.setup_workspace')::uuid,'website_chat',current_setting('test.setup_channel')::uuid,'active-'||i from generate_series(1,60) i;
insert into public.messages(workspace_id,conversation_id,role,content)
 select workspace_id,id,'customer','A new question.' from public.conversations where workspace_id=current_setting('test.setup_workspace')::uuid and external_customer_ref like 'active-%';
set local role authenticated;
set local request.jwt.claims='{"sub":"ae111111-1111-4111-8111-111111111111","role":"authenticated"}';
select extensions.is(public.home_snapshot(current_setting('test.setup_workspace')::uuid)->>'attentionCount','7','Full waiting count includes older conversations');
select extensions.is(jsonb_array_length(public.home_snapshot(current_setting('test.setup_workspace')::uuid)->'attention'),3,'Desktop attention is limited to three');
select extensions.is((select external_customer_ref from public.conversations where id=(public.home_snapshot(current_setting('test.setup_workspace')::uuid)->'attention'->0->>'id')::uuid),'waiting-7','Longest waiting person is first');
select extensions.is(public.home_snapshot(current_setting('test.setup_workspace')::uuid)->'attention'->0->>'preview','Please help with pricing.','Attention uses the customer request, not the last AI reply');
select extensions.is(jsonb_array_length(public.home_snapshot(current_setting('test.setup_workspace')::uuid)->'recent'),5,'Recent is limited to five');
select extensions.is((select count(distinct item->>'id')::integer from jsonb_array_elements(public.home_snapshot(current_setting('test.setup_workspace')::uuid)->'recent') item),5,'Recent represents each conversation only once');
set local request.jwt.claims='{"sub":"ae222222-2222-4222-8222-222222222222","role":"authenticated"}';
select extensions.throws_ok($$select public.sync_onboarding(current_setting('test.setup_workspace')::uuid)$$,'42501',null,'Cross-workspace setup access denied');
select extensions.throws_ok($$select public.home_snapshot(current_setting('test.setup_workspace')::uuid)$$,'42501',null,'Cross-workspace Home access denied');
select * from extensions.finish();
rollback;
