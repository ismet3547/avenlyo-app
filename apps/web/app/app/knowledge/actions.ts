"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { collectionSchema, knowledgeSchema } from "@avenlyo-app/shared";
import { requireWorkspace } from "@/lib/workspace";
import { callApi } from "@/lib/api";
import type { FormState } from "@/app/auth/actions";
export async function saveKnowledge(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const ctx = await requireWorkspace();
  const parsed = knowledgeSchema.safeParse({
    type: form.get("type"),
    title: form.get("title"),
    content: form.get("content") ?? "",
    price_statement: form.get("price_statement") ?? "",
    currency: form.get("currency") ?? "",
    details: form.get("details") ?? "",
    collection_id: form.get("collection_id") || null,
  });
  const id = z
    .uuid()
    .nullable()
    .safeParse(form.get("id") || null);
  const revision = z.coerce
    .number()
    .int()
    .positive()
    .nullable()
    .safeParse(form.get("revision") || null);
  if (!parsed.success || !id.success || !revision.success)
    return {
      status: "error",
      message: !parsed.success
        ? parsed.error.issues[0].message
        : "Reload this item before saving again.",
    };
  const result = await ctx.supabase.rpc("save_business_knowledge", {
    target_workspace_id: ctx.workspace.id,
    target_item_id: id.data,
    item_type: parsed.data.type,
    item_title: parsed.data.title,
    item_content: parsed.data.content,
    expected_revision: revision.data,
    item_price_statement: parsed.data.price_statement,
    item_currency: parsed.data.currency,
    item_details: parsed.data.details,
    item_collection_id: parsed.data.collection_id,
  });
  if (result.error)
    return {
      status: "error",
      message:
        "Could not save this item. Check owner access or reload if someone edited it.",
    };
  revalidatePath("/app/knowledge");
  revalidatePath("/app");
  redirect("/app/knowledge?notice=draft-saved");
}
export async function knowledgeOperation(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const ctx = await requireWorkspace();
  const parsed = z
    .object({
      id: z.uuid(),
      intent: z.enum(["publish", "draft", "archived", "delete"]),
    })
    .safeParse({ id: form.get("id"), intent: form.get("intent") });
  if (!parsed.success)
    return { status: "error", message: "Invalid knowledge action." };
  const { id, intent } = parsed.data;
  if (intent === "publish") {
    const result = await callApi(`/v1/knowledge/${id}/publish`, {
      workspaceId: ctx.workspace.id,
    });
    if (result.status !== 200)
      return {
        status: "error",
        message:
          "Publishing failed. Check API/OpenAI setup and owner access. The item has not been newly published.",
      };
  } else {
    const result =
      intent === "delete"
        ? await ctx.supabase.rpc("delete_knowledge_item", {
            target_workspace_id: ctx.workspace.id,
            target_item_id: id,
          })
        : await ctx.supabase.rpc("change_knowledge_status", {
            target_workspace_id: ctx.workspace.id,
            target_item_id: id,
            target_status: intent,
          });
    if (result.error)
      return {
        status: "error",
        message: "Action failed. Only owners can change knowledge.",
      };
  }
  revalidatePath("/app/knowledge");
  revalidatePath("/app");
  return {
    status: "success",
    message:
      intent === "publish"
        ? "Published. Your agent can now use this item."
        : intent === "delete"
          ? "Item deleted."
          : intent === "draft"
            ? "Unpublished. Your agent will no longer use this item."
            : "Item archived.",
  };
}

export async function saveCollection(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const ctx = await requireWorkspace();
  const parsed = collectionSchema.safeParse({ name: form.get("name") });
  const id = z
    .uuid()
    .nullable()
    .safeParse(form.get("id") || null);
  if (!parsed.success || !id.success)
    return {
      status: "error",
      message: "Use a collection name between 2 and 80 characters.",
    };
  const result = await ctx.supabase.rpc("save_knowledge_collection", {
    target_workspace_id: ctx.workspace.id,
    target_collection_id: id.data,
    collection_name: parsed.data.name,
  });
  if (result.error)
    return {
      status: "error",
      message:
        result.error.code === "23505"
          ? "A collection with this name already exists."
          : "Could not save the collection. Check owner access and try again.",
    };
  revalidatePath("/app/knowledge", "layout");
  return {
    status: "success",
    message: id.data
      ? "Collection renamed."
      : "Collection created. You can now select it.",
  };
}


const MAX_IMPORT_BYTES = 1_000_000;
const MAX_KNOWLEDGE_CHARS = 6000;
const supportedFileExtensions = new Set(["txt", "md", "markdown", "csv", "json", "html", "htm"]);

function normalizeImportUrl(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  const parsed = z.url().safeParse(candidate);
  if (!parsed.success) throw new Error("Enter a valid public website URL.");
  const url = new URL(parsed.data);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Only http and https URLs can be imported.");
  if (url.username || url.password)
    throw new Error("URLs containing credentials cannot be imported.");
  if (url.port && !["80", "443"].includes(url.port))
    throw new Error("Only standard web ports can be imported.");
  url.hash = "";
  return url;
}

