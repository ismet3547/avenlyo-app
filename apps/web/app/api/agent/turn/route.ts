import { NextResponse } from "next/server";
import { turnSchema } from "@avenlyo-app/shared";
import { callApi } from "@/lib/api";
export async function POST(request: Request) {
  const origin = new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001",
  ).origin;
  if (request.headers.get("origin") !== origin)
    return NextResponse.json({ code: "FORBIDDEN_ORIGIN" }, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  const raw = await request.text();
  if (raw.length > 16000)
    return NextResponse.json({ code: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  let parsed;
  try {
    parsed = turnSchema.safeParse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  }
  if (!parsed.success)
    return NextResponse.json({ code: "INVALID_TURN" }, { status: 400 });
  const result = await callApi("/v1/agent/turn", parsed.data);
  return NextResponse.json(result.data, {
    status: result.status,
    headers: { "Cache-Control": "no-store" },
  });
}
