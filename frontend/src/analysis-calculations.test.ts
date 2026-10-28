import { describe, expect, it } from "vitest";
import type { ActivitySample } from "./activity-types";
import {
  calculateCyclingEfficiency,
  calculateRunningEfficiency,
  calculateTrailEfficiency,
  downsampleIndices,
} from "./analysis-calculations";

function samples(count: number, values: (index: number) => Partial<ActivitySample>): ActivitySample[] {
  return Array.from({ length: count }, (_, index) => ({
    recordedAt: new Date(Date.UTC(2026, 0, 1, 8, 0, index * 10)).toISOString(),
    distanceMeters: index * 30,
    latitudeDegrees: null,
    longitudeDegrees: null,
    altitudeMeters: 100,
    heartRateBpm: null,
    speedMps: null,
    cadenceRpm: null,
    powerWatts: null,
    temperatureCelsius: null,
    ...values(index),
  }));
}

describe("independent activity analyses", () => {
  it("does not calculate running efficiency when simultaneous data is missing", () => {
    expect(calculateRunningEfficiency(samples(40, () => ({ speedMps: 3 }))).status)
      .toBe("unavailable");
  });

  it("calculates running indicators from valid speed, heart rate and cadence", () => {
    const result = calculateRunningEfficiency(samples(40, (index) => ({
      speedMps: 3 + index * 0.01,
      heartRateBpm: 140 + index,
      cadenceRpm: 80 + index * 0.05,
    })));
    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.value.heartRateBins.length).toBeGreaterThan(0);
      expect(result.value.speedAt150Kmh).not.toBeNull();
    }
  });

  it("detects a sustained trail climb after altitude smoothing", () => {
    const result = calculateTrailEfficiency(samples(40, (index) => ({
      altitudeMeters: 100 + index * 2,
      heartRateBpm: 150,
    })));
    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.value.averageVam).toBeGreaterThan(0);
      expect(result.value.heartRateVamBins).toHaveLength(1);
    }
  });

  it("integrates cycling power and bounds chart downsampling", () => {
    const result = calculateCyclingEfficiency(samples(40, () => ({
      powerWatts: 200,
      heartRateBpm: 145,
      cadenceRpm: 90,
    })));
    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.value.workKilojoules).toBeCloseTo(78);
      expect(result.value.heartRatePowerBins).toHaveLength(1);
    }
    expect(downsampleIndices(2_000)).toHaveLength(800);
  });
});
