-- Preserve the database-enforced pause policy in configured response languages.
-- Only canonical strings can replace the original English safety notice.
create table private.agent_policy_replies(language_code text primary key,customer_pause text not null,test_pause text not null);
alter table private.agent_policy_replies enable row level security;
revoke all on private.agent_policy_replies from public,anon,authenticated,service_role;
insert into private.agent_policy_replies values
('en','A team member can continue this conversation. Automated answers are paused.','This test conversation is paused for human assistance. No automatic customer answer has been sent.'),
('tr','Bir ekip üyesi bu görüşmeye devam edebilir. Otomatik yanıtlar duraklatıldı.','Test: Bir ekip üyesi bu görüşmeye devam edebilir. Otomatik yanıtlar duraklatıldı.'),
('de','Ein Teammitglied kann dieses Gespräch fortsetzen. Automatische Antworten sind pausiert.','Test: Ein Teammitglied kann dieses Gespräch fortsetzen. Automatische Antworten sind pausiert.'),
('fr','Un membre de l’équipe peut poursuivre cette conversation. Les réponses automatiques sont suspendues.','Test: Un membre de l’équipe peut poursuivre cette conversation. Les réponses automatiques sont suspendues.'),
('es','Un miembro del equipo puede continuar esta conversación. Las respuestas automáticas están en pausa.','Test: Un miembro del equipo puede continuar esta conversación. Las respuestas automáticas están en pausa.'),
('it','Un membro del team può continuare questa conversazione. Le risposte automatiche sono in pausa.','Test: Un membro del team può continuare questa conversazione. Le risposte automatiche sono in pausa.'),
('pt','Um membro da equipa pode continuar esta conversa. As respostas automáticas estão em pausa.','Test: Um membro da equipa pode continuar esta conversa. As respostas automáticas estão em pausa.'),
('nl','Een teamlid kan dit gesprek voortzetten. Automatische antwoorden zijn gepauzeerd.','Test: Een teamlid kan dit gesprek voortzetten. Automatische antwoorden zijn gepauzeerd.'),
('ar','يمكن لأحد أعضاء الفريق متابعة هذه المحادثة. تم إيقاف الردود الآلية مؤقتًا.','Test: يمكن لأحد أعضاء الفريق متابعة هذه المحادثة. تم إيقاف الردود الآلية مؤقتًا.'),
('ru','Сотрудник команды может продолжить этот разговор. Автоматические ответы приостановлены.','Test: Сотрудник команды может продолжить этот разговор. Автоматические ответы приостановлены.'),
('uk','Співробітник команди може продовжити цю розмову. Автоматичні відповіді призупинено.','Test: Співробітник команди може продовжити цю розмову. Автоматичні відповіді призупинено.'),
('pl','Członek zespołu może kontynuować tę rozmowę. Automatyczne odpowiedzi są wstrzymane.','Test: Członek zespołu może kontynuować tę rozmowę. Automatyczne odpowiedzi są wstrzymane.'),
('ro','Un membru al echipei poate continua această conversație. Răspunsurile automate sunt suspendate.','Test: Un membru al echipei poate continua această conversație. Răspunsurile automate sunt suspendate.'),
('el','Ένα μέλος της ομάδας μπορεί να συνεχίσει αυτή τη συνομιλία. Οι αυτόματες απαντήσεις έχουν τεθεί σε παύση.','Test: Ένα μέλος της ομάδας μπορεί να συνεχίσει αυτή τη συνομιλία. Οι αυτόματες απαντήσεις έχουν τεθεί σε παύση.'),
('bg','Член на екипа може да продължи този разговор. Автоматичните отговори са на пауза.','Test: Член на екипа може да продължи този разговор. Автоматичните отговори са на пауза.'),
('sv','En medarbetare kan fortsätta det här samtalet. Automatiska svar är pausade.','Test: En medarbetare kan fortsätta det här samtalet. Automatiska svar är pausade.'),
('da','En medarbejder kan fortsætte denne samtale. Automatiske svar er sat på pause.','Test: En medarbejder kan fortsætte denne samtale. Automatiske svar er sat på pause.'),
('no','En medarbeider kan fortsette denne samtalen. Automatiske svar er satt på pause.','Test: En medarbeider kan fortsette denne samtalen. Automatiske svar er satt på pause.'),
('fi','Tiimin jäsen voi jatkaa tätä keskustelua. Automaattiset vastaukset on keskeytetty.','Test: Tiimin jäsen voi jatkaa tätä keskustelua. Automaattiset vastaukset on keskeytetty.'),
('cs','Člen týmu může pokračovat v této konverzaci. Automatické odpovědi jsou pozastaveny.','Test: Člen týmu může pokračovat v této konverzaci. Automatické odpovědi jsou pozastaveny.'),
('hu','A csapat egyik tagja folytathatja ezt a beszélgetést. Az automatikus válaszok szünetelnek.','Test: A csapat egyik tagja folytathatja ezt a beszélgetést. Az automatikus válaszok szünetelnek.'),
('he','חבר צוות יכול להמשיך בשיחה הזו. התשובות האוטומטיות מושהות.','Test: חבר צוות יכול להמשיך בשיחה הזו. התשובות האוטומטיות מושהות.'),
('hi','टीम का कोई सदस्य इस बातचीत को आगे बढ़ा सकता है। स्वचालित उत्तर रोक दिए गए हैं।','Test: टीम का कोई सदस्य इस बातचीत को आगे बढ़ा सकता है। स्वचालित उत्तर रोक दिए गए हैं।'),
('bn','দলের একজন সদস্য এই কথোপকথন চালিয়ে যেতে পারেন। স্বয়ংক্রিয় উত্তর সাময়িকভাবে বন্ধ আছে।','Test: দলের একজন সদস্য এই কথোপকথন চালিয়ে যেতে পারেন। স্বয়ংক্রিয় উত্তর সাময়িকভাবে বন্ধ আছে।'),
('ur','ٹیم کا کوئی رکن یہ گفتگو جاری رکھ سکتا ہے۔ خودکار جوابات عارضی طور پر روک دیے گئے ہیں۔','Test: ٹیم کا کوئی رکن یہ گفتگو جاری رکھ سکتا ہے۔ خودکار جوابات عارضی طور پر روک دیے گئے ہیں۔'),
('fa','یکی از اعضای تیم می‌تواند این گفتگو را ادامه دهد. پاسخ‌های خودکار موقتاً متوقف شده‌اند.','Test: یکی از اعضای تیم می‌تواند این گفتگو را ادامه دهد. پاسخ‌های خودکار موقتاً متوقف شده‌اند.'),
('zh','团队成员可以继续此对话。自动回复已暂停。','Test: 团队成员可以继续此对话。自动回复已暂停。'),
('ja','チームの担当者がこの会話を続けることができます。自動応答は一時停止しています。','Test: チームの担当者がこの会話を続けることができます。自動応答は一時停止しています。'),
('ko','팀 담당자가 이 대화를 이어갈 수 있습니다. 자동 응답이 일시 중지되었습니다.','Test: 팀 담당자가 이 대화를 이어갈 수 있습니다. 자동 응답이 일시 중지되었습니다.'),
('id','Anggota tim dapat melanjutkan percakapan ini. Balasan otomatis dijeda.','Test: Anggota tim dapat melanjutkan percakapan ini. Balasan otomatis dijeda.'),
('ms','Ahli pasukan boleh meneruskan perbualan ini. Balasan automatik dijeda.','Test: Ahli pasukan boleh meneruskan perbualan ini. Balasan automatik dijeda.'),
('vi','Một thành viên trong nhóm có thể tiếp tục cuộc trò chuyện này. Trả lời tự động đã tạm dừng.','Test: Một thành viên trong nhóm có thể tiếp tục cuộc trò chuyện này. Trả lời tự động đã tạm dừng.'),
('th','เจ้าหน้าที่ในทีมสามารถสนทนาต่อได้ การตอบกลับอัตโนมัติหยุดชั่วคราวแล้ว','Test: เจ้าหน้าที่ในทีมสามารถสนทนาต่อได้ การตอบกลับอัตโนมัติหยุดชั่วคราวแล้ว'),
('sw','Mwanachama wa timu anaweza kuendeleza mazungumzo haya. Majibu ya kiotomatiki yamesitishwa kwa muda.','Test: Mwanachama wa timu anaweza kuendeleza mazungumzo haya. Majibu ya kiotomatiki yamesitishwa kwa muda.'),
('af','''n Spanlid kan hierdie gesprek voortsit. Outomatiese antwoorde is onderbreek.','Test: ''n Spanlid kan hierdie gesprek voortsit. Outomatiese antwoorde is onderbreek.'),
('sr','Član tima može da nastavi ovaj razgovor. Automatski odgovori su pauzirani.','Test: Član tima može da nastavi ovaj razgovor. Automatski odgovori su pauzirani.'),
('hr','Član tima može nastaviti ovaj razgovor. Automatski odgovori su pauzirani.','Test: Član tima može nastaviti ovaj razgovor. Automatski odgovori su pauzirani.'),
('sk','Člen tímu môže pokračovať v tejto konverzácii. Automatické odpovede sú pozastavené.','Test: Člen tímu môže pokračovať v tejto konverzácii. Automatické odpovede sú pozastavené.'),
('sl','Član ekipe lahko nadaljuje ta pogovor. Samodejni odgovori so začasno ustavljeni.','Test: Član ekipe lahko nadaljuje ta pogovor. Samodejni odgovori so začasno ustavljeni.'),
('lt','Komandos narys gali tęsti šį pokalbį. Automatiniai atsakymai pristabdyti.','Test: Komandos narys gali tęsti šį pokalbį. Automatiniai atsakymai pristabdyti.'),
('lv','Komandas dalībnieks var turpināt šo sarunu. Automātiskās atbildes ir apturētas.','Test: Komandas dalībnieks var turpināt šo sarunu. Automātiskās atbildes ir apturētas.'),
('et','Meeskonnaliige saab seda vestlust jätkata. Automaatsed vastused on peatatud.','Test: Meeskonnaliige saab seda vestlust jätkata. Automaatsed vastused on peatatud.'),
('ca','Un membre de l’equip pot continuar aquesta conversa. Les respostes automàtiques estan en pausa.','Test: Un membre de l’equip pot continuar aquesta conversa. Les respostes automàtiques estan en pausa.'),
('fil','Maaaring ipagpatuloy ng isang miyembro ng team ang pag-uusap na ito. Naka-pause ang mga awtomatikong sagot.','Test: Maaaring ipagpatuloy ng isang miyembro ng team ang pag-uusap na ito. Naka-pause ang mga awtomatikong sagot.');
create function private.fixed_agent_policy_reply(target_agent_id uuid,target_channel text,proposed text) returns text
language plpgsql stable security definer set search_path='' as $$
declare result text;
begin
  select case when target_channel='test_agent' then p.test_pause else p.customer_pause end into result
    from private.agent_policy_replies p join public.agents a on a.id=target_agent_id
    where (p.language_code=a.primary_language or p.language_code=any(a.additional_languages) or a.language_policy='legacy_multilingual')
    and proposed=case when target_channel='test_agent' then p.test_pause else p.customer_pause end;
  if result is null then select case when target_channel='test_agent' then p.test_pause else p.customer_pause end into result from private.agent_policy_replies p where p.language_code='en'; end if;
  return result;
end; $$;
revoke all on function private.fixed_agent_policy_reply(uuid,text,text) from public,anon,authenticated,service_role;
create or replace function private.commit_runtime_turn(target_run_id uuid,assistant_content text,source_references jsonb,request_human boolean,lead_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.agent_runs; c public.conversations; settings public.agents; lead_id uuid; evidence text; contact_key text; proposed text; effective_human boolean; result jsonb; facts jsonb; prior public.leads; qualification text; reply_message_id uuid; durable_reply text; suppress_reply boolean; new_handoff boolean;
begin
  select * into r from public.agent_runs where id=target_run_id;
  select * into c from public.conversations where id=r.conversation_id for update;
  select * into r from public.agent_runs where id=target_run_id for update;
  if r.status='completed' then return r.response; end if;
  if r.status<>'processing' then raise exception using errcode='40001',message='Turn not active'; end if;
  if assistant_content is null or length(btrim(assistant_content)) not between 1 and 2500 or source_references is null or jsonb_typeof(source_references)<>'array' or jsonb_array_length(source_references)>5 then raise exception using errcode='22023',message='Invalid response'; end if;
  settings:=private.require_agent(r.workspace_id,c.agent_id);
  suppress_reply:=c.channel<>'test_agent' and (c.ai_mode='paused' or c.state_version is distinct from r.state_version);
  if c.channel<>'test_agent' and c.state_version is distinct from r.state_version then
    request_human:=false; lead_payload:=null; source_references:='[]'::jsonb;
  end if;
  if exists(select 1 from jsonb_array_elements(source_references) src where not exists(select 1 from public.knowledge_items k where k.id::text=src->>'id' and k.workspace_id=r.workspace_id and k.status='published' and k.revision::text=src->>'revision' and private.agent_can_use_knowledge(r.workspace_id,c.agent_id,k.id))) then raise exception using errcode='40001',message='Knowledge publication changed'; end if;
  effective_human:=request_human or c.ai_mode='paused' or not ('answer_questions'=any(settings.goals));
  new_handoff:=effective_human and c.ai_mode='active';
  if effective_human then
    update public.conversations set status='needs_human',ai_mode='paused',handoff_state=case when assignee_id is null then 'requested' else 'claimed' end,handoff_at=coalesce(handoff_at,now()),state_version=state_version+case when new_handoff then 1 else 0 end,updated_at=now() where id=c.id;
  end if;
  select string_agg(m.content,E'\n' order by m.created_at,m.id) into evidence from (select msg.content,msg.created_at,msg.id from public.messages msg where msg.conversation_id=c.id and msg.role='customer' order by msg.created_at desc,msg.id desc limit 24) m;
  if lead_payload is not null then
    if jsonb_typeof(lead_payload)<>'object' or lead_payload-array['name','email','phone','company','intent','qualification','summary']<>'{}'::jsonb or lead_payload->>'intent'<>'service_inquiry' or length(lead_payload->>'summary') not between 1 and 600 then raise exception using errcode='22023',message='Invalid lead'; end if;
    if not ('identify_interest'=any(settings.goals) and 'collect_contact'=any(settings.goals)) then raise exception using errcode='42501',message='Lead collection restricted'; end if;
    if evidence !~* '(interested (in|to)|looking for|would like|I.d like|I (want|need)|request (a )?quote|ilgileniyorum|teklif (almak|istiyorum)|hizmet almak)' or evidence !~* '(service|project|design|manufactur|quote|consultation|repair|restoration|order|hizmet|proje|tasarım|üretim|teklif|onarım)' then raise exception using errcode='22023',message='Service interest required'; end if;
    if r.customer_content ~* '(not interested|just browsing|no thanks|do not contact|don.t contact|ilgilenmiyorum|istemiyorum|sadece bakıyorum)' then raise exception using errcode='22023',message='Customer declined'; end if;
    facts:='{}'::jsonb;
    foreach contact_key in array array['name','email','phone','company'] loop
      proposed:=nullif(btrim(lead_payload->>contact_key),'');
      if proposed is not null then
        if not contact_key=any(settings.contact_fields) or position(lower(proposed) in lower(evidence))=0 then raise exception using errcode='22023',message='Contact evidence required'; end if;
        if contact_key='email' and proposed !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception using errcode='22023',message='Invalid email'; end if;
        facts:=facts||jsonb_build_object(contact_key,proposed);
      end if;
    end loop;
    if facts='{}'::jsonb then raise exception using errcode='22023',message='Contact details required'; end if;
    select * into prior from public.leads l where l.conversation_id=c.id;
    facts:=jsonb_strip_nulls(jsonb_build_object('name',prior.name,'email',prior.email,'phone',prior.phone,'company',prior.company))||facts;
    qualification:=case when effective_human then 'needs_human' when 'qualify_inquiries'=any(settings.goals) and not exists(select 1 from unnest(settings.contact_fields) f where nullif(facts->>f,'') is null) then 'qualified' else 'needs_info' end;
    insert into public.leads(workspace_id,conversation_id,name,email,phone,company,intent,qualification,summary,source)
      values(r.workspace_id,c.id,facts->>'name',facts->>'email',facts->>'phone',facts->>'company','service_inquiry',qualification,lead_payload->>'summary',c.channel)
      on conflict(conversation_id) do update set name=excluded.name,email=excluded.email,phone=excluded.phone,company=excluded.company,qualification=excluded.qualification,summary=excluded.summary,updated_at=now() returning id into lead_id;
    if qualification='qualified' then perform private.enqueue_business_notification(c.id,'qualified_lead'); end if;
  else
    select l.id into lead_id from public.leads l where l.conversation_id=c.id;
    if effective_human then update public.leads set qualification='needs_human',updated_at=now() where conversation_id=c.id; end if;
  end if;
  durable_reply:=case when suppress_reply then '' when c.channel='test_agent' and (c.ai_mode='paused' or not ('answer_questions'=any(settings.goals))) then private.fixed_agent_policy_reply(settings.id,c.channel,assistant_content) when c.channel<>'test_agent' and not ('answer_questions'=any(settings.goals)) then private.fixed_agent_policy_reply(settings.id,c.channel,assistant_content) else assistant_content end;
  if not suppress_reply then
    if c.channel='instagram' and octet_length(durable_reply)>1000 then raise exception using errcode='22023',message='Instagram response too large'; end if;
    insert into public.messages(workspace_id,conversation_id,role,content,sources) values(r.workspace_id,c.id,'assistant',durable_reply,source_references) returning id into reply_message_id;
    perform private.create_message_delivery(reply_message_id,new_handoff);
  end if;
  if new_handoff then perform private.enqueue_business_notification(c.id,'human_assistance'); end if;
  result:=jsonb_build_object('conversationId',c.id,'reply',durable_reply,'messageId',reply_message_id,'leadId',lead_id,'needsHuman',effective_human,'sources',source_references,'replayed',false);
  update public.agent_runs set status='completed',response=result,updated_at=now() where id=r.id;
  if r.channel_event_id is not null then update public.channel_events set status='completed',updated_at=now() where id=r.channel_event_id; end if;
  update public.conversations set updated_at=clock_timestamp() where id=c.id;
  return result;
end; $$;
