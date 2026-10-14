# Managed Instagram setup

## Official provider contract audit

Reviewed **2026-10-15, Europe/Istanbul** using current official Meta documentation/search records. Direct full-page fetches were rate-limited (HTTP 429); no community or legacy application claims are used as provider authority. No live Meta account, transport, app review or callback was tested during implementation.

| Area | Supported contract / chosen V1 bound | Official source |
| --- | --- | --- |
| Account/API family | Instagram API with Instagram Login; professional Business or Creator account; a Facebook Page is not required. Personal accounts are excluded. | [Instagram Login](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login) |
| Version | Explicit `v26.0`, the current version in Meta's retrieved changelog and send examples. V1 rejects unreviewed versions. | [Graph changelog](https://developers.facebook.com/docs/graph-api/changelog/) |
| Permissions | `instagram_business_basic` and `instagram_business_manage_messages`; Instagram user access token. Confirm these grants in the app dashboard for the target account. | [Send messages](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api) |
| Send | `POST https://graph.instagram.com/v26.0/{professional-account-id}/messages`, recipient is the Instagram-scoped sender from a verified inbound DM. Text is UTF-8 and at most 1000 **bytes**. | [Send messages](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api) |
| Initiation/window | Customer initiates the DM. V1 enforces 24 hours from the latest genuine provider customer timestamp for AI **and human** sends. No cold outreach or automatic extension. Other Meta features/windows are not implemented. | [Send messages](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/messaging-api) |
| Human Agent extension | Meta documents a separately permitted human-agent feature up to seven days. V1 does not request/use that feature or tag; its stricter 24-hour bound still applies to human Inbox replies. | [Human Agent](https://developers.facebook.com/documentation/development/features-reference/human-agent) |
| Webhooks | Configure Instagram object/messages at app level and subscribe the professional account's `/{id}/subscribed_apps` to `messages`. Callback must be public HTTPS. GET echoes challenge only for the configured verify token. | [Webhook setup](https://developers.facebook.com/documentation/instagram-platform/webhooks/setup), [Webhooks](https://developers.facebook.com/documentation/instagram-platform/webhooks) |
| Signature | `X-Hub-Signature-256`, `sha256=` HMAC-SHA256 of exact raw body using the configured app secret. Check before JSON parsing. | [Webhook setup](https://developers.facebook.com/documentation/instagram-platform/webhooks/setup) |
| Review | Standard Access supports the documented own/managed-account case. Serving customer accounts may require Advanced Access, Meta App Review and Business Verification. Founder assistance does not bypass Meta eligibility/review. | [App review](https://developers.facebook.com/documentation/instagram-platform/app-review), [Overview](https://developers.facebook.com/documentation/instagram-platform/overview) |

Operator must reconfirm eligibility, permissions and current review requirements in the actual Meta app before a real customer is enabled. This repository supports only the audited family/subset, not every Instagram account or Messenger/Facebook Login setup.

## Preparation

- Independent Avenlyo Supabase project with Foundation + Channels migrations, correct backend key and an explicit workspace with an active owner.
- Meta developer app configured for Instagram API with Instagram Login; professional test account owned/managed by the operator. Accept required tester/app roles in development, obtain the specified grants and enable API message access in the account's connected-tools settings where required.
- Instagram user token acquired through Meta's supported managed dashboard/authorization flow. No OAuth UI is added to Avenlyo. Handle token expiry/revocation by re-verifying and running provisioning again; no automatic refresh is claimed.
- Public HTTPS URL pointing at the Fastify API's `/v1/webhooks/instagram`, configured in the Meta Instagram/messages subscription. Correct app ID/secret and verify token for that subscription, with version v26.0.
- If serving accounts outside Standard Access, complete required Business Verification, Advanced Access/App Review, Live mode and Meta's privacy/data deletion requirements before real traffic. A test role alone is not proof of production permission.

API/operator-only variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `INSTAGRAM_META_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`, `INSTAGRAM_API_VERSION=v26.0`, `INSTAGRAM_WEBHOOK_URL`. The last URL is exact and ends `/v1/webhooks/instagram`. For actual AI, configure the Foundation OpenAI key/model and publish knowledge. Keep every secret out of web/`NEXT_PUBLIC_` environment values.

## Provisioning

Store the Instagram access token in a private file outside the repository. On Linux/macOS use mode 0600; the CLI refuses symlinks, non-owned files and group/world-readable files. On Windows protect the file with user-only ACLs. Do not put a token in command arguments or console output.

Local dry run (uses live Meta **reads** when you run it; deterministic tests never execute this live command):

```bash
pnpm instagram:provision --workspace <workspace-uuid> --target local --confirm-workspace-name "Northstar Studio" --account <professional-account-id> --username <expected-username> --token-file /absolute/private/instagram-token --dry-run
```

Hosted target:

```bash
pnpm instagram:provision --workspace <workspace-uuid> --target <project-ref> --confirm-production <project-ref> --confirm-workspace-name "Northstar Studio" --account <professional-account-id> --username <expected-username> --token-file /absolute/private/instagram-token --dry-run
```

Remove `--dry-run` only after inspecting the displayed target/workspace/account. Hosted acknowledgement is required even for a dry run. URL must exactly match `https://<project-ref>.supabase.co`; `local` means only `http://127.0.0.1:55321`. Custom/legacy/arbitrary DB URLs are not silently accepted.

The CLI checks the exact workspace name and current owner, queries `/me?fields=user_id,username,account_type`, verifies the expected professional ID/type/username, checks this app's Instagram/messages HTTPS callback subscription, verifies the application challenge, and reads the account's subscribed apps. A dry run never writes to Meta or Supabase. A real run installs a missing `messages` subscription, reads it back for the expected app ID, and only then stores the encrypted token and enables the channel. Account ownership cannot be moved across workspaces; conflicting IDs fail without changing a token.

## Credential storage

`vault.create_secret`/`vault.update_secret` encrypt the token at rest. A private RLS-protected `channel_credentials` row holds only the Vault UUID for its connection. Workspace channel metadata has no access token or secret reference. Raw Vault schema/table/function access is revoked from anon, authenticated and service roles. Protected backend definer functions access Vault as their owner; only `claim_message_delivery` returns decrypted text to the Fastify transport after a valid delivery claim. The operator provisioning RPC is service-only and is never a web route.

The database/API host and its administrators remain privileged. Protect database backups/root keys, server credentials and operator machines. See [Supabase Vault](https://supabase.com/docs/guides/database/vault).

## Optional live manual test

1. Use a separate professional test account and independent development project; configure a reachable HTTPS callback, app/messages and account subscriptions, permissions and tester eligibility as above.
2. Run dry provisioning for the explicit project/workspace/account; then run the reviewed actual command. Channels must show the verified account as Connected.
3. Start the production API/web with development keys. Publish a logo-design description and require Name + Email in Agent.
4. From an eligible customer test account initiate a DM: `I'm interested in your logo design.` Expect a bounded answer based on the published knowledge. Send `I'm Alex. My email is alex@example.test.` Expect one Instagram lead and a real Inbox thread.
5. Ask `I want to speak with a person.` Expect paused AI. Claim in Inbox, send a human reply inside the standard window and inspect its provider acceptance. A further customer DM must not trigger AI until explicit Resume AI.
6. Check webhook replay produces no duplicates. An expired window is blocked; an unknown send is not automatically repeated. Do not infer delivery/read success just from an API-accepted message.
7. In Channels, Disconnect Instagram removes the stored Vault token and blocks pending sends. Remove the account/app authorization in Meta/Instagram and revoke the test token through the provider's supported controls. Delete the private token file and unset local app/verify secrets. Already accepted/in-flight provider messages cannot be recalled by disconnecting.

External blockers: Meta app eligibility/review, professional account grant/token, publicly reachable callback, correct signing secret, account/message subscriptions, token validity and supported reply window. None is bypassed or claimed verified by fake CI transports.
