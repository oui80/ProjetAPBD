import type { ActivitySummary } from "./activity-store.js";

export type DashboardTotals = {
  activityCount: number;
  distanceMeters: number | null;
  durationSeconds: number | null;
  totalAscentMeters: number | null;
  sports: Record<string, number>;
  weeklyVolume: Array<{ week: string; durationSeconds: number; distanceMeters: number }>;
};

export function summarizeActivities(activities: ActivitySummary[]): DashboardTotals {
  const sports: Record<string, number> = {};
  const weeks = new Map<string, { durationSeconds: number; distanceMeters: number }>();
  for (const activity of activities) {
    const sport = sportCategory(activity.sport, activity.subSport);
    sports[sport] = (sports[sport] ?? 0) + 1;
    if (activity.startTime) {
      const week = mondayKey(activity.startTime);
      const value = weeks.get(week) ?? { durationSeconds: 0, distanceMeters: 0 };
      value.durationSeconds += activity.durationSeconds ?? 0;
      value.distanceMeters += activity.distanceMeters ?? 0;
      weeks.set(week, value);
    }
  }
  return {
    activityCount: activities.length,
    distanceMeters: sumAvailable(activities.map((activity) => activity.distanceMeters)),
    durationSeconds: sumAvailable(activities.map((activity) => activity.durationSeconds)),
    totalAscentMeters: sumAvailable(activities.map((activity) => activity.totalAscentMeters)),
    sports,
    weeklyVolume: [...weeks.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-13)
      .map(([week, value]) => ({ week, ...value })),
  };
}

function sportCategory(sport: string | null, subSport: string | null): string {
  const normalizedSport = sport?.toLowerCase() ?? "";
  const normalizedSubSport = subSport?.toLowerCase() ?? "";
  if (normalizedSubSport.includes("trail") || normalizedSport.includes("trail")) return "trail";
  if (normalizedSport.includes("cycling") || normalizedSport.includes("bike")) return "cycling";
  if (normalizedSport.includes("running") || normalizedSport.includes("run")) return "running";
  return sport ?? "other";
}

function sumAvailable(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value !== null);
  return present.length > 0 ? present.reduce((sum, value) => sum + value, 0) : null;
}

function mondayKey(date: Date): string {
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = monday.getUTCDay() || 7;
  monday.setUTCDate(monday.getUTCDate() - day + 1);
  return monday.toISOString().slice(0, 10);
}
