import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
if (process.env.SUPABASE_URL !== "http://127.0.0.1:55321")
  throw new Error(
    "Upgrade acceptance requires the independent disposable local stack",
  );
const migration = readFileSync(
  "supabase/migrations/20261013221636_foundation_v1.sql",
);
assert.equal(
  createHash("sha256").update(migration).digest("hex"),
  "2c4c96b3a5372c6415850e42135e40a14397f7f197ee9f6731cc7a1de82f21dd",
  "Foundation migration history was changed",
);
function sql(query) {
  const result = spawnSync(
    "docker",
    [
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
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0)
    throw new Error("Disposable upgrade database query failed");
  return result.stdout.trim();
}
const snapshot = `select jsonb_build_object(
 'conversations',(select md5(coalesce(jsonb_agg(jsonb_build_array(id,workspace_id,channel,status,ai_mode,created_by,created_at,updated_at) order by id)::text,'[]')) from public.conversations),
 'messages',(select md5(coalesce(jsonb_agg(jsonb_build_array(id,workspace_id,conversation_id,role,content,sources,created_at) order by id)::text,'[]')) from public.messages),
 'leads',(select md5(coalesce(jsonb_agg(jsonb_build_array(id,workspace_id,conversation_id,name,email,phone,company,intent,qualification,summary,status,source,created_at,updated_at) order by id)::text,'[]')) from public.leads),
 'runs',(select md5(coalesce(jsonb_agg(jsonb_build_array(id,workspace_id,conversation_id,actor_id,idempotency_key,customer_content,status,response,created_at,updated_at) order by id)::text,'[]')) from public.agent_runs),
 'testCount',(select count(*) from public.conversations where channel='test_agent'),
 'leadCount',(select count(*) from public.leads)
 )`;
const knowledgeSnapshot = `select coalesce(jsonb_agg(jsonb_build_array(id,workspace_id,type,title,content,status,revision,embedding::text,created_at,updated_at) order by id)::text,'[]') from public.knowledge_items`;
const knowledgeBefore = sql(knowledgeSnapshot);
const before = JSON.parse(sql(snapshot));
assert(
  before.testCount > 0 && before.leadCount > 0,
  "Run Foundation acceptance before the upgrade check",
);
const applied = spawnSync("supabase", ["migration", "up", "--local"], {
  stdio: "inherit",
});
assert.equal(applied.status, 0, "Additive local upgrade failed");
const after = JSON.parse(sql(snapshot));
assert.equal(
  sql(knowledgeSnapshot),
  knowledgeBefore,
  "Existing Knowledge records changed during the additive upgrade",
);
assert.equal(
  sql(
    "select count(*) from public.knowledge_items where type in ('text','faq') and runtime_content<>content",
  ),
  "0",
  "Legacy Text/FAQ runtime representation changed",
);
assert.deepEqual(
  after,
  before,
  "Foundation records changed during the additive upgrade",
);
assert.equal(
  sql(
    "select count(*) from pg_tables where schemaname='public' and tablename in ('channel_connections','website_sessions','channel_events','message_deliveries','business_notifications')",
  ),
  "5",
);
console.info(
  `Foundation → Channels additive upgrade passed; ${before.testCount} existing test conversations and ${before.leadCount} leads retained with identical original fields.`,
);
