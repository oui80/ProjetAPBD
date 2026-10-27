import { describe, expect, it } from "vitest";
import { normalizeBasePath, readConfig } from "../src/config.js";

describe("IHME runtime configuration", () => {
  it.each([
    ["/", "/"],
    ["demo", "/demo/"],
    ["/demo", "/demo/"],
    ["/demo/", "/demo/"],
  ])("normalizes BASE_PATH %s", (value, expected) => {
    expect(normalizeBasePath(value)).toBe(expected);
  });

  it("prefers PUBLIC_ORIGIN and enables secure cookies on HTTPS", () => {
    const config = readConfig({
      DATABASE_URL: "postgres://example.test/app",
      PUBLIC_ORIGIN: "https://projects.example.test",
      APP_ORIGIN: "http://localhost:5173",
      BASE_PATH: "/demo/",
      COOKIE_SECURE: "false",
    });

    expect(config.appOrigin).toBe("https://projects.example.test");
    expect(config.basePath).toBe("/demo/");
    expect(config.secureCookies).toBe(true);
  });

  it("preserves the local HTTP defaults", () => {
    const config = readConfig({ DATABASE_URL: "postgres://example.test/app" });
    expect(config.appOrigin).toBe("http://localhost:5173");
    expect(config.basePath).toBe("/");
    expect(config.secureCookies).toBe(false);
  });
});
