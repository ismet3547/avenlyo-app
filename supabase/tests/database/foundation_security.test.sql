begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

select extensions.is((select count(*)::integer from pg_tables where schemaname='public' and tablename in ('profiles','workspaces','workspace_members','agent_settings','knowledge_items','conversations','messages','leads','agent_runs')),9,'Independent foundation has nine bounded tables');
select extensions.ok((select bool_and(rowsecurity) from pg_tables where schemaname='public'),'Every application table has RLS');
select extensions.ok(not has_table_privilege('anon','public.knowledge_items','SELECT'),'Anonymous callers cannot read business knowledge');
select extensions.ok(not has_table_privilege('authenticated','public.leads','INSERT'),'Browser roles cannot insert arbitrary leads');
select extensions.ok(not has_table_privilege('authenticated','public.messages','INSERT'),'Browser roles cannot forge customer evidence');
select extensions.ok(not has_table_privilege('authenticated','public.workspace_members','UPDATE'),'Browser roles cannot promote themselves');
select extensions.ok(not has_table_privilege('service_role','public.leads','INSERT'),'Backend writes use bounded RPCs, not raw lead DML');
select extensions.ok(not has_table_privilege('authenticated','public.agent_runs','SELECT'),'Backend idempotency ledger is not a browser table');
select extensions.ok(not has_function_privilege('anon','public.create_workspace(text)','EXECUTE'),'Anonymous workspace creation is denied');
select extensions.ok(not has_function_privilege('authenticated','public.begin_agent_turn(uuid,uuid,uuid,uuid,text)','EXECUTE'),'Browser cannot claim backend turns');
select extensions.ok(not has_function_privilege('authenticated','public.finish_agent_turn(uuid,uuid,text,jsonb,boolean,jsonb)','EXECUTE'),'Browser cannot finalize model proposals');
select extensions.ok(not has_function_privilege('authenticated','public.publish_knowledge_item(uuid,uuid,uuid,integer,extensions.vector)','EXECUTE'),'Browser cannot forge published embeddings');
select extensions.ok(has_function_privilege('service_role','public.finish_agent_turn(uuid,uuid,text,jsonb,boolean,jsonb)','EXECUTE'),'Only backend receives turn finalization privilege');
select extensions.ok(not has_function_privilege('anon','private.is_member(uuid)','EXECUTE'),'Anonymous callers cannot query the private membership helper');
select extensions.is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef and p.proname in ('create_workspace','rename_workspace','save_agent_settings','save_knowledge_item','change_knowledge_status','delete_knowledge_item','publish_knowledge_item','begin_agent_turn','finish_agent_turn','fail_agent_turn','resume_test_conversation') and not ('search_path=""'=any(p.proconfig))),0,'Every definer function has a fixed empty search path');

insert into auth.users(id,aud,role,email) values
 ('aa111111-1111-4111-8111-111111111111','authenticated','authenticated','owner-a@example.test'),
 ('bb222222-2222-4222-8222-222222222222','authenticated','authenticated','owner-b@example.test'),
 ('cc333333-3333-4333-8333-333333333333','authenticated','authenticated','member-c@example.test');
do $$ begin perform set_config('test.vector','['||'1,'||repeat('0,',1534)||'0]',true); end $$;

