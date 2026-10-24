import type { FormState } from "../app/auth/actions";

// A workspace cookie is a preference shared by tabs. Never let it retarget a
// form rendered for another workspace. Membership/owner RPC checks still apply.
export function workspaceFormError(
  form: FormData,
  workspaceId: string,
): FormState | null {
  return form.get("workspaceId") === workspaceId
    ? null
    : {
        status: "error",
        message:
          "Your active workspace changed. Reload this page before saving; no changes were made.",
      };
}
