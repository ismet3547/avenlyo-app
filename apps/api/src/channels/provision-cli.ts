import "dotenv/config";
import { lstat, readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@avenlyo-app/shared";
import { configSchema } from "../config.js";
import {
  ProvisionError,
  provisioningTarget,
  verifyManagedInstagram,
} from "./provision.js";
try {
  const config = configSchema.parse(process.env);
  const target = provisioningTarget(process.argv.slice(2), config);
  const file = await lstat(target["token-file"]);
  if (
    !file.isFile() ||
    file.isSymbolicLink() ||
    (process.platform !== "win32" &&
      ((file.mode & 0o077) !== 0 || file.uid !== process.getuid?.()))
  )
    throw new ProvisionError("PRIVATE_OWNED_TOKEN_FILE_REQUIRED");
  if (file.size > 4096) throw new ProvisionError("INVALID_TOKEN_FILE");
  const token = (await readFile(target["token-file"], "utf8")).trim();
  if (token.length < 20 || token.length > 4096)
    throw new ProvisionError("INVALID_TOKEN_FILE");
  const service = createClient<Database>(
    config.SUPABASE_URL!,
    config.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const inspected = await service.rpc("inspect_instagram_target", {
    target_workspace_id: target.workspace,
  });
  if (
    inspected.error ||
    !inspected.data ||
    typeof inspected.data !== "object" ||
    !("workspaceName" in inspected.data) ||
    inspected.data.workspaceName !== target["confirm-workspace-name"]
  )
    throw new ProvisionError("WORKSPACE_ACKNOWLEDGEMENT_MISMATCH");
  const verified = await verifyManagedInstagram({
    accountId: target.account,
    username: target.username,
    token,
    config,
    dryRun: target["dry-run"],
  });
  if (target["dry-run"]) {
    console.info(
      JSON.stringify({
        dryRun: true,
        target: target.target,
        workspaceId: target.workspace,
        workspaceName: target["confirm-workspace-name"],
        accountId: verified.accountId,
        username: verified.username,
        apiVersion: verified.apiVersion,
        wouldSubscribe: verified.willSubscribe,
        wouldStoreEncryptedCredential: true,
      }),
    );
  } else {
    const saved = await service.rpc("provision_instagram_channel", {
      target_workspace_id: target.workspace,
      expected_workspace_name: target["confirm-workspace-name"],
      provider_account_id: verified.accountId,
      provider_username: verified.username,
      provider_token: token,
      provider_version: verified.apiVersion,
      verified_app_id: verified.appId,
    });
    if (saved.error) throw new ProvisionError("VERIFIED_CONNECTION_NOT_SAVED");
    console.info(
      JSON.stringify({
        connected: true,
        target: target.target,
        workspaceId: target.workspace,
        connectionId: saved.data,
        accountId: verified.accountId,
        username: verified.username,
      }),
    );
  }
} catch (error) {
  // Do not print exception objects, HTTP URLs, request headers or credentials.
  console.error(
    `Instagram setup stopped: ${error instanceof ProvisionError ? error.code : "INVALID_OPERATOR_CONFIGURATION"}`,
  );
  process.exitCode = 1;
}
