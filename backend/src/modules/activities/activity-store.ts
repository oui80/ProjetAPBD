export type ActivitySummary = {
  id: string;
  filename: string;
  sport: string | null;
  startTime: Date | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  averageSpeedMps: number | null;
  averagePaceSecondsPerKm: number | null;
  totalAscentMeters: number | null;
  averageHeartRateBpm: number | null;
  averagePowerWatts: number | null;
};

export type ActivitySample = {
  recordedAt: Date | null;
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
  startTime: Date | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  averageSpeedMps: number | null;
  averageHeartRateBpm: number | null;
  averageCadenceRpm: number | null;
  averagePowerWatts: number | null;
  totalAscentMeters: number | null;
};

export type ActivityImport = ActivitySummary & {
  userId: string;
  sha256: string;
  elapsedSeconds: number | null;
  maximumSpeedMps: number | null;
  minimumAltitudeMeters: number | null;
  averageAltitudeMeters: number | null;
  maximumAltitudeMeters: number | null;
  totalDescentMeters: number | null;
  maximumHeartRateBpm: number | null;
  averageCadenceRpm: number | null;
  maximumCadenceRpm: number | null;
  maximumPowerWatts: number | null;
  samples: ActivitySample[];
  laps: ActivityLap[];
};

export interface ActivityStore {
  listActivities(userId: string): Promise<ActivitySummary[]>;
  createActivity(activity: ActivityImport): Promise<boolean>;
}