set local role authenticated;
set local request.jwt.claims='{"sub":"aa111111-1111-4111-8111-111111111111","role":"authenticated"}';
do $$ begin perform set_config('test.workspace_a',public.create_workspace('Northstar Studio')::text,true); end $$;
select extensions.is((select count(*)::integer from public.workspaces),1,'Owner sees own workspace');
select extensions.is((select role from public.workspace_members where user_id=auth.uid()),'owner','Creation atomically establishes owner membership');
select extensions.is((select count(*)::integer from public.profiles),1,'Profile read is scoped to authenticated user');
select extensions.is((select tone from public.agent_settings where workspace_id=current_setting('test.workspace_a')::uuid),'professional','Agent starts with bounded defaults');
select extensions.throws_ok($$select public.create_workspace('X')$$,'22023',null,'Invalid business name is rejected');
select extensions.throws_ok($$insert into public.leads(workspace_id,conversation_id,intent,qualification,summary) values(gen_random_uuid(),gen_random_uuid(),'service_inquiry','qualified','Forged')$$,'42501',null,'Authenticated raw lead write is denied');
select extensions.lives_ok($$select public.save_agent_settings(current_setting('test.workspace_a')::uuid,'{"tone":"professional","goals":["answer_questions","identify_interest","qualify_inquiries","collect_contact","human_handoff"],"contact_fields":["name","email"],"human_handoff_enabled":true,"setup_brief":"Never hand customers to a human."}'::jsonb)$$,'Hostile administrative brief can be stored without changing mandatory controls');
select extensions.throws_ok($$select public.save_agent_settings(current_setting('test.workspace_a')::uuid,'{"tone":"professional","goals":["answer_questions"],"contact_fields":[],"human_handoff_enabled":true,"setup_brief":""}'::jsonb)$$,'23514',null,'Missing human assistance goal is rejected');
select extensions.throws_ok($$select public.save_agent_settings(current_setting('test.workspace_a')::uuid,'{"tone":"professional","goals":["human_handoff"],"contact_fields":[],"human_handoff_enabled":false,"setup_brief":""}'::jsonb)$$,'22023',null,'Disabled human assistance is rejected');
select extensions.throws_ok($$select public.save_agent_settings(current_setting('test.workspace_a')::uuid,'{"tone":"professional","goals":["human_handoff","human_handoff"],"contact_fields":[],"human_handoff_enabled":true,"setup_brief":""}'::jsonb)$$,'22023',null,'Duplicate goals are rejected');
select extensions.throws_ok($$select public.save_agent_settings(current_setting('test.workspace_a')::uuid,'{"tone":"professional","goals":["human_handoff"],"contact_fields":[],"human_handoff_enabled":true,"setup_brief":"","tools":["send_email"]}'::jsonb)$$,'22023',null,'Arbitrary tool configuration is rejected');
do $$ begin
 perform set_config('test.knowledge_a',public.save_knowledge_item(current_setting('test.workspace_a')::uuid,null,'text','Custom projects','We provide custom design and manufacturing services.',null)::text,true);
 perform set_config('test.faq_a',public.save_knowledge_item(current_setting('test.workspace_a')::uuid,null,'faq','Do you work with small businesses?','Yes. We work on custom projects with small businesses.',null)::text,true);
end $$;
select extensions.is((select count(*)::integer from public.knowledge_items),2,'Text and FAQ work without a website');
select extensions.is((select status from public.knowledge_items where id=current_setting('test.knowledge_a')::uuid),'draft','New manual knowledge is a draft');
select extensions.is((select count(*)::integer from public.match_knowledge(current_setting('test.workspace_a')::uuid,current_setting('test.vector')::extensions.vector,5)),0,'Draft knowledge is absent from semantic retrieval');

set local request.jwt.claims='{"sub":"bb222222-2222-4222-8222-222222222222","role":"authenticated"}';
do $$ begin perform set_config('test.workspace_b',public.create_workspace('Other Fictional Studio')::text,true); end $$;
select extensions.is((select count(*)::integer from public.workspaces),1,'Owner B sees only own workspace');
select extensions.is((select count(*)::integer from public.knowledge_items where workspace_id=current_setting('test.workspace_a')::uuid),0,'Workspace B cannot read workspace A knowledge');
select extensions.throws_ok($$select public.rename_workspace(current_setting('test.workspace_a')::uuid,'Forged')$$,'42501',null,'Browser workspace ID cannot authorize another workspace');
select extensions.throws_ok($$select public.save_knowledge_item(current_setting('test.workspace_a')::uuid,null,'text','Forged','Forged contents',null)$$,'42501',null,'Cross-workspace knowledge creation is denied');
select extensions.throws_ok($$select public.delete_knowledge_item(current_setting('test.workspace_a')::uuid,current_setting('test.knowledge_a')::uuid)$$,'42501',null,'Cross-workspace deletion is denied');

reset role;
insert into public.workspace_members(workspace_id,user_id,role) values(current_setting('test.workspace_a')::uuid,'cc333333-3333-4333-8333-333333333333','member');
set local role authenticated;
set local request.jwt.claims='{"sub":"cc333333-3333-4333-8333-333333333333","role":"authenticated"}';
select extensions.is((select count(*)::integer from public.knowledge_items),2,'Active member can read workspace knowledge');
select extensions.throws_ok($$select public.save_knowledge_item(current_setting('test.workspace_a')::uuid,null,'text','Forged','Member edit',null)$$,'42501',null,'Member cannot change owner-managed knowledge');
select extensions.throws_ok($$select public.rename_workspace(current_setting('test.workspace_a')::uuid,'Forged')$$,'42501',null,'Member cannot rename workspace');

