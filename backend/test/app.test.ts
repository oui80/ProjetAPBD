import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { MemoryAuthStore } from "./memory-auth-store.js";

const credentials = { email: "runner@example.com", password: "correct horse battery staple" };

function testApp() {
  return createApp({
    store: new MemoryAuthStore(),
    sessionTtlMs: 60_000,
    secureCookies: false,
  });
}

describe("authentication API", () => {
  let app: ReturnType<typeof testApp>;

  beforeEach(() => {
    app = testApp();
  });

  it("reports a healthy application", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("reports database unavailability with HTTP 503", async () => {
    const store = new MemoryAuthStore();
    store.healthcheck = async () => {
      throw new Error("database unavailable");
    };
    const unavailableApp = createApp({
      store,
      sessionTtlMs: 60_000,
      secureCookies: false,
    });

    const response = await request(unavailableApp).get("/api/health");
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "unavailable" });
  });

  it("registers a normalized email and persists the session cookie", async () => {
    const agent = request.agent(app);
    const register = await agent
      .post("/api/auth/register")
      .send({ ...credentials, email: "  RUNNER@Example.COM " });

    expect(register.status).toBe(201);
    expect(register.body.user.email).toBe(credentials.email);
    expect(register.headers["set-cookie"]?.[0]).toContain("HttpOnly");

    const session = await agent.get("/api/auth/session");
    expect(session.status).toBe(200);
    expect(session.body.user.email).toBe(credentials.email);
  });

  it("scopes secure cookies to the public base path and clears the same cookie", async () => {
    const prefixedApp = createApp({
      store: new MemoryAuthStore(),
      sessionTtlMs: 60_000,
      secureCookies: true,
      cookiePath: "/demo/",
    });
    const registration = await request(prefixedApp).post("/api/auth/register").send(credentials);
    const cookie = registration.headers["set-cookie"]?.[0] ?? "";

    expect(cookie).toContain("Path=/demo/");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");

    const logout = await request(prefixedApp)
      .post("/api/auth/logout")
      .set("Cookie", cookie.split(";")[0] ?? "");
    expect(logout.headers["set-cookie"]?.[0]).toContain("Path=/demo/");
  });

  it("rejects duplicate registration", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const duplicate = await request(app).post("/api/auth/register").send(credentials);
    expect(duplicate.status).toBe(409);
  });

  it("uses the same response for an unknown email and a wrong password", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ ...credentials, password: "this password is wrong" });
    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "unknown@example.com", password: "this password is wrong" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });

  it("logs in, accesses the private route, then destroys the session", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const agent = request.agent(app);

    const login = await agent.post("/api/auth/login").send(credentials);
    expect(login.status).toBe(200);
    expect((await agent.get("/api/activities")).status).toBe(200);

    expect((await agent.post("/api/auth/logout")).status).toBe(204);
    expect((await agent.get("/api/auth/session")).status).toBe(401);
  });

  it("rejects unauthenticated and forged sessions", async () => {
    expect((await request(app).get("/api/activities")).status).toBe(401);
    const forged = await request(app)
      .get("/api/activities")
      .set("Cookie", "pace_session=forged-token");
    expect(forged.status).toBe(401);
  });

  it("rejects a sensitive request from another origin", async () => {
    const protectedApp = createApp({
      store: new MemoryAuthStore(),
      sessionTtlMs: 60_000,
      secureCookies: false,
      allowedOrigin: "https://pace.test",
    });

    const response = await request(protectedApp)
      .post("/api/auth/login")
      .set("Origin", "https://attacker.test")
      .send(credentials);
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("INVALID_ORIGIN");
  });

  it("keeps sessions isolated between users", async () => {
    const first = request.agent(app);
    const second = request.agent(app);
    await first.post("/api/auth/register").send(credentials);
    await second
      .post("/api/auth/register")
      .send({ email: "cyclist@example.com", password: "another secure password" });

    expect((await first.get("/api/auth/session")).body.user.email).toBe(credentials.email);
    expect((await second.get("/api/auth/session")).body.user.email).toBe(
      "cyclist@example.com",
    );
  });
});
