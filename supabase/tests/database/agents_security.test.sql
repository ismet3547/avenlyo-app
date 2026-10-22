begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();
select extensions.ok((select rowsecurity from pg_tables where schemaname='public' and tablename='agents'),'Agents have RLS');
select extensions.ok((select rowsecurity from pg_tables where schemaname='public' and tablename='agent_knowledge_items'),'Agent bindings have RLS');
select extensions.ok(not has_table_privilege('anon','public.agents','SELECT'),'Anonymous Agent reads denied');
select extensions.ok(not has_table_privilege('authenticated','public.agents','UPDATE'),'Raw Agent writes denied');
select extensions.ok(not has_table_privilege('authenticated','public.agent_knowledge_items','INSERT'),'Raw bindings denied');
select extensions.ok(not has_function_privilege('anon','public.create_agent(uuid,text,text,text)','EXECUTE'),'No PUBLIC Agent creation');
select extensions.ok(not has_function_privilege('authenticated','private.require_agent(uuid,uuid)','EXECUTE'),'Private Agent helper not exposed');
insert into auth.users(id,aud,role,email) values
 ('af111111-1111-4111-8111-111111111111','authenticated','authenticated','agent-owner@example.test'),
 ('af222222-2222-4222-8222-222222222222','authenticated','authenticated','agent-outsider@example.test'),
 ('af333333-3333-4333-8333-333333333333','authenticated','authenticated','agent-member@example.test');
set local role authenticated;
set local request.jwt.claims='{"sub":"af111111-1111-4111-8111-111111111111","role":"authenticated"}';
do $$ begin
 perform set_config('test.aw',public.create_workspace('Agent Studio')::text,true);
 perform set_config('test.aid',(select id::text from public.agents where workspace_id=current_setting('test.aw')::uuid and is_default),true);
 perform set_config('test.a2',public.create_agent(current_setting('test.aw')::uuid,'Sales Assistant','Qualify customer inquiries.','tr')::text,true);
end $$;
select extensions.is((select count(*)::integer from public.agents where workspace_id=current_setting('test.aw')::uuid),2,'New workspace starts with exactly one initial Agent; additional Agent can be created');
select extensions.is((select primary_language from public.agents where id=current_setting('test.a2')::uuid),'tr','Primary language is Agent-specific');
select public.save_agent_settings(current_setting('test.aw')::uuid,'{"tone":"warm","goals":["answer_questions","human_handoff"],"contact_fields":[],"human_handoff_enabled":true,"setup_brief":"Help with our services."}');
select extensions.is((select tone from public.agents where id=current_setting('test.aid')::uuid),'warm','Onboarding configures initial Agent');
select extensions.is((select tone from public.agents where id=current_setting('test.a2')::uuid),'professional','Other Agent settings stay isolated');
select public.save_agent(current_setting('test.aw')::uuid,current_setting('test.aid')::uuid,'Front Office','{"tone":"concise","goals":["answer_questions","human_handoff"],"contact_fields":[],"human_handoff_enabled":true,"setup_brief":"Help with our services."}');
select extensions.is((select tone from public.agent_settings where workspace_id=current_setting('test.aw')::uuid),'concise','Default Agent edits keep onboarding compatibility');
select extensions.throws_ok($$select public.set_agent_languages(current_setting('test.aw')::uuid,current_setting('test.a2')::uuid,'en',array['en'])$$,'22023',null,'Primary cannot also be additional');
select extensions.throws_ok($$select public.set_agent_languages(current_setting('test.aw')::uuid,current_setting('test.a2')::uuid,null,'{}')$$,'22023',null,'Primary cannot be removed');
select public.set_agent_languages(current_setting('test.aw')::uuid,current_setting('test.a2')::uuid,'tr',array['de']);
select extensions.is((select additional_languages from public.agents where id=current_setting('test.a2')::uuid),array['de'],'Additional language is saved');
select public.set_agent_languages(current_setting('test.aw')::uuid,current_setting('test.a2')::uuid,'tr','{}');
select extensions.is((select cardinality(additional_languages) from public.agents where id=current_setting('test.a2')::uuid),0,'Additional language can be removed');
reset role;
insert into public.workspace_members(workspace_id,user_id,role) values(current_setting('test.aw')::uuid,'af333333-3333-4333-8333-333333333333','member');
set local role authenticated;
set local request.jwt.claims='{"sub":"af333333-3333-4333-8333-333333333333","role":"authenticated"}';
select extensions.is((select count(*)::integer from public.agents where workspace_id=current_setting('test.aw')::uuid),2,'Members may read Agents');
select extensions.throws_ok($$select public.create_agent(current_setting('test.aw')::uuid,'Forbidden Agent','Help customers.','en')$$,'42501',null,'Members cannot create Agents');
select extensions.throws_ok($$select public.archive_agent(current_setting('test.aw')::uuid,current_setting('test.a2')::uuid)$$,'42501',null,'Members cannot archive Agents');
set local request.jwt.claims='{"sub":"af222222-2222-4222-8222-222222222222","role":"authenticated"}';
select extensions.is((select count(*)::integer from public.agents where workspace_id=current_setting('test.aw')::uuid),0,'Cross-workspace reads are isolated');
select extensions.throws_ok($$select public.set_agent_languages(current_setting('test.aw')::uuid,current_setting('test.a2')::uuid,'en','{}')$$,'42501',null,'Cross-workspace mutation denied');
select * from extensions.finish();
rollback;
