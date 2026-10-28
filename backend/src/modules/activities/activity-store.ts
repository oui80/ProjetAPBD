export type ActivitySummary = {
  id: string;
  filename: string;
  sport: string | null;
  subSport: string | null;
  startTime: Date | null;
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

export type ActivityDevice = {
  manufacturer: string | null;
  productName: string | null;
  deviceType: string | null;
  serialNumber: string | null;
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
  maximumCadenceRpm: number | null;
  maximumPowerWatts: number | null;
  devices: ActivityDevice[];
  samples: ActivitySample[];
  laps: ActivityLap[];
};

export type ActivityDetail = Omit<ActivityImport, "userId" | "sha256">;

export type ActivityListQuery = {
  search?: string;
  sport?: string;
  periodDays?: number;
  sort: "asc" | "desc";
  page: number;
  pageSize: number;
};

export type ActivityListResult = {
  activities: ActivitySummary[];
  total: number;
  page: number;
  pageSize: number;
};

export type TrainingActivity = {
  id: string;
  startTime: Date;
  samples: ActivitySample[];
};

export interface ActivityStore {
  listActivities(userId: string, query: ActivityListQuery): Promise<ActivityListResult>;
  listActivitiesForDashboard(userId: string, since: Date | null): Promise<ActivitySummary[]>;
  listTrainingActivities(userId: string): Promise<TrainingActivity[]>;
  getActivity(userId: string, activityId: string): Promise<ActivityDetail | null>;
  getMaxHeartRate(userId: string): Promise<number | null>;
  setMaxHeartRate(userId: string, maxHeartRate: number | null): Promise<void>;
  createActivity(activity: ActivityImport): Promise<boolean>;
}