function blockedAddress(address: string) {
  if (isIP(address) === 4) {
    const parts = address.split(".").map(Number);
    return (
      parts[0] === 10 ||
      parts[0] === 127 ||
      parts[0] === 0 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
      parts[0] >= 224
    );
  }
  const normalized = address.toLowerCase();
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    /^::ffff:172\.(1[6-9]|2\d|3[01])\./.test(normalized)
  );
}

async function assertPublicUrl(url: URL) {
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    isIP(hostname)
  )
    throw new Error("Local or private network addresses cannot be imported.");
  const records = await lookup(hostname, { all: true, verbatim: true });
  if (!records.length || records.some((record) => blockedAddress(record.address)))
    throw new Error("This address cannot be imported.");
}

async function readLimitedText(response: Response) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_IMPORT_BYTES) {
      await reader.cancel();
      throw new Error("That page is too large to import. Use a more specific page.");
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return text;
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function htmlToKnowledge(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch
    ? decodeHtml(titleMatch[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
    : "";
  const text = decodeHtml(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|svg|template)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/(p|div|section|article|li|h[1-6]|tr|main|header|footer)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, " "),
  )
    .split("\n")
    .map((line) => line.replace(/[\t ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { title, text };
}

function trimImportedContent(value: string) {
  const cleaned = value.split(String.fromCharCode(0)).join("").trim();
  if (cleaned.length < 3) throw new Error("No useful readable text was found.");
  return cleaned.slice(0, MAX_KNOWLEDGE_CHARS);
}

async function saveImportedDraft(
  ctx: Awaited<ReturnType<typeof requireWorkspace>>,
  title: string,
  content: string,
) {
  const parsed = knowledgeSchema.safeParse({
    type: "custom_note",
    title: title.trim().slice(0, 180),
    content: trimImportedContent(content),
    price_statement: "",
    currency: "",
    details: "",
    collection_id: null,
  });
  if (!parsed.success)
    throw new Error(parsed.error.issues[0]?.message ?? "Imported content is invalid.");
  const result = await ctx.supabase.rpc("save_business_knowledge", {
    target_workspace_id: ctx.workspace.id,
    target_item_id: null,
    item_type: parsed.data.type,
    item_title: parsed.data.title,
    item_content: parsed.data.content,
    expected_revision: null,
    item_price_statement: "",
    item_currency: "",
    item_details: "",
    item_collection_id: null,
  });
  if (result.error) throw new Error("The imported draft could not be saved.");
}

export async function importKnowledgeFromUrl(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const ctx = await requireWorkspace();
  if (ctx.role !== "owner")
    return { status: "error", message: "Only workspace owners can import knowledge." };
  try {
    let url = normalizeImportUrl(form.get("url"));
    let response: Response | undefined;
    for (let redirectCount = 0; redirectCount < 5; redirectCount += 1) {
      await assertPublicUrl(url);
      response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
        headers: {
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
          "accept-language": "en-US,en;q=0.9",
          "cache-control": "no-cache",
          pragma: "no-cache",
          "upgrade-insecure-requests": "1",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
        },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) throw new Error("The website returned an invalid redirect.");
        url = new URL(location, url);
        continue;
      }
      break;
    }
    if (!response || [301, 302, 303, 307, 308].includes(response.status))
      throw new Error("The website redirected too many times.");
    if (!response.ok) {
      if (response.status === 403)
        throw new Error(
          "This website blocks automated page access (HTTP 403). Try a more specific public page, or upload an exported file instead.",
        );
      throw new Error(`The website returned HTTP ${response.status}.`);
    }
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain"))
      throw new Error("This URL is not a readable HTML or text page.");
    const raw = await readLimitedText(response);
    const extracted = contentType.includes("text/html")
      ? htmlToKnowledge(raw)
      : { title: "", text: raw };
    const fallbackTitle = `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
    await saveImportedDraft(ctx, extracted.title || fallbackTitle, extracted.text);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "The webpage could not be imported.",
    };
  }
  revalidatePath("/app/knowledge");
  revalidatePath("/app");
  redirect("/app/knowledge?notice=imported");
}

export async function importKnowledgeFile(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const ctx = await requireWorkspace();
  if (ctx.role !== "owner")
    return { status: "error", message: "Only workspace owners can import knowledge." };
  const entry = form.get("file");
  if (!(entry instanceof File) || !entry.size)
    return { status: "error", message: "Choose a file to import." };
  if (entry.size > MAX_IMPORT_BYTES)
    return { status: "error", message: "Files must be 1 MB or smaller." };
  const extension = entry.name.split(".").pop()?.toLowerCase() ?? "";
  if (!supportedFileExtensions.has(extension))
    return { status: "error", message: "Use TXT, Markdown, CSV, JSON or HTML files for now." };
  try {
    const raw = await entry.text();
    const extracted = ["html", "htm"].includes(extension)
      ? htmlToKnowledge(raw)
      : { title: "", text: raw };
    const filenameTitle = entry.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
    await saveImportedDraft(
      ctx,
      extracted.title || filenameTitle || "Imported file",
      extracted.text,
    );
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "The file could not be imported.",
    };
  }
  revalidatePath("/app/knowledge");
  revalidatePath("/app");
  redirect("/app/knowledge?notice=imported");
}
