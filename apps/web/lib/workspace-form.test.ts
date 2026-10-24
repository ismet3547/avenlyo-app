import { describe, expect, it } from "vitest";
import { workspaceFormError } from "./workspace-form";

describe("workspace-bound forms", () => {
  it("accepts the workspace for which the form was rendered", () => {
    const form = new FormData();
    form.set("workspaceId", "workspace-a");
    expect(workspaceFormError(form, "workspace-a")).toBeNull();
  });
  it("rejects a form after a different tab switches workspace", () => {
    const form = new FormData();
    form.set("workspaceId", "workspace-a");
    expect(workspaceFormError(form, "workspace-b")?.status).toBe("error");
  });
  it("does not silently retarget a missing workspace", () => {
    expect(workspaceFormError(new FormData(), "workspace-b")?.status).toBe(
      "error",
    );
  });
});
