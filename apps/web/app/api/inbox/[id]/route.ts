import { NextResponse } from "next/server";
import { z } from "zod";
import { callApi } from "@/lib/api";
import { requireWorkspace } from "@/lib/workspace";
const bodySchema = z.discriminatedUnion("operation", [
  z
    .object({
      operation: z.literal("reply"),
      clientMessageId: z.uuid(),
      content: z.string().trim().min(1).max(2000),
    })
    .strict(),
  z.object({ operation: z.enum(["claim", "release", "resume"]) }).strict(),
]);
const response = (data: unknown, status: number) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return response({ code: "INVALID_CONVERSATION" }, 400);
  const before = new URL(request.url).searchParams.get("before");
  if (before && !z.uuid().safeParse(before).success)
    return response({ code: "INVALID_MESSAGE" }, 400);
  const ctx = await requireWorkspace();
  const result = await callApi(`/v1/inbox/${id}/thread`, {
    workspaceId: ctx.workspace.id,
    beforeMessageId: before,
  });
  return response(result.data, result.status);
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const origin = new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
  ).origin;
  if (request.headers.get("origin") !== origin)
    return response({ code: "FORBIDDEN_ORIGIN" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return response({ code: "INVALID_REQUEST" }, 400);
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return response({ code: "INVALID_CONVERSATION" }, 400);
  const raw = await request.text();
  if (raw.length > 9000) return response({ code: "PAYLOAD_TOO_LARGE" }, 413);
  let parsed;
  try {
    parsed = bodySchema.safeParse(JSON.parse(raw));
  } catch {
    return response({ code: "INVALID_REQUEST" }, 400);
  }
  if (!parsed.success) return response({ code: "INVALID_REQUEST" }, 400);
  const ctx = await requireWorkspace();
  const body =
    parsed.data.operation === "reply"
      ? {
          workspaceId: ctx.workspace.id,
          content: parsed.data.content,
          clientMessageId: parsed.data.clientMessageId,
        }
      : { workspaceId: ctx.workspace.id, action: parsed.data.operation };
  const result = await callApi(
    `/v1/inbox/${id}/${parsed.data.operation === "reply" ? "reply" : "action"}`,
    body,
  );
  return response(result.data, result.status);
}