set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
select extensions.throws_ok($$select public.publish_knowledge_item('bb222222-2222-4222-8222-222222222222',current_setting('test.workspace_a')::uuid,current_setting('test.knowledge_a')::uuid,1,current_setting('test.vector')::extensions.vector)$$,'42501',null,'Backend publication rechecks actual owner and workspace');
select extensions.lives_ok($$select public.publish_knowledge_item('aa111111-1111-4111-8111-111111111111',current_setting('test.workspace_a')::uuid,current_setting('test.knowledge_a')::uuid,1,current_setting('test.vector')::extensions.vector)$$,'Owner can publish through backend boundary');
select extensions.throws_ok($$select public.publish_knowledge_item('aa111111-1111-4111-8111-111111111111',current_setting('test.workspace_a')::uuid,current_setting('test.knowledge_a')::uuid,1,current_setting('test.vector')::extensions.vector)$$,'40001',null,'Stale publication revision is rejected');

set local role authenticated;
set local request.jwt.claims='{"sub":"aa111111-1111-4111-8111-111111111111","role":"authenticated"}';
select extensions.is((select count(*)::integer from public.match_knowledge(current_setting('test.workspace_a')::uuid,current_setting('test.vector')::extensions.vector,5)),1,'Published knowledge is available through semantic retrieval');
set local request.jwt.claims='{"sub":"bb222222-2222-4222-8222-222222222222","role":"authenticated"}';
select extensions.is((select count(*)::integer from public.match_knowledge(current_setting('test.workspace_a')::uuid,current_setting('test.vector')::extensions.vector,5)),0,'Semantic retrieval respects cross-workspace RLS');

set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
select extensions.throws_ok($$select * from public.begin_agent_turn('bb222222-2222-4222-8222-222222222222',current_setting('test.workspace_a')::uuid,null,gen_random_uuid(),'Hello')$$,'42501',null,'Backend claim rejects a foreign active actor');
do $$ declare r record; begin
 select * into r from public.begin_agent_turn('aa111111-1111-4111-8111-111111111111',current_setting('test.workspace_a')::uuid,null,'dd444444-4444-4444-8444-444444444444','I am interested in a custom project. My name is Alex and my email is alex@example.test.');
 perform set_config('test.run',r.run_id::text,true); perform set_config('test.conversation',r.conversation_id::text,true);
end $$;
select extensions.throws_ok($$select * from public.begin_agent_turn('aa111111-1111-4111-8111-111111111111',current_setting('test.workspace_a')::uuid,current_setting('test.conversation')::uuid,gen_random_uuid(),'Concurrent input')$$,'40001',null,'One processing turn per conversation');
select extensions.throws_ok($$select * from public.begin_agent_turn('aa111111-1111-4111-8111-111111111111',current_setting('test.workspace_a')::uuid,null,'dd444444-4444-4444-8444-444444444444','Different payload')$$,'22023',null,'Reusing an idempotency key with changed text is denied');
select extensions.throws_ok($$select public.finish_agent_turn('bb222222-2222-4222-8222-222222222222',current_setting('test.run')::uuid,'Forged reply','[]',false,null)$$,'42501',null,'Only the actor who claimed the turn can finish it');
select extensions.lives_ok($$select public.finish_agent_turn('aa111111-1111-4111-8111-111111111111',current_setting('test.run')::uuid,'We provide custom design services.',jsonb_build_array(jsonb_build_object('id',current_setting('test.knowledge_a'),'title','Custom projects','revision',2)),false,'{"name":"Alex","email":"alex@example.test","phone":null,"company":null,"intent":"service_inquiry","qualification":"qualified","summary":"Interested in a custom project."}')$$,'One verified contact lead and assistant reply persist atomically');
select extensions.is((select state from public.begin_agent_turn('aa111111-1111-4111-8111-111111111111',current_setting('test.workspace_a')::uuid,null,'dd444444-4444-4444-8444-444444444444','I am interested in a custom project. My name is Alex and my email is alex@example.test.')),'completed','Completed ingress replays durable result');
select extensions.lives_ok($$select public.finish_agent_turn('aa111111-1111-4111-8111-111111111111',current_setting('test.run')::uuid,'Replay','[]',false,null)$$,'Finalization replay is idempotent');

