import "dotenv/config";
import { configSchema } from "./config.js";
import { buildApp } from "./app.js";
const config = configSchema.parse(process.env);
const app = await buildApp({ config });
await app.listen({ port: config.API_PORT, host: config.API_HOST });
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.once(signal, () => {
    void app.close();
  });
