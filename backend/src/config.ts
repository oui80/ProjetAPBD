import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  PUBLIC_ORIGIN: z.string().url().optional(),
  APP_ORIGIN: z.string().url().optional(),
  BASE_PATH: z.string().default("/"),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(168),
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),
});

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  databaseUrl: string;
  appOrigin: string;
  basePath: string;
  sessionTtlMs: number;
  secureCookies: boolean;
};

export function readConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const value = schema.parse(environment);
  const appOrigin = new URL(
    value.PUBLIC_ORIGIN ?? value.APP_ORIGIN ?? "http://localhost:5173",
  ).origin;
  const basePath = normalizeBasePath(value.BASE_PATH);

  return {
    nodeEnv: value.NODE_ENV,
    port: value.PORT,
    databaseUrl: value.DATABASE_URL,
    appOrigin,
    basePath,
    sessionTtlMs: value.SESSION_TTL_HOURS * 60 * 60 * 1000,
    secureCookies: appOrigin.startsWith("https://") || value.COOKIE_SECURE === "true",
  };
}

export function normalizeBasePath(value: string): string {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}
