import { Encoder, Profile } from "@garmin/fitsdk";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { MemoryAuthStore } from "./memory-auth-store.js";

const password = "correct horse battery staple";

function validFit(): Buffer {
  const encoder = new Encoder();
  const start = new Date("2026-10-20T08:00:00.000Z");
  encoder.onMesg(Profile.MesgNum.FILE_ID, {
    manufacturer: "development",
    product: 1,
    timeCreated: start,
    type: "activity",
  });
  encoder.onMesg(Profile.MesgNum.RECORD, {
    timestamp: start,
    positionLat: 585_000_000,
    positionLong: 28_000_000,
    altitude: 120,
    heartRate: 145,
    distance: 0,
    speed: 3.2,
    cadence: 82,
    power: 240,
  });
  encoder.onMesg(Profile.MesgNum.LAP, {
    timestamp: new Date(start.getTime() + 600_000),
    startTime: start,
    totalTimerTime: 600,
    totalDistance: 2000,
    avgSpeed: 3.33,
  });
  encoder.onMesg(Profile.MesgNum.SESSION, {
    timestamp: new Date(start.getTime() + 600_000),
    startTime: start,
    sport: "running",
    totalElapsedTime: 620,
    totalTimerTime: 600,
    totalDistance: 2000,
    avgSpeed: 3.33,
    maxSpeed: 4.2,
    avgHeartRate: 145,
    maxHeartRate: 172,
    avgRunningCadence: 82,
    avgPower: 240,
    totalAscent: 35,
  });
  return Buffer.from(encoder.close());
}

describe("manual FIT import", () => {
  let store: MemoryAuthStore;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    store = new MemoryAuthStore();
    app = createApp({
      store,
      activityStore: store,
      sessionTtlMs: 60_000,
      secureCookies: false,
    });
  });

  async function registered(email: string) {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send({ email, password });
    return agent;
  }

  it("imports a valid FIT and returns its activity", async () => {
    const agent = await registered("runner@example.com");
    const imported = await agent
      .post("/api/imports/fit")
      .attach("files", validFit(), { filename: "run.fit", contentType: "application/octet-stream" });

    expect(imported.status).toBe(200);
    expect(imported.body.results).toEqual([
      expect.objectContaining({ filename: "run.fit", status: "imported" }),
    ]);
    const history = await agent.get("/api/activities");
    expect(history.body.activities).toEqual([
      expect.objectContaining({ sport: "running", distanceMeters: 2000, durationSeconds: 600 }),
    ]);
  });

  it("rejects an invalid FIT without storing it", async () => {
    const agent = await registered("runner@example.com");
    const response = await agent
      .post("/api/imports/fit")
      .attach("files", Buffer.from("not a fit"), {
        filename: "broken.fit",
        contentType: "application/octet-stream",
      });

    expect(response.body.results[0]).toEqual(
      expect.objectContaining({ filename: "broken.fit", status: "error" }),
    );
    expect((await agent.get("/api/activities")).body.activities).toHaveLength(0);
  });

  it("detects duplicates per user while keeping users isolated", async () => {
    const first = await registered("runner@example.com");
    const second = await registered("cyclist@example.com");
    const file = validFit();

    const firstImport = await first.post("/api/imports/fit").attach("files", file, "same.fit");
    const duplicate = await first.post("/api/imports/fit").attach("files", file, "same.fit");
    const otherUser = await second.post("/api/imports/fit").attach("files", file, "same.fit");

    expect(firstImport.body.results[0].status).toBe("imported");
    expect(duplicate.body.results[0].status).toBe("duplicate");
    expect(otherUser.body.results[0].status).toBe("imported");
    expect((await first.get("/api/activities")).body.activities).toHaveLength(1);
    expect((await second.get("/api/activities")).body.activities).toHaveLength(1);
  });

  it("continues a batch when one FIT is invalid", async () => {
    const agent = await registered("runner@example.com");
    const response = await agent
      .post("/api/imports/fit")
      .attach("files", Buffer.from("invalid"), "broken.fit")
      .attach("files", validFit(), "valid.fit");

    expect(response.body.results.map((result: { status: string }) => result.status)).toEqual([
      "error",
      "imported",
    ]);
    expect((await agent.get("/api/activities")).body.activities).toHaveLength(1);
  });
});
