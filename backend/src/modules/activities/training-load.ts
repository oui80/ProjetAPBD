import type { ActivitySample, TrainingActivity } from "./activity-store.js";

export type FitnessEstimate = {
  status: "ready" | "insufficient";
  reason: string | null;
  atl: number | null;
  ctl: number | null;
  freshness: number | null;
  freshnessChange7Days: number | null;
  dailyLoads: Array<{ date: string; load: number }>;
};

export function calculateEdwardsTrimp(
  samples: ActivitySample[],
  maxHeartRate: number,
): number | null {
  let weightedMinutes = 0;
  let validIntervals = 0;

  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!;
    const current = samples[index]!;
    if (!previous.recordedAt || !current.recordedAt || previous.heartRateBpm === null) continue;
    const seconds = (current.recordedAt.getTime() - previous.recordedAt.getTime()) / 1000;
    if (seconds <= 0 || seconds > 30) continue;
    if (previous.speedMps !== null && previous.speedMps < 0.3) continue;

    const ratio = previous.heartRateBpm / maxHeartRate;
    const weight = ratio >= 0.9 ? 5 : ratio >= 0.8 ? 4 : ratio >= 0.7 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.5 ? 1 : 0;
    weightedMinutes += (seconds / 60) * weight;
    validIntervals += 1;
  }

  return validIntervals > 0 ? weightedMinutes : null;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function nextDay(date: Date): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export function calculateFitnessEstimate(
  activities: TrainingActivity[],
  maxHeartRate: number | null,
  now = new Date(),
): FitnessEstimate {
  if (maxHeartRate === null) {
    return insufficient("Renseignez votre fréquence cardiaque maximale pour estimer la charge.");
  }

  const loads = new Map<string, number>();
  for (const activity of activities) {
    const load = calculateEdwardsTrimp(activity.samples, maxHeartRate);
    const key = dateKey(activity.startTime);
    if (load !== null) loads.set(key, (loads.get(key) ?? 0) + load);
  }
  const dates = [...loads.keys()].sort();
  if (dates.length === 0) return insufficient("Aucun échantillon de fréquence cardiaque exploitable.");

  const first = new Date(`${dates[0]}T00:00:00.000Z`);
  const today = new Date(`${dateKey(now)}T00:00:00.000Z`);
  if ((today.getTime() - first.getTime()) / 86_400_000 < 41) {
    return insufficient("Un historique exploitable d’au moins 42 jours est nécessaire.");
  }

  const atlFactor = 1 - Math.exp(-1 / 7);
  const ctlFactor = 1 - Math.exp(-1 / 42);
  let atl = 0;
  let ctl = 0;
  let freshnessSevenDaysAgo: number | null = null;
  const dailyLoads: Array<{ date: string; load: number }> = [];

  for (let day = first; day <= today; day = nextDay(day)) {
    const key = dateKey(day);
    const load = loads.get(key) ?? 0;
    atl += (load - atl) * atlFactor;
    ctl += (load - ctl) * ctlFactor;
    dailyLoads.push({ date: key, load: round(load) });
    if ((today.getTime() - day.getTime()) / 86_400_000 === 7) {
      freshnessSevenDaysAgo = ctl - atl;
    }
  }

  const freshness = ctl - atl;
  return {
    status: "ready",
    reason: null,
    atl: round(atl),
    ctl: round(ctl),
    freshness: round(freshness),
    freshnessChange7Days:
      freshnessSevenDaysAgo === null ? null : round(freshness - freshnessSevenDaysAgo),
    dailyLoads: dailyLoads.slice(-90),
  };
}

function insufficient(reason: string): FitnessEstimate {
  return {
    status: "insufficient",
    reason,
    atl: null,
    ctl: null,
    freshness: null,
    freshnessChange7Days: null,
    dailyLoads: [],
  };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