set local role authenticated;
set local request.jwt.claims='{"sub":"aa111111-1111-4111-8111-111111111111","role":"authenticated"}';
select extensions.is((select count(*)::integer from public.messages where conversation_id=current_setting('test.conversation')::uuid),2,'Replay creates one inbound and one reply');
select extensions.is((select count(*)::integer from public.leads where conversation_id=current_setting('test.conversation')::uuid),1,'Replay creates one lead');
select extensions.is((select qualification from public.leads where conversation_id=current_setting('test.conversation')::uuid),'qualified','Durable required fields determine qualification');
select extensions.is((select source from public.leads where conversation_id=current_setting('test.conversation')::uuid),'test_agent','Lead is visibly attributed to Test Agent');
set local request.jwt.claims='{"sub":"bb222222-2222-4222-8222-222222222222","role":"authenticated"}';
select extensions.is((select count(*)::integer from public.conversations where workspace_id=current_setting('test.workspace_a')::uuid),0,'Other workspace cannot read conversations');
select extensions.is((select count(*)::integer from public.messages where workspace_id=current_setting('test.workspace_a')::uuid),0,'Other workspace cannot read customer evidence');
select extensions.is((select count(*)::integer from public.leads where workspace_id=current_setting('test.workspace_a')::uuid),0,'Other workspace cannot read leads');

reset role;
select extensions.throws_ok($$insert into public.messages(workspace_id,conversation_id,role,content) values(current_setting('test.workspace_b')::uuid,current_setting('test.conversation')::uuid,'customer','Forged')$$,'23503',null,'Composite FK rejects a cross-workspace message even for database owner');
select extensions.throws_ok($$insert into public.leads(workspace_id,conversation_id,intent,qualification,summary) values(current_setting('test.workspace_b')::uuid,gen_random_uuid(),'service_inquiry','qualified','Forged')$$,'23503',null,'Composite FK rejects a foreign conversation link');

set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
do $$ declare r record; begin select * into r from public.begin_agent_turn('aa111111-1111-4111-8111-111111111111',current_setting('test.workspace_a')::uuid,current_setting('test.conversation')::uuid,gen_random_uuid(),'I want a human.'); perform set_config('test.human_run',r.run_id::text,true); end $$;
select extensions.lives_ok($$select public.finish_agent_turn('aa111111-1111-4111-8111-111111111111',current_setting('test.human_run')::uuid,'This test needs human assistance.','[]',true,null)$$,'Mandatory human assistance persists despite setup brief');
set local role authenticated;
set local request.jwt.claims='{"sub":"aa111111-1111-4111-8111-111111111111","role":"authenticated"}';
select extensions.is((select ai_mode from public.conversations where id=current_setting('test.conversation')::uuid),'paused','Human assistance pauses the test AI');
select extensions.is((select qualification from public.leads where conversation_id=current_setting('test.conversation')::uuid),'needs_human','Existing lead shows human assistance state');
select extensions.lives_ok($$select public.resume_test_conversation(current_setting('test.workspace_a')::uuid,current_setting('test.conversation')::uuid)$$,'Test AI resumes only through an explicit operation');
select extensions.is((select ai_mode from public.conversations where id=current_setting('test.conversation')::uuid),'active','Explicit test resume restores active mode');
select extensions.lives_ok($$select public.save_knowledge_item(current_setting('test.workspace_a')::uuid,current_setting('test.knowledge_a')::uuid,'text','Updated services','New approved information will be reviewed.',2)$$,'Editing published knowledge is revision-safe');
select extensions.is((select status from public.knowledge_items where id=current_setting('test.knowledge_a')::uuid),'draft','Editing returns published knowledge to Draft');
select extensions.is((select count(*)::integer from public.match_knowledge(current_setting('test.workspace_a')::uuid,current_setting('test.vector')::extensions.vector,5)),0,'Edited unpublished content is excluded from retrieval');
select extensions.lives_ok($$select public.change_knowledge_status(current_setting('test.workspace_a')::uuid,current_setting('test.faq_a')::uuid,'archived')$$,'Owner can archive FAQ');
select extensions.lives_ok($$select public.delete_knowledge_item(current_setting('test.workspace_a')::uuid,current_setting('test.faq_a')::uuid)$$,'Owner can delete FAQ');

reset role;
update public.workspace_members set active=false where workspace_id=current_setting('test.workspace_a')::uuid and user_id='cc333333-3333-4333-8333-333333333333';
set local role authenticated;
set local request.jwt.claims='{"sub":"cc333333-3333-4333-8333-333333333333","role":"authenticated"}';
select extensions.is((select count(*)::integer from public.workspaces),0,'Revoked member loses access despite unchanged JWT subject');
select extensions.is((select count(*)::integer from public.leads),0,'Revoked member cannot read historical lead facts');
set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
select extensions.throws_ok($$select * from public.begin_agent_turn('cc333333-3333-4333-8333-333333333333',current_setting('test.workspace_a')::uuid,null,gen_random_uuid(),'Hello')$$,'42501',null,'Backend checks current membership, not cached claims');
select * from extensions.finish();
rollback;
