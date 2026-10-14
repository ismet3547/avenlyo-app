import Script from "next/script";
import { z } from "zod";
import { notFound } from "next/navigation";
import { websiteOriginSchema } from "@avenlyo-app/shared";
export default async function ChatDemo({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>;
}) {
  const publicApi = websiteOriginSchema.parse(
    process.env.AVENLYO_PUBLIC_API_URL ?? "http://localhost:4001",
  );
  if (new URL(publicApi).protocol !== "http:") notFound();
  const params = await searchParams;
  const channel = z.uuid().safeParse(params.channel);
  if (!channel.success) notFound();
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <p className="text-xs font-medium uppercase tracking-widest text-primary">
        Local customer website
      </p>
      <h1 className="mt-5 text-4xl font-semibold tracking-tight">
        A space for your next idea.
      </h1>
      <p className="mt-5 max-w-lg text-base leading-8 text-muted-foreground">
        This fictional website demonstrates the installed Avenlyo widget. Open
        the chat to ask your business’s agent a question. The customer does not
        sign in.
      </p>
      <div className="mt-10 rounded-xl border border-border bg-white p-6 text-sm leading-7 text-muted-foreground">
        This origin must be explicitly approved in Channels → Website Chat. The
        widget uses your published knowledge and saves a real channel
        conversation in your disposable local database.
      </div>
      <Script
        src={`${publicApi}/widget.js`}
        data-avenlyo-channel={channel.data}
        strategy="afterInteractive"
      />
    </main>
  );
}
