import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
if (process.env.SUPABASE_URL !== "http://127.0.0.1:55321")
  throw Error("Disposable local stack required");
function command(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  if (r.status !== 0) throw Error(`${cmd} failed: ${r.stderr}`);
  return r.stdout.trim();
}
function sql(query) {
  return command("docker", [
    "exec",
    "supabase_db_avenlyo-app",
    "psql",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
    "-At",
    "-c",
    query,
  ]);
}
command("supabase", ["db", "reset", "--local", "--version", "20261020114322"]);
sql(`insert into auth.users(id,aud,role,email) values('afa11111-1111-4111-8111-111111111111','authenticated','authenticated','agent-upgrade@example.test');
set request.jwt.claims='{"sub":"afa11111-1111-4111-8111-111111111111","role":"authenticated"}';
select create_workspace('Agent upgrade fixture');
select save_agent_settings((select id from workspaces limit 1),'{"tone":"warm","goals":["answer_questions","identify_interest","qualify_inquiries","collect_contact","human_handoff"],"contact_fields":["email"],"human_handoff_enabled":true,"setup_brief":"Preserve the existing role."}');
select configure_website_channel((select id from workspaces limit 1),true,array['https://upgrade.example']);
select save_business_knowledge((select id from workspaces limit 1),null,'custom_note','Approved services','We provide design services.',null,'','','',null);
set request.jwt.claims='{"role":"service_role"}';
select publish_knowledge_item('afa11111-1111-4111-8111-111111111111',(select id from workspaces limit 1),(select id from knowledge_items limit 1),1,('['||'1,'||repeat('0,',1534)||'0]')::extensions.vector);
do $$ declare r record;begin select * into r from begin_agent_turn('afa11111-1111-4111-8111-111111111111',(select id from workspaces limit 1),null,gen_random_uuid(),'I need a design service. My email is upgrade@example.test.');
perform finish_agent_turn('afa11111-1111-4111-8111-111111111111',r.run_id,'We provide design services.','[]',false,'{"name":null,"email":"upgrade@example.test","phone":null,"company":null,"intent":"service_inquiry","qualification":"qualified","summary":"Design inquiry."}');end $$;
select create_website_session((select public_id from channel_connections limit 1),'https://upgrade.example',repeat('d',64));
set request.jwt.claims='{"sub":"afa11111-1111-4111-8111-111111111111","role":"authenticated"}';
select sync_onboarding((select id from workspaces limit 1));`);
const tables = [
  "workspaces",
  "workspace_members",
  "agent_settings",
  "knowledge_items",
  "knowledge_collections",
  "channel_connections",
  "conversations",
  "messages",
  "leads",
  "agent_runs",
  "website_sessions",
];
const columns = Object.fromEntries(
  tables.map((t) => [
    t,
    sql(
      `select string_agg(quote_ident(column_name),',' order by ordinal_position) from information_schema.columns where table_schema='public' and table_name='${t}'`,
    ),
  ]),
);
function snapshot() {
  return Object.fromEntries(
    tables.map((t) => [
      t,
      sql(
        `select coalesce(jsonb_agg(to_jsonb(r) order by to_jsonb(r)::text)::text,'[]') from (select ${columns[t]} from public.${t}) r`,
      ),
    ]),
  );
}
const before = snapshot();
assert.ok(
  JSON.parse(before.workspaces)[0].onboarding_completed_at,
  "Fixture must have durable completion",
);
assert.ok(JSON.parse(before.leads).length, "Fixture must have lead history");
command("supabase", ["migration", "up", "--local"]);
assert.deepEqual(
  snapshot(),
  before,
  "Agent upgrade must preserve every original column in existing records",
);
assert.equal(sql("select count(*) from agents where is_default"), "1");
assert.equal(
  sql(
    "select count(*) from agents a join agent_settings s using(workspace_id) where (a.setup_brief,a.tone,a.goals,a.contact_fields) is distinct from (s.setup_brief,s.tone,s.goals,s.contact_fields)",
  ),
  "0",
);
assert.equal(
  sql("select language_policy from agents where is_default"),
  "legacy_multilingual",
);
assert.equal(
  sql(
    "select count(*) from channel_connections c join agents a on a.id=c.agent_id where a.workspace_id=c.workspace_id and a.is_default",
  ),
  "1",
);
assert.equal(
  sql(
    "select count(*) from conversations c where not exists(select 1 from agents a where a.id=c.agent_id and a.workspace_id=c.workspace_id and a.is_default)",
  ),
  "0",
);
console.info(
  "Current schema → Agent V2 upgrade passed: all original fields, settings, Knowledge, provider state, completion, leads and history preserved.",
);
