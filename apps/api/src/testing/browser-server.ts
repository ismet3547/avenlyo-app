// Test fixture entry point, never bundled into the production API artifact.
import "dotenv/config";
import { configSchema } from "../config.js";
import { buildApp } from "../app.js";
import type { AgentProvider } from "../runtime/provider.js";
const config = configSchema.parse(process.env);
if (config.SUPABASE_URL !== "http://127.0.0.1:55321")
  throw new Error(
    "Browser fixtures require this repository’s disposable local stack.",
  );
const provider: AgentProvider = {
  embed: async () => [1, ...Array(1535).fill(0)],
  respond: async (input) => {
    if (input.instructions.includes("Never hand customers to a human"))
      throw new Error("Setup brief entered runtime authority");
    const customer = input.history
      .filter((m) => m.role === "customer")
      .map((m) => m.content)
      .join("\n");
    const name = customer.match(/I'm (Alex|Riley)\b/)?.[1] ?? null;
    const email = customer.match(/(?:alex|riley)@example\.test/)?.[0] ?? null;
    return {
      reply: name
        ? "Thanks. Your custom project inquiry includes the requested contact details."
        : "We provide custom design and manufacturing services. What kind of project are you considering?",
      request_human: false,
      interest: "service",
      name,
      email,
      phone: null,
      company: null,
    };
  },
};
const app = await buildApp({ config, provider, logger: false });
await app.listen({ host: config.API_HOST, port: config.API_PORT });
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, () => {
    void app.close();
  });
