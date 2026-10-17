# Channels & Handoff security review

Scope: independent Foundation plus additive Channels migration. No hosted production database, provider credentials or deployment was used. Automated checks use real disposable Auth/RLS/PostgreSQL/API and fake OpenAI/Meta/Resend.

| Boundary | Control and verification |
| --- | --- |
| Public session authorization | 32 random bytes; SHA-256 only in the DB; credential bound to connection/workspace/conversation/Origin/expiry. No Auth user or authenticated workspace grant for a visitor. Invalid/expired/other-tenant sessions are denied. Hash column is not readable by members. |
| Origin enforcement | Exact allowlist, HTTPS or explicit HTTP localhost; no wildcard/path/userinfo. Session, message, thread and preflight check mapping; SQL validates again. Disabled channel/removed Origin takes effect on existing sessions. |
| Tenant mapping | Opaque public ID or verified provider account maps on the server. Public bodies accept no workspace/role/recipient authority. Composite FKs link connection/conversation/session/message/delivery within the same workspace. Cross-tenant read/claim/reply/provision tests cover actual RLS. |
| Test Agent | Still fresh Auth + current membership; its begin/resume/finish capabilities cannot inject into real channel conversations or operate external runs. Foundation migration and original record fields are preserved by upgrade acceptance. |
| Webhook signature | Exact bounded Buffer, HMAC-SHA256 timing-safe comparison before JSON parse. GET token timing-safe check. Invalid signature on malformed JSON is rejected before parsing; 128 KB limit. Unsupported/non-text/echo/deleted/mismatched-account events are ignored. |
| Provider replay | Unique connection/provider-message ID plus normalized payload hash. Replay cannot create another customer turn/assistant/lead/delivery/notification; changed evidence is rejected. Sender ID remains unverified channel identity. |
| Outbound idempotency | Unique message delivery, DB claim before network, one provider attempt. Human nonce replays one stored message. Concurrent API workers cannot claim the same pending record. |
| Ambiguous sends | Network errors, unconfirmed 2xx and ambiguous 5xx record unknown; no automatic resend. Interrupted sending closes unknown after one minute. Unknown/failed provider sends pause active AI; Inbox shows attention. Resend also receives the ledger ID as its idempotency key. |
| Credential storage | Vault encryption, private reference table/RLS and revoked raw secret access. Only backend provisioning and delivery claims touch decrypted values. No token in web tables, browser bundles, argv or logs. Tests use explicitly fictional credentials. |
| Service role containment | Fastify/operator only. Web BFF forwards a freshly verified team JWT. Raw app DML is revoked; privileged RPCs require backend role and bounded live context. Private helpers have no public execution grants and fixed empty search paths. |
| Human ownership | Current active members only; claim is atomic; only claim owner sends a new reply/releases. Another active assignee's resume is denied. Revoked members are rechecked despite old valid JWTs. |
| Pause/resume | Server policy only. Claim/reply/release never auto-resume. Paused input stores no extra AI reply or model call. State-version check suppresses an in-flight model result after a team transition; pending assistant delivery rechecks state. Only the bounded deterministic first handoff notice is eligible while paused. |
| Notification deduplication | Unique conversation/kind, real channels only. Verified current owner chosen in DB, no public recipient field. Failure/unknown/suppression is durable and separate from customer/lead commit. Test Agent emits no ledger/email. |
| Logging | Structured route/event/error state only; request serializer removes query and all private payloads. No exception object/provider body is logged. Actual logger tests check private-message, bearer, app, verify and backend-key markers are absent. |
| Reply restrictions | Instagram Login v26 text only, 1000 UTF-8 bytes, customer-initiated standard 24-hour bound for AI/human. No cold outreach, Human Agent tag extension, alternate provider family or arbitrary sending capability. |

## Practical limits and residual risks

- Origin is a browser boundary, not proof of a non-browser caller's identity. An attacker can spoof HTTP Origin and obtain their own public chat session. Per-instance IP budgets, durable per-session turn limits and bounded provider calls constrain abuse; a high-traffic/multi-instance deployment needs shared ingress budgets. CAPTCHA and a generic event platform are intentionally absent.
- JavaScript on an approved business origin can access that origin's visitor credential. The widget uses Shadow DOM and `textContent`, not untrusted HTML, but cannot secure a compromised host website. Use HTTPS and secure the website/CSP.
- API/Vault administrators and server secrets are privileged. A service-role compromise is outside tenant-user isolation; keep operator keys/file ACLs, logging/bind-parameter configuration and backups controlled. Windows token-file ACLs are an operator responsibility.
- No transaction can atomically commit a PostgreSQL record and a provider's network send. A claimed send already in flight cannot be recalled by a later claim/disconnect. Unknown outcomes stop automatic retries; delivery acceptance is not a guarantee. Staff must inspect the channel before composing a separate follow-up.
- Provider callback, app review/Advanced Access, token permissions/expiry and real transport were not tested live. Meta direct-page fetches returned 429; current official indexed contract records were audited and linked. Reconfirm actual app eligibility during provisioning. Token refresh is operator-managed.
- Sessions expire but their associated history/idempotency evidence is retained. No deletion/retention automation is added. This is a small pilot implementation, not a high-scale queue or compliance retention product.

No known unresolved cross-tenant or credential-exposure gap is intentionally accepted. The listed limitations are material operational boundaries, not claims of guaranteed delivery or universal Instagram support.
