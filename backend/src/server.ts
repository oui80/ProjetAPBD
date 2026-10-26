import { createApp } from "./app.js";
import { readConfig } from "./config.js";
import { runMigrations } from "./db/migrate.js";
import { createPool } from "./db/pool.js";
import { PostgresAuthStore } from "./modules/auth/postgres-auth-store.js";

const config = readConfig();
const pool = createPool(config.databaseUrl);

await runMigrations(pool);

const app = createApp({
  store: new PostgresAuthStore(pool),
  sessionTtlMs: config.sessionTtlMs,
  secureCookies: config.secureCookies,
  allowedOrigin: config.appOrigin,
  serveFrontend: config.nodeEnv === "production",
});

const server = app.listen(config.port, () => {
  console.log(`PACE / LAB listening on port ${config.port}`);
});

async function shutdown(): Promise<void> {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
