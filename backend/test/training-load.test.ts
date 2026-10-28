import { describe, expect, it } from "vitest";
import type { ActivitySample, TrainingActivity } from "../src/modules/activities/activity-store.js";
import {
  calculateEdwardsTrimp,
  calculateFitnessEstimate,
} from "../src/modules/activities/training-load.js";

function sample(at: string, heartRateBpm: number | null, speedMps = 3): ActivitySample {
  return {
    recordedAt: new Date(at),
    distanceMeters: null,
    latitudeDegrees: null,
    longitudeDegrees: null,
    altitudeMeters: null,
    heartRateBpm,
    speedMps,
    cadenceRpm: null,
    powerWatts: null,
    temperatureCelsius: null,
  };
}

describe("training load estimates", () => {
  it("weights valid heart-rate intervals and excludes pauses or long gaps", () => {
    const samples = [
      sample("2026-01-01T08:00:00Z", 100),
      sample("2026-01-01T08:00:10Z", 120),
      sample("2026-01-01T08:00:20Z", 150, 0),
      sample("2026-01-01T08:01:20Z", 180),
    ];

    expect(calculateEdwardsTrimp(samples, 200)).toBeCloseTo(0.5);
  });

  it("requires a maximum heart rate and at least 42 days of history", () => {
    expect(calculateFitnessEstimate([], null).status).toBe("insufficient");
    const recent: TrainingActivity[] = [{
      id: "recent",
      startTime: new Date(Date.now() - 10 * 86_400_000),
      samples: [
        sample(new Date(Date.now() - 10 * 86_400_000).toISOString(), 150),
        sample(new Date(Date.now() - 10 * 86_400_000 + 10_000).toISOString(), 150),
      ],
    }];
    expect(calculateFitnessEstimate(recent, 190).status).toBe("insufficient");
  });

  it("returns ATL, CTL and freshness from a sufficient history", () => {
    const activities: TrainingActivity[] = Array.from({ length: 50 }, (_, day) => {
      const start = new Date(Date.now() - (49 - day) * 86_400_000);
      return {
        id: String(day),
        startTime: start,
        samples: [
          sample(start.toISOString(), 160),
          sample(new Date(start.getTime() + 10_000).toISOString(), 160),
        ],
      };
    });

    const result = calculateFitnessEstimate(activities, 190);
    expect(result.status).toBe("ready");
    expect(result.atl).toBeGreaterThan(0);
    expect(result.ctl).toBeGreaterThan(0);
    expect(result.freshness).toBeCloseTo(result.ctl! - result.atl!);
  });
});
