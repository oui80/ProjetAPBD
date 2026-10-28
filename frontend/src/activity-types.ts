export type ActivitySummary = {
  id: string;
  filename: string;
  sport: string | null;
  subSport: string | null;
  startTime: string | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  averageSpeedMps: number | null;
  averagePaceSecondsPerKm: number | null;
  totalAscentMeters: number | null;
  averageHeartRateBpm: number | null;
  averageCadenceRpm: number | null;
  averagePowerWatts: number | null;
};

export type ActivitySample = {
  recordedAt: string | null;
  distanceMeters: number | null;
  latitudeDegrees: number | null;
  longitudeDegrees: number | null;
  altitudeMeters: number | null;
  heartRateBpm: number | null;
  speedMps: number | null;
  cadenceRpm: number | null;
  powerWatts: number | null;
  temperatureCelsius: number | null;
};

export type ActivityLap = {
  lapIndex: number;
  startTime: string | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  averageSpeedMps: number | null;
  averageHeartRateBpm: number | null;
  averageCadenceRpm: number | null;
  averagePowerWatts: number | null;
  totalAscentMeters: number | null;
};

export type ActivityDevice = {
  manufacturer: string | null;
  productName: string | null;
  deviceType: string | null;
  serialNumber: string | null;
};

export type ActivityDetail = ActivitySummary & {
  elapsedSeconds: number | null;
  maximumSpeedMps: number | null;
  minimumAltitudeMeters: number | null;
  averageAltitudeMeters: number | null;
  maximumAltitudeMeters: number | null;
  totalDescentMeters: number | null;
  maximumHeartRateBpm: number | null;
  maximumCadenceRpm: number | null;
  maximumPowerWatts: number | null;
  devices: ActivityDevice[];
  samples: ActivitySample[];
  laps: ActivityLap[];
};

export function sportCategory(activity: Pick<ActivitySummary, "sport" | "subSport">) {
  const sport = activity.sport?.toLowerCase() ?? "";
  const subSport = activity.subSport?.toLowerCase() ?? "";
  if (subSport.includes("trail") || sport.includes("trail")) return "trail";
  if (sport.includes("cycling") || sport.includes("bike") || sport.includes("vélo")) return "cycling";
  if (sport.includes("running") || sport.includes("run") || sport.includes("course")) return "running";
  return "other";
}

export function sportLabel(activity: Pick<ActivitySummary, "sport" | "subSport">): string {
  const category = sportCategory(activity);
  if (category === "trail") return "Trail";
  if (category === "cycling") return "Vélo";
  if (category === "running") return "Course";
  return activity.subSport ?? activity.sport ?? "Sport";
}
