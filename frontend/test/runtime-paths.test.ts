import { describe, expect, it } from "vitest";
import { apiUrl } from "../src/api";
import { normalizeBasePath, routerBasename } from "../src/runtime-paths";

describe("public base path", () => {
  it("keeps local API calls at the root", () => {
    expect(apiUrl("/api/auth/session", "/")).toBe("/api/auth/session");
    expect(routerBasename("/")).toBe("/");
  });

  it("prefixes API calls on IHME", () => {
    expect(apiUrl("/api/activities", "/projet-apbd/")).toBe(
      "/projet-apbd/api/activities",
    );
  });

  it("normalizes public paths", () => {
    expect(normalizeBasePath("projet-apbd")).toBe("/projet-apbd/");
    expect(normalizeBasePath("//projet-apbd//")).toBe("/projet-apbd/");
  });

  it("configures the router basename for local and IHME navigation", () => {
    expect(routerBasename("/")).toBe("/");
    expect(routerBasename("/projet-apbd/")).toBe("/projet-apbd");
  });

  it("builds every authentication URL under the IHME prefix", () => {
    for (const endpoint of ["session", "register", "login", "logout"]) {
      expect(apiUrl(`/api/auth/${endpoint}`, "/projet-apbd/")).toBe(
        `/projet-apbd/api/auth/${endpoint}`,
      );
    }
  });
});
