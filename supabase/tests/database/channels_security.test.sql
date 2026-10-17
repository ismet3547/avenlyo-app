begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();
select extensions.is((select count(*)::integer from pg_tables where schemaname='public' and tablename in ('channel_connections','website_sessions','channel_events','message_deliveries','business_notifications')),5,'Five small channel tables extend Foundation');
select extensions.ok((select bool_and(rowsecurity) from pg_tables where schemaname='public'),'Every application table still has RLS');
select extensions.ok(not has_table_privilege('anon','public.channel_connections','SELECT'),'Anonymous callers cannot select channels');
select extensions.ok(not has_column_privilege('authenticated','public.website_sessions','token_hash','SELECT'),'Members cannot read session hashes');
select extensions.ok(not has_column_privilege('authenticated','public.channel_events','payload_hash','SELECT'),'Members cannot read replay hashes');
select extensions.ok(not has_table_privilege('authenticated','private.channel_credentials','SELECT'),'Encrypted credential references are server-only');
select extensions.ok(not has_table_privilege('authenticated','vault.decrypted_secrets','SELECT'),'Decrypted provider credentials are not browser-readable');
select extensions.ok(not has_schema_privilege('authenticated','vault','USAGE'),'Browser role cannot invoke any Vault schema capability');
select extensions.ok(not has_table_privilege('service_role','public.messages','INSERT'),'Backend still cannot write unbounded raw messages');
select extensions.ok(not has_function_privilege('anon','public.create_website_session(uuid,text,text)','EXECUTE'),'Public visitors have no direct service RPC capability');
select extensions.ok(not has_function_privilege('authenticated','public.provision_instagram_channel(uuid,text,text,text,text,text,text)','EXECUTE'),'Workspace members cannot provision tokens');
select extensions.is((select count(*)::integer from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') and p.prosecdef and not ('search_path=""'=any(p.proconfig))),0,'All application definer functions have fixed search paths');

insert into auth.users(id,aud,role,email,email_confirmed_at) values
 ('ae111111-1111-4111-8111-111111111111','authenticated','authenticated','channels-owner-a@example.test',now()),
 ('be222222-2222-4222-8222-222222222222','authenticated','authenticated','channels-owner-b@example.test',now()),
 ('ce333333-3333-4333-8333-333333333333','authenticated','authenticated','channels-member@example.test',now());
do $$ begin perform set_config('ch.vector','['||'1,'||repeat('0,',1534)||'0]',true); end $$;
set local role authenticated;
set local request.jwt.claims='{"sub":"ae111111-1111-4111-8111-111111111111","role":"authenticated"}';
do $$ begin
 perform set_config('ch.a',public.create_workspace('Northstar Studio')::text,true);
 perform set_config('ch.connection_a',public.configure_website_channel(current_setting('ch.a')::uuid,true,array['https://northstar.example','http://localhost:3001'])::text,true);
 perform set_config('ch.public_a',(select public_id::text from public.channel_connections where id=current_setting('ch.connection_a')::uuid),true);
 perform set_config('ch.knowledge',public.save_knowledge_item(current_setting('ch.a')::uuid,null,'text','Logo design','We provide logo design for small businesses.',null)::text,true);
end $$;
select extensions.throws_ok($$select public.configure_website_channel(current_setting('ch.a')::uuid,true,array['*'])$$,'22023',null,'Wildcard origins are forbidden');
select extensions.throws_ok($$select public.configure_website_channel(current_setting('ch.a')::uuid,true,array['https://northstar.example/path'])$$,'22023',null,'Paths cannot become approved origins');
select extensions.throws_ok($$select public.configure_website_channel(current_setting('ch.a')::uuid,true,array['http://public.example'])$$,'22023',null,'Public HTTP origins are forbidden');

set local request.jwt.claims='{"sub":"be222222-2222-4222-8222-222222222222","role":"authenticated"}';
do $$ begin
 perform set_config('ch.b',public.create_workspace('Other Studio')::text,true);
 perform public.configure_website_channel(current_setting('ch.b')::uuid,true,array['https://northstar.example']);
 perform set_config('ch.public_b',(select public_id::text from public.channel_connections where workspace_id=current_setting('ch.b')::uuid),true);
end $$;
select extensions.is((select count(*)::integer from public.channel_connections where workspace_id=current_setting('ch.a')::uuid),0,'Workspace B cannot read A channel configuration');
select extensions.throws_ok($$select public.configure_website_channel(current_setting('ch.a')::uuid,true,array['https://evil.example'])$$,'42501',null,'A forged workspace does not authorize channel configuration');
reset role;
insert into public.workspace_members(workspace_id,user_id,role) values(current_setting('ch.a')::uuid,'ce333333-3333-4333-8333-333333333333','member');
set local role authenticated;
set local request.jwt.claims='{"sub":"ce333333-3333-4333-8333-333333333333","role":"authenticated"}';
select extensions.throws_ok($$select public.configure_website_channel(current_setting('ch.a')::uuid,false,array['https://northstar.example'])$$,'42501',null,'Only an owner can change channel origins');

set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
select extensions.is(public.website_origin_allowed(current_setting('ch.public_a')::uuid,'https://northstar.example'),true,'The exact approved Origin succeeds');
select extensions.is(public.website_origin_allowed(current_setting('ch.public_a')::uuid,'https://northstar.example.evil'),false,'A lookalike Origin fails');
select extensions.throws_ok($$select public.create_website_session(current_setting('ch.public_a')::uuid,'https://evil.example',repeat('a',64))$$,'42501',null,'Unknown Origin cannot create a visitor session');
select extensions.lives_ok($$select public.create_website_session(current_setting('ch.public_a')::uuid,'https://northstar.example',repeat('a',64))$$,'A visitor session needs no Auth user');
select extensions.throws_ok($$select public.read_website_thread(current_setting('ch.public_a')::uuid,'https://northstar.example',repeat('b',64),null)$$,'42501',null,'Invalid visitor session is rejected');
select extensions.throws_ok($$select public.read_website_thread(current_setting('ch.public_b')::uuid,'https://northstar.example',repeat('a',64),null)$$,'42501',null,'A valid session cannot select another tenant by public ID');
select extensions.throws_ok($$select public.read_website_thread(current_setting('ch.public_a')::uuid,'http://localhost:3001',repeat('a',64),null)$$,'42501',null,'Sessions remain bound to their original approved Origin');
select extensions.lives_ok($$select public.publish_knowledge_item('ae111111-1111-4111-8111-111111111111',current_setting('ch.a')::uuid,current_setting('ch.knowledge')::uuid,1,current_setting('ch.vector')::extensions.vector)$$,'Foundation knowledge publishes for all channels');
do $$ declare r record; begin
 select * into r from public.begin_website_turn(current_setting('ch.public_a')::uuid,'https://northstar.example',repeat('a',64),'de444444-4444-4444-8444-444444444444','I am interested in your logo design. My name is Alex and my email is alex@example.test.');
 perform set_config('ch.web_run',r.run_id::text,true);perform set_config('ch.web_conversation',r.conversation_id::text,true);
end $$;
select extensions.is((public.channel_runtime_context(current_setting('ch.web_run')::uuid)->>'channel'),'website_chat','The external context has verified Website Chat authority');
select extensions.ok(not (public.channel_runtime_context(current_setting('ch.web_run')::uuid)->'settings' ? 'setup_brief'),'Administrative brief remains outside runtime authority');
select extensions.is((select count(*)::integer from public.match_channel_knowledge(current_setting('ch.web_run')::uuid,current_setting('ch.vector')::extensions.vector)),1,'External retrieval uses the same published-only knowledge');
select extensions.throws_ok($$select * from public.begin_website_turn(current_setting('ch.public_a')::uuid,'https://northstar.example',repeat('a',64),'de444444-4444-4444-8444-444444444444','Changed text')$$,'22023',null,'Changed client replay payload cannot overwrite evidence');
select extensions.lives_ok($$select public.finish_channel_turn(current_setting('ch.web_run')::uuid,'We provide logo design.',jsonb_build_array(jsonb_build_object('id',current_setting('ch.knowledge'),'title','Logo design','revision',2)),false,'{"name":"Alex","email":"alex@example.test","phone":null,"company":null,"intent":"service_inquiry","qualification":"qualified","summary":"Interested in logo design."}')$$,'Same lead engine commits a grounded external inquiry');
select extensions.is((select state from public.begin_website_turn(current_setting('ch.public_a')::uuid,'https://northstar.example',repeat('a',64),'de444444-4444-4444-8444-444444444444','I am interested in your logo design. My name is Alex and my email is alex@example.test.')),'completed','Duplicate visitor input replays one durable result');
do $$ declare n jsonb; begin
 n:=public.claim_business_notification(current_setting('ch.web_conversation')::uuid);
 perform set_config('ch.notification',n->>'notificationId',true);perform set_config('ch.recipient',n->>'to',true);
end $$;
select extensions.is(current_setting('ch.recipient'),'channels-owner-a@example.test','Notification recipient is a verified current owner, derived by the database');
select extensions.lives_ok($$select public.finish_business_notification(current_setting('ch.notification')::uuid,'unknown','EMAIL_OUTCOME_UNKNOWN')$$,'Ambiguous email outcome is recorded');
select extensions.is(public.claim_business_notification(current_setting('ch.web_conversation')::uuid),null::jsonb,'Unknown notification cannot be claimed for automatic resend');

set local role authenticated;
set local request.jwt.claims='{"sub":"ae111111-1111-4111-8111-111111111111","role":"authenticated"}';
select extensions.is((select count(*)::integer from public.messages where conversation_id=current_setting('ch.web_conversation')::uuid),2,'Duplicate visitor input has one customer message and one reply');
select extensions.is((select count(*)::integer from public.leads where conversation_id=current_setting('ch.web_conversation')::uuid),1,'One lead remains linked to the conversation');
select extensions.is((select source from public.leads where conversation_id=current_setting('ch.web_conversation')::uuid),'website_chat','Website lead keeps its actual source');
select extensions.is((select status from public.message_deliveries where conversation_id=current_setting('ch.web_conversation')::uuid),'available','Website replies are persisted for visitor retrieval');
select extensions.is((select created_by from public.conversations where id=current_setting('ch.web_conversation')::uuid),null::uuid,'Visitor is not a pretend staff member');
select extensions.is((select count(*)::integer from public.business_notifications where conversation_id=current_setting('ch.web_conversation')::uuid),1,'Qualified lead notification is durable and unique');
select extensions.throws_ok($$select public.resume_test_conversation(current_setting('ch.a')::uuid,current_setting('ch.web_conversation')::uuid)$$,'42501',null,'Test Agent resume cannot act on a live customer channel');

set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
select extensions.throws_ok($$select * from public.begin_agent_turn('ae111111-1111-4111-8111-111111111111',current_setting('ch.a')::uuid,current_setting('ch.web_conversation')::uuid,gen_random_uuid(),'Injected test')$$,'42501',null,'Test Agent cannot inject customer evidence into a real channel');
do $$ declare r record; begin
 select * into r from public.begin_website_turn(current_setting('ch.public_a')::uuid,'https://northstar.example',repeat('a',64),gen_random_uuid(),'I want to speak with a person.');
 perform public.finish_channel_turn(r.run_id,'A team member can continue this conversation.','[]',true,null);
end $$;
set local role authenticated;
set local request.jwt.claims='{"sub":"be222222-2222-4222-8222-222222222222","role":"authenticated"}';
select extensions.throws_ok($$select public.conversation_team_action(current_setting('ch.a')::uuid,current_setting('ch.web_conversation')::uuid,'claim')$$,'42501',null,'Foreign owner cannot claim a conversation');
select extensions.is((select count(*)::integer from public.website_sessions where workspace_id=current_setting('ch.a')::uuid),0,'Foreign workspace cannot read visitor session metadata');
select extensions.is((select count(*)::integer from public.conversations where workspace_id=current_setting('ch.a')::uuid),0,'Foreign workspace cannot read conversations');
select extensions.is((select count(*)::integer from public.messages where workspace_id=current_setting('ch.a')::uuid),0,'Foreign workspace cannot read messages');
select extensions.is((select count(*)::integer from public.leads where workspace_id=current_setting('ch.a')::uuid),0,'Foreign workspace cannot read leads');
select extensions.is((select count(*)::integer from public.message_deliveries where workspace_id=current_setting('ch.a')::uuid),0,'Foreign workspace cannot read delivery metadata');
select extensions.is((select count(*)::integer from public.business_notifications where workspace_id=current_setting('ch.a')::uuid),0,'Foreign workspace cannot read notifications');
set local request.jwt.claims='{"sub":"ce333333-3333-4333-8333-333333333333","role":"authenticated"}';
select extensions.lives_ok($$select public.conversation_team_action(current_setting('ch.a')::uuid,current_setting('ch.web_conversation')::uuid,'claim')$$,'Active member can claim a permitted thread');
select extensions.is((select ai_mode from public.conversations where id=current_setting('ch.web_conversation')::uuid),'paused','Claim leaves AI paused');
do $$ begin perform set_config('ch.human_message',public.create_human_reply(current_setting('ch.a')::uuid,current_setting('ch.web_conversation')::uuid,'ee555555-5555-4555-8555-555555555555','Hi, this is Susan from Northstar Studio.')::text,true); end $$;
select extensions.is((select role from public.messages where id=current_setting('ch.human_message')::uuid),'human','Staff replies have role human');
select extensions.is(public.create_human_reply(current_setting('ch.a')::uuid,current_setting('ch.web_conversation')::uuid,'ee555555-5555-4555-8555-555555555555','Hi, this is Susan from Northstar Studio.')::text,current_setting('ch.human_message'),'Human replay returns the same message');
select extensions.is((select ai_mode from public.conversations where id=current_setting('ch.web_conversation')::uuid),'paused','Sending a human reply does not resume AI');
set local request.jwt.claims='{"sub":"ae111111-1111-4111-8111-111111111111","role":"authenticated"}';
select extensions.throws_ok($$select public.conversation_team_action(current_setting('ch.a')::uuid,current_setting('ch.web_conversation')::uuid,'resume')$$,'42501',null,'Another member cannot reactivate a claimed thread');
set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
select extensions.ok(public.read_website_thread(current_setting('ch.public_a')::uuid,'https://northstar.example',repeat('a',64),null)->'messages' @> jsonb_build_array(jsonb_build_object('role','human','content','Hi, this is Susan from Northstar Studio.')),'Visitor receives the stored human reply');
do $$ declare r record; result jsonb; begin
 select * into r from public.begin_website_turn(current_setting('ch.public_a')::uuid,'https://northstar.example',repeat('a',64),gen_random_uuid(),'Are you there?');
 result:=public.finish_channel_turn(r.run_id,'This must not be sent.','[]',true,null);
 perform set_config('ch.paused_reply',result->>'reply',true);
end $$;
select extensions.is(current_setting('ch.paused_reply'),'','Paused follow-up stores no automatic assistant response');
set local role authenticated;
set local request.jwt.claims='{"sub":"ce333333-3333-4333-8333-333333333333","role":"authenticated"}';
select extensions.lives_ok($$select public.conversation_team_action(current_setting('ch.a')::uuid,current_setting('ch.web_conversation')::uuid,'release')$$,'Claim owner can release');
select extensions.is((select ai_mode from public.conversations where id=current_setting('ch.web_conversation')::uuid),'paused','Release leaves AI paused');
select extensions.lives_ok($$select public.conversation_team_action(current_setting('ch.a')::uuid,current_setting('ch.web_conversation')::uuid,'resume')$$,'Explicit team resume restores AI');
select extensions.is((select ai_mode from public.conversations where id=current_setting('ch.web_conversation')::uuid),'active','Resumed conversation is active');

-- A settings change during a model call can only emit the deterministic handoff notice.
set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
do $$ declare r record;begin select * into r from public.begin_website_turn(current_setting('ch.public_a')::uuid,'https://northstar.example',repeat('a',64),gen_random_uuid(),'What logo design services do you offer?');perform set_config('ch.settings_race',r.run_id::text,true);end $$;
set local role authenticated;
set local request.jwt.claims='{"sub":"ae111111-1111-4111-8111-111111111111","role":"authenticated"}';
select public.save_agent_settings(current_setting('ch.a')::uuid,'{"tone":"professional","goals":["identify_interest","qualify_inquiries","collect_contact","human_handoff"],"contact_fields":["name","email"],"human_handoff_enabled":true,"setup_brief":""}');
set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
select extensions.is(public.finish_channel_turn(current_setting('ch.settings_race')::uuid,'Unallowed AI answer.','[]',false,null)->>'reply','A team member can continue this conversation. Automated answers are paused.','Current answering goal wins over an in-flight model result');
set local role authenticated;
set local request.jwt.claims='{"sub":"ae111111-1111-4111-8111-111111111111","role":"authenticated"}';
select public.save_agent_settings(current_setting('ch.a')::uuid,'{"tone":"professional","goals":["answer_questions","identify_interest","qualify_inquiries","collect_contact","human_handoff"],"contact_fields":["name","email"],"human_handoff_enabled":true,"setup_brief":""}');
select public.conversation_team_action(current_setting('ch.a')::uuid,current_setting('ch.web_conversation')::uuid,'resume');
set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
do $$ declare r record;begin select * into r from public.begin_website_turn(current_setting('ch.public_a')::uuid,'https://northstar.example',repeat('a',64),gen_random_uuid(),'Another design question.');perform set_config('ch.claim_race',r.run_id::text,true);end $$;
set local role authenticated;
set local request.jwt.claims='{"sub":"ce333333-3333-4333-8333-333333333333","role":"authenticated"}';
select public.conversation_team_action(current_setting('ch.a')::uuid,current_setting('ch.web_conversation')::uuid,'claim');
set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
select extensions.is(public.finish_channel_turn(current_setting('ch.claim_race')::uuid,'Late model answer.','[]',false,null)->>'reply','','A human claim suppresses an in-flight model answer');
set local role authenticated;
set local request.jwt.claims='{"sub":"ce333333-3333-4333-8333-333333333333","role":"authenticated"}';
select public.conversation_team_action(current_setting('ch.a')::uuid,current_setting('ch.web_conversation')::uuid,'release');
select public.conversation_team_action(current_setting('ch.a')::uuid,current_setting('ch.web_conversation')::uuid,'resume');
set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
do $$ declare r record;begin select * into r from public.begin_website_turn(current_setting('ch.public_a')::uuid,'https://northstar.example',repeat('a',64),gen_random_uuid(),'A further design question.');perform set_config('ch.fail_race',r.run_id::text,true);end $$;
set local role authenticated;
set local request.jwt.claims='{"sub":"ce333333-3333-4333-8333-333333333333","role":"authenticated"}';
select public.conversation_team_action(current_setting('ch.a')::uuid,current_setting('ch.web_conversation')::uuid,'claim');
select public.conversation_team_action(current_setting('ch.a')::uuid,current_setting('ch.web_conversation')::uuid,'resume');
set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
select public.fail_channel_turn(current_setting('ch.fail_race')::uuid);
set local role authenticated;
set local request.jwt.claims='{"sub":"ae111111-1111-4111-8111-111111111111","role":"authenticated"}';
select extensions.is((select ai_mode from public.conversations where id=current_setting('ch.web_conversation')::uuid),'active','A stale failed model call cannot undo an explicit team resume');

reset role;
select extensions.is((select count(*)::integer from auth.users where id in ('ae111111-1111-4111-8111-111111111111','be222222-2222-4222-8222-222222222222','ce333333-3333-4333-8333-333333333333')),3,'Only actual fictional staff Auth users exist');
update public.website_sessions set expires_at=now()-interval '1 second' where token_hash=repeat('a',64);
set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
select extensions.throws_ok($$select public.read_website_thread(current_setting('ch.public_a')::uuid,'https://northstar.example',repeat('a',64),null)$$,'42501',null,'Expired visitor session is denied');
select extensions.lives_ok($$select public.provision_instagram_channel(current_setting('ch.a')::uuid,'Northstar Studio','17841400000123456','northstar_fictional','fictional-instagram-token-no-live-provider','v26.0','123456789')$$,'Only the backend stores an explicitly verified provider connection');
select extensions.throws_ok($$select public.provision_instagram_channel(current_setting('ch.b')::uuid,'Other Studio','17841400000123456','northstar_fictional','fictional-instagram-token-no-live-provider','v26.0','123456789')$$,'42501',null,'A provider account cannot be provisioned into another workspace');
select extensions.throws_ok($$select public.provision_instagram_channel(current_setting('ch.b')::uuid,'WRONG WORKSPACE','17841400000999999','other','fictional-instagram-token-no-live-provider','v26.0','123456789')$$,'42501',null,'Workspace acknowledgement prevents accidental provisioning');
select extensions.is(public.accept_instagram_event('17841400000999999','987654321','unknown-mid','Hello',repeat('b',64),now())->>'ignored','true','Unknown provider account cannot choose a tenant');
select extensions.lives_ok($$select public.accept_instagram_event('17841400000123456','987654321','mid-one','I am interested in your logo design. My name is Alex and my email is alex@example.test.',repeat('b',64),now())$$,'Verified provider account accepts supported customer text');
select extensions.is(public.accept_instagram_event('17841400000123456','987654321','mid-one','I am interested in your logo design. My name is Alex and my email is alex@example.test.',repeat('b',64),now())->>'replayed','true','Provider replay does not create a second event');
select extensions.throws_ok($$select public.accept_instagram_event('17841400000123456','987654321','mid-one','Changed evidence',repeat('c',64),now())$$,'22023',null,'Conflicting provider replay cannot overwrite evidence');
do $$ declare r record; begin
 select * into r from public.claim_instagram_event();
 perform set_config('ch.ig_conversation',r.conversation_id::text,true);perform set_config('ch.ig_run',r.run_id::text,true);
 perform public.finish_channel_turn(r.run_id,'We provide logo design.','[]',false,'{"name":"Alex","email":"alex@example.test","phone":null,"company":null,"intent":"service_inquiry","qualification":"qualified","summary":"Interested in logo design."}');
end $$;
select extensions.is((select count(*)::integer from public.claim_instagram_event()),0,'A completed provider event is not processed twice');
do $$ declare d jsonb; begin
 d:=public.claim_message_delivery(null);perform set_config('ch.delivery',d->>'deliveryId',true);perform set_config('ch.ig_token',d->>'accessToken',true);
end $$;
select extensions.is(current_setting('ch.ig_token'),'fictional-instagram-token-no-live-provider','Only a backend delivery claim retrieves a Vault token');
select extensions.lives_ok($$select public.finish_message_delivery(current_setting('ch.delivery')::uuid,'unknown',null,'META_OUTCOME_UNKNOWN')$$,'Ambiguous provider outcome closes the claimed delivery');
select extensions.is(public.claim_message_delivery(null),null::jsonb,'Unknown outbound message is never blindly reclaimed');
set local role authenticated;
set local request.jwt.claims='{"sub":"ae111111-1111-4111-8111-111111111111","role":"authenticated"}';
select extensions.is((select source from public.leads where conversation_id=current_setting('ch.ig_conversation')::uuid),'instagram','Same validated lead engine preserves Instagram source');
select extensions.is((select count(*)::integer from public.messages where conversation_id=current_setting('ch.ig_conversation')::uuid),2,'Replay creates one Instagram customer message and one reply');
select extensions.is((select ai_mode from public.conversations where id=current_setting('ch.ig_conversation')::uuid),'paused','An uncertain outbound result pauses further AI sends');
select extensions.lives_ok($$select public.conversation_team_action(current_setting('ch.a')::uuid,current_setting('ch.ig_conversation')::uuid,'claim')$$,'Team can continue an Instagram thread');
select extensions.throws_ok($$select public.create_human_reply(current_setting('ch.a')::uuid,current_setting('ch.ig_conversation')::uuid,gen_random_uuid(),repeat('🟣',300))$$,'22023',null,'Instagram human text is bounded by UTF-8 bytes');
do $$ begin perform set_config('ch.ig_human',public.create_human_reply(current_setting('ch.a')::uuid,current_setting('ch.ig_conversation')::uuid,gen_random_uuid(),'Hi, this is Susan.')::text,true);end $$;
set local request.jwt.claims='{"sub":"be222222-2222-4222-8222-222222222222","role":"authenticated"}';
select extensions.is((select count(*)::integer from public.channel_events where workspace_id=current_setting('ch.a')::uuid),0,'Other workspace cannot read event metadata');
select extensions.throws_ok($$select public.create_human_reply(current_setting('ch.a')::uuid,current_setting('ch.ig_conversation')::uuid,gen_random_uuid(),'Forged reply')$$,'42501',null,'Other workspace cannot send human replies');
set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
do $$ declare d jsonb;begin d:=public.claim_message_delivery(current_setting('ch.ig_human')::uuid);perform set_config('ch.human_delivery',d->>'deliveryId',true);end $$;
select extensions.lives_ok($$select public.finish_message_delivery(current_setting('ch.human_delivery')::uuid,'sent','provider-human-mid',null)$$,'Human Instagram reply finishes one claimed delivery');
select extensions.is(public.claim_message_delivery(current_setting('ch.ig_human')::uuid),null::jsonb,'Successful human reply cannot be resent by replay');

-- Foundation Test Agent continues to work but never generates staff notifications.
do $$ declare r record; begin
 select * into r from public.begin_agent_turn('ae111111-1111-4111-8111-111111111111',current_setting('ch.a')::uuid,null,gen_random_uuid(),'I want a human.');
 perform set_config('ch.test_conversation',r.conversation_id::text,true);
 perform public.finish_agent_turn('ae111111-1111-4111-8111-111111111111',r.run_id,'This test needs human assistance.','[]',true,null);
end $$;
set local role authenticated;
set local request.jwt.claims='{"sub":"ae111111-1111-4111-8111-111111111111","role":"authenticated"}';
select extensions.is((select count(*)::integer from public.business_notifications where conversation_id=current_setting('ch.test_conversation')::uuid),0,'Test Agent emits no staff email ledger');
select extensions.lives_ok($$select public.configure_website_channel(current_setting('ch.a')::uuid,false,array['https://northstar.example'])$$,'Owner can disable Website Chat');
set local role service_role;
set local request.jwt.claims='{"role":"service_role"}';
select extensions.is(public.website_origin_allowed(current_setting('ch.public_a')::uuid,'https://northstar.example'),false,'Disabled Website Chat denies even an approved origin');

select * from extensions.finish();
rollback;
