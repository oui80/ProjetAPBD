import type { ActivitySample } from "./activity-types";

type ValidPoint = {
  index: number;
  time: number;
  speed: number | null;
  heartRate: number | null;
  cadence: number | null;
  power: number | null;
  altitude: number | null;
  distance: number | null;
};

export type Calculable<T> =
  | { status: "ready"; value: T; limits: string }
  | { status: "unavailable"; reason: string };

function validPoints(samples: ActivitySample[]): ValidPoint[] {
  return samples.flatMap((sample, index) => {
    if (!sample.recordedAt) return [];
    const time = Date.parse(sample.recordedAt);
    if (!Number.isFinite(time)) return [];
    return [{
      index,
      time,
      speed: sample.speedMps,
      heartRate: sample.heartRateBpm,
      cadence: sample.cadenceRpm,
      power: sample.powerWatts,
      altitude: sample.altitudeMeters,
      distance: sample.distanceMeters,
    }];
  });
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function coefficientOfVariation(values: number[]): number {
  const average = mean(values);
  const variance = mean(values.map((value) => (value - average) ** 2));
  return average === 0 ? Infinity : Math.sqrt(variance) / average;
}

export function calculateRunningEfficiency(samples: ActivitySample[]): Calculable<{
  heartRateBins: Array<{ heartRate: number; speedKmh: number }>;
  speedAt150Kmh: number | null;
  cardiacDriftPercent: number | null;
  cadenceChangePercent: number | null;
}> {
  const points = validPoints(samples).filter(
    (point) =>
      point.speed !== null &&
      point.speed > 0.8 &&
      point.heartRate !== null &&
      !hasStrongGradeVariation(point.index, samples),
  );
  if (points.length < 30) {
    return { status: "unavailable", reason: "Au moins 30 mesures simultanées de vitesse et de FC sont nécessaires." };
  }

  const bins = new Map<number, number[]>();
  for (const point of points) {
    const key = Math.floor(point.heartRate! / 5) * 5;
    const speeds = bins.get(key) ?? [];
    speeds.push(point.speed! * 3.6);
    bins.set(key, speeds);
  }
  const heartRateBins = [...bins.entries()]
    .filter(([, speeds]) => speeds.length >= 3)
    .map(([heartRate, speeds]) => ({ heartRate: heartRate + 2.5, speedKmh: mean(speeds) }));

  const heartRates = points.map((point) => point.heartRate!);
  const speeds = points.map((point) => point.speed! * 3.6);
  let speedAt150Kmh: number | null = null;
  if (Math.min(...heartRates) <= 150 && Math.max(...heartRates) >= 150) {
    const averageHr = mean(heartRates);
    const averageSpeed = mean(speeds);
    const denominator = heartRates.reduce((sum, value) => sum + (value - averageHr) ** 2, 0);
    if (denominator > 0) {
      const slope = heartRates.reduce(
        (sum, value, index) => sum + (value - averageHr) * (speeds[index]! - averageSpeed),
        0,
      ) / denominator;
      speedAt150Kmh = averageSpeed + slope * (150 - averageHr);
    }
  }

  const medianSpeed = [...speeds].sort((left, right) => left - right)[Math.floor(speeds.length / 2)]!;
  const comparable = points.filter(
    (point) => Math.abs(point.speed! * 3.6 - medianSpeed) / medianSpeed <= 0.1,
  );
  let cardiacDriftPercent: number | null = null;
  if (comparable.length >= 30 && coefficientOfVariation(comparable.map((point) => point.speed!)) <= 0.1) {
    const middle = Math.floor(comparable.length / 2);
    const early = comparable.slice(0, middle);
    const late = comparable.slice(middle);
    const earlyRatio = mean(early.map((point) => point.speed! / point.heartRate!));
    const lateRatio = mean(late.map((point) => point.speed! / point.heartRate!));
    cardiacDriftPercent = ((earlyRatio - lateRatio) / earlyRatio) * 100;
  }

  const cadence = points.filter((point) => point.cadence !== null);
  let cadenceChangePercent: number | null = null;
  if (cadence.length >= 20) {
    const middle = Math.floor(cadence.length / 2);
    const early = mean(cadence.slice(0, middle).map((point) => point.cadence!));
    const late = mean(cadence.slice(middle).map((point) => point.cadence!));
    cadenceChangePercent = ((late - early) / early) * 100;
  }

  return {
    status: "ready",
    value: { heartRateBins, speedAt150Kmh, cardiacDriftPercent, cadenceChangePercent },
    limits: "Pauses exclues. La dérive n’est affichée que sur des vitesses comparables à ±10 % ; relief, vent et chaleur restent des limites.",
  };
}

export function calculateTrailEfficiency(samples: ActivitySample[]): Calculable<{
  ascentMeters: number;
  climbingSeconds: number;
  averageVam: number;
  averageClimbingHeartRate: number | null;
  heartRateVamBins: Array<{ heartRate: number; vam: number }>;
}> {
  const points = validPoints(samples).filter(
    (point) => point.altitude !== null && point.distance !== null,
  );
  if (points.length < 20) {
    return { status: "unavailable", reason: "Le profil altitude/distance est insuffisant pour identifier des montées fiables." };
  }
  const smoothed = points.map((point, index) => ({
    ...point,
    altitude: mean(points.slice(Math.max(0, index - 2), index + 3).map((value) => value.altitude!)),
  }));
  let ascent = 0;
  let climbingSeconds = 0;
  const climbingHeartRates: number[] = [];
  const vamByHeartRate = new Map<number, number[]>();
  for (let index = 1; index < smoothed.length; index += 1) {
    const previous = smoothed[index - 1]!;
    const current = smoothed[index]!;
    const distance = current.distance! - previous.distance!;
    const altitude = current.altitude! - previous.altitude!;
    const seconds = (current.time - previous.time) / 1000;
    if (distance <= 0 || distance > 300 || seconds <= 0 || seconds > 30) continue;
    if (altitude / distance < 0.03) continue;
    ascent += altitude;
    climbingSeconds += seconds;
    if (previous.heartRate !== null) {
      climbingHeartRates.push(previous.heartRate);
      const heartRate = Math.floor(previous.heartRate / 10) * 10;
      const values = vamByHeartRate.get(heartRate) ?? [];
      values.push(altitude / (seconds / 3600));
      vamByHeartRate.set(heartRate, values);
    }
  }
  if (ascent < 10 || climbingSeconds < 120) {
    return { status: "unavailable", reason: "Aucune montée d’au moins 10 m et 2 minutes n’a été détectée après lissage." };
  }
  return {
    status: "ready",
    value: {
      ascentMeters: ascent,
      climbingSeconds,
      averageVam: ascent / (climbingSeconds / 3600),
      averageClimbingHeartRate: climbingHeartRates.length ? mean(climbingHeartRates) : null,
      heartRateVamBins: [...vamByHeartRate.entries()]
        .filter(([, values]) => values.length >= 3)
        .map(([heartRate, values]) => ({ heartRate: heartRate + 5, vam: mean(values) })),
    },
    limits: "Altitude lissée sur cinq points et pente minimale de 3 %. La précision dépend du capteur altimétrique et du GPS.",
  };
}

export function calculateCyclingEfficiency(samples: ActivitySample[]): Calculable<{
  workKilojoules: number;
  averagePowerWatts: number;
  cardiacPowerDriftPercent: number | null;
  averageCadenceRpm: number | null;
  heartRatePowerBins: Array<{ heartRate: number; power: number }>;
}> {
  const points = validPoints(samples).filter((point) => point.power !== null && point.power > 0);
  if (points.length < 20) {
    return { status: "unavailable", reason: "Au moins 20 échantillons de puissance sont nécessaires." };
  }
  let workJoules = 0;
  for (let index = 1; index < points.length; index += 1) {
    const seconds = (points[index]!.time - points[index - 1]!.time) / 1000;
    if (seconds > 0 && seconds <= 30) workJoules += points[index - 1]!.power! * seconds;
  }
  const powerValues = points.map((point) => point.power!);
  const comparable = points.filter(
    (point) => point.heartRate !== null && Math.abs(point.power! - mean(powerValues)) / mean(powerValues) <= 0.12,
  );
  let drift: number | null = null;
  if (comparable.length >= 30) {
    const middle = Math.floor(comparable.length / 2);
    const early = comparable.slice(0, middle);
    const late = comparable.slice(middle);
    const earlyRatio = mean(early.map((point) => point.power! / point.heartRate!));
    const lateRatio = mean(late.map((point) => point.power! / point.heartRate!));
    drift = ((earlyRatio - lateRatio) / earlyRatio) * 100;
  }
  const cadence = points.flatMap((point) => point.cadence === null ? [] : [point.cadence]);
  const powerByHeartRate = new Map<number, number[]>();
  for (const point of points) {
    if (point.heartRate === null) continue;
    const heartRate = Math.floor(point.heartRate / 5) * 5;
    const values = powerByHeartRate.get(heartRate) ?? [];
    values.push(point.power!);
    powerByHeartRate.set(heartRate, values);
  }
  return {
    status: "ready",
    value: {
      workKilojoules: workJoules / 1000,
      averagePowerWatts: mean(powerValues),
      cardiacPowerDriftPercent: drift,
      averageCadenceRpm: cadence.length ? mean(cadence) : null,
      heartRatePowerBins: [...powerByHeartRate.entries()]
        .filter(([, values]) => values.length >= 3)
        .map(([heartRate, values]) => ({ heartRate: heartRate + 2.5, power: mean(values) })),
    },
    limits: "Travail intégré sur les intervalles valides de 30 s maximum. La dérive exige une puissance comparable à ±12 %.",
  };
}

function hasStrongGradeVariation(index: number, samples: ActivitySample[]): boolean {
  if (index === 0) return false;
  const previous = samples[index - 1];
  const current = samples[index];
  if (!previous || !current) return false;
  if (
    previous.altitudeMeters === null ||
    previous.distanceMeters === null ||
    current.altitudeMeters === null ||
    current.distanceMeters === null
  ) return false;
  const distance = current.distanceMeters - previous.distanceMeters;
  if (distance <= 0) return false;
  return Math.abs((current.altitudeMeters - previous.altitudeMeters) / distance) > 0.05;
}

export function downsampleIndices(length: number, maximum = 800): number[] {
  if (length <= maximum) return Array.from({ length }, (_, index) => index);
  const step = (length - 1) / (maximum - 1);
  return Array.from({ length: maximum }, (_, index) => Math.round(index * step));
}
