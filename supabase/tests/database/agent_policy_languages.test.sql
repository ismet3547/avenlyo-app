begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();
select extensions.ok(not has_table_privilege('authenticated','private.agent_policy_replies','SELECT'),'Canonical policy messages are not a browser capability');
select extensions.ok(not has_function_privilege('authenticated','private.fixed_agent_policy_reply(uuid,text,text)','EXECUTE'),'Browser cannot invoke privileged policy localization');
insert into auth.users(id,aud,role,email) values('af777777-7777-4777-8777-777777777777','authenticated','authenticated','policy-owner@example.test');
set local role authenticated;
set local request.jwt.claims='{"sub":"af777777-7777-4777-8777-777777777777","role":"authenticated"}';
do $$ begin
 perform set_config('test.pw',public.create_workspace('Policy Studio')::text,true);
 perform set_config('test.pa',public.create_agent(current_setting('test.pw')::uuid,'Turkish Reception','Connect customers to the team.','tr')::text,true);
 perform public.save_agent(current_setting('test.pw')::uuid,current_setting('test.pa')::uuid,'Turkish Reception','{"tone":"professional","goals":["human_handoff"],"contact_fields":[],"human_handoff_enabled":true,"setup_brief":"Connect customers to the team."}');
end $$;
set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
do $$ declare r record; result jsonb; begin
 select * into r from public.begin_agent_test_turn('af777777-7777-4777-8777-777777777777',current_setting('test.pw')::uuid,null,gen_random_uuid(),'Merhaba',current_setting('test.pa')::uuid);
 result:=public.finish_agent_turn('af777777-7777-4777-8777-777777777777',r.run_id,'Test: Bir ekip üyesi bu görüşmeye devam edebilir. Otomatik yanıtlar duraklatıldı.','[]',true,null);
 perform set_config('test.pr',result::text,true);
end $$;
select extensions.is(current_setting('test.pr')::jsonb->>'reply','Test: Bir ekip üyesi bu görüşmeye devam edebilir. Otomatik yanıtlar duraklatıldı.','Canonical Turkish policy reply survives the database safety boundary');
select extensions.is(current_setting('test.pr')::jsonb->>'needsHuman','true','Language never disables mandatory handoff');
do $$ declare r record; result jsonb; begin
 select * into r from public.begin_agent_test_turn('af777777-7777-4777-8777-777777777777',current_setting('test.pw')::uuid,null,gen_random_uuid(),'Hello',current_setting('test.pa')::uuid);
 result:=public.finish_agent_turn('af777777-7777-4777-8777-777777777777',r.run_id,'I sent your inquiry. Guaranteed price: 10.','[]',false,null);
 perform set_config('test.pr',result::text,true);
end $$;
select extensions.is(current_setting('test.pr')::jsonb->>'reply','This test conversation is paused for human assistance. No automatic customer answer has been sent.','Localized pause policy cannot admit arbitrary provider text');
select extensions.is(current_setting('test.pr')::jsonb->>'needsHuman','true','A false provider handoff flag cannot override disabled answers');
select * from extensions.finish();
rollback;
