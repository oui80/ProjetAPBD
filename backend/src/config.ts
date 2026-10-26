import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  APP_ORIGIN: z.string().url().default("http://localhost:5173"),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(168),
  COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
});

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  databaseUrl: string;
  appOrigin: string;
  sessionTtlMs: number;
  secureCookies: boolean;
};

export function readConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const value = schema.parse(environment);

  return {
    nodeEnv: value.NODE_ENV,
    port: value.PORT,
    databaseUrl: value.DATABASE_URL,
    appOrigin: value.APP_ORIGIN,
    sessionTtlMs: value.SESSION_TTL_HOURS * 60 * 60 * 1000,
    secureCookies: value.COOKIE_SECURE === "true",
  };
}
