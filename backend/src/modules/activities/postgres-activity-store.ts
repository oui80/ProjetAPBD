import type { Pool, PoolClient } from "pg";
import type {
  ActivityDetail,
  ActivityDevice,
  ActivityImport,
  ActivityLap,
  ActivityListQuery,
  ActivityListResult,
  ActivitySample,
  ActivityStore,
  ActivitySummary,
  TrainingActivity,
} from "./activity-store.js";

type ActivityRow = {
  id: string;
  original_filename: string;
  file_sha256?: string;
  sport: string | null;
  sub_sport: string | null;
  start_time: Date | null;
  duration_seconds: number | null;
  elapsed_seconds?: number | null;
  distance_meters: number | null;
  average_speed_mps: number | null;
  maximum_speed_mps?: number | null;
  average_pace_seconds_per_km: number | null;
  minimum_altitude_meters?: number | null;
  average_altitude_meters?: number | null;
  maximum_altitude_meters?: number | null;
  total_ascent_meters: number | null;
  total_descent_meters?: number | null;
  average_heart_rate_bpm: number | null;
  maximum_heart_rate_bpm?: number | null;
  average_cadence_rpm: number | null;
  maximum_cadence_rpm?: number | null;
  average_power_watts: number | null;
  maximum_power_watts?: number | null;
  devices?: ActivityDevice[];
};

type SampleRow = {
  activity_id?: string;
  recorded_at: Date | null;
  distance_meters: number | null;
  latitude_degrees: number | null;
  longitude_degrees: number | null;
  altitude_meters: number | null;
  heart_rate_bpm: number | null;
  speed_mps: number | null;
  cadence_rpm: number | null;
  power_watts: number | null;
  temperature_celsius: number | null;
};

type LapRow = {
  lap_index: number;
  start_time: Date | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  average_speed_mps: number | null;
  average_heart_rate_bpm: number | null;
  average_cadence_rpm: number | null;
  average_power_watts: number | null;
  total_ascent_meters: number | null;
};

const summaryColumns = `id, original_filename, sport, sub_sport, start_time, duration_seconds,
  distance_meters, average_speed_mps, average_pace_seconds_per_km, total_ascent_meters,
  average_heart_rate_bpm, average_cadence_rpm, average_power_watts`;

function summary(row: ActivityRow): ActivitySummary {
  return {
    id: row.id,
    filename: row.original_filename,
    sport: row.sport,
    subSport: row.sub_sport,
    startTime: row.start_time,
    durationSeconds: row.duration_seconds,
    distanceMeters: row.distance_meters,
    averageSpeedMps: row.average_speed_mps,
    averagePaceSecondsPerKm: row.average_pace_seconds_per_km,
    totalAscentMeters: row.total_ascent_meters,
    averageHeartRateBpm: row.average_heart_rate_bpm,
    averageCadenceRpm: row.average_cadence_rpm,
    averagePowerWatts: row.average_power_watts,
  };
}

function sample(row: SampleRow): ActivitySample {
  return {
    recordedAt: row.recorded_at,
    distanceMeters: row.distance_meters,
    latitudeDegrees: row.latitude_degrees,
    longitudeDegrees: row.longitude_degrees,
    altitudeMeters: row.altitude_meters,
    heartRateBpm: row.heart_rate_bpm,
    speedMps: row.speed_mps,
    cadenceRpm: row.cadence_rpm,
    powerWatts: row.power_watts,
    temperatureCelsius: row.temperature_celsius,
  };
}

function lap(row: LapRow): ActivityLap {
  return {
    lapIndex: row.lap_index,
    startTime: row.start_time,
    durationSeconds: row.duration_seconds,
    distanceMeters: row.distance_meters,
    averageSpeedMps: row.average_speed_mps,
    averageHeartRateBpm: row.average_heart_rate_bpm,
    averageCadenceRpm: row.average_cadence_rpm,
    averagePowerWatts: row.average_power_watts,
    totalAscentMeters: row.total_ascent_meters,
  };
}

export class PostgresActivityStore implements ActivityStore {
  constructor(private readonly pool: Pool) {}

  async listActivities(userId: string, query: ActivityListQuery): Promise<ActivityListResult> {
    const values: unknown[] = [userId];
    const filters = ["user_id = $1"];
    if (query.search) {
      values.push(`%${query.search}%`);
      filters.push(`(original_filename ILIKE $${values.length} OR sport ILIKE $${values.length} OR sub_sport ILIKE $${values.length})`);
    }
    if (query.sport) {
      if (query.sport === "trail") {
        filters.push("(sport ILIKE '%trail%' OR sub_sport ILIKE '%trail%')");
      } else if (query.sport === "running") {
        filters.push("sport = 'running' AND COALESCE(sub_sport, '') NOT ILIKE '%trail%'");
      } else {
        values.push(query.sport);
        filters.push(`sport = $${values.length}`);
      }
    }
    if (query.periodDays) {
      values.push(new Date(Date.now() - query.periodDays * 86_400_000));
      filters.push(`start_time >= $${values.length}`);
    }
    const where = filters.join(" AND ");
    const count = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM activities WHERE ${where}`,
      values,
    );
    values.push(query.pageSize, (query.page - 1) * query.pageSize);
    const result = await this.pool.query<ActivityRow>(
      `SELECT ${summaryColumns} FROM activities WHERE ${where}
       ORDER BY start_time ${query.sort === "asc" ? "ASC NULLS LAST" : "DESC NULLS LAST"}, created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    return {
      activities: result.rows.map(summary),
      total: Number(count.rows[0]?.total ?? 0),
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async listActivitiesForDashboard(userId: string, since: Date | null): Promise<ActivitySummary[]> {
    const result = await this.pool.query<ActivityRow>(
      `SELECT ${summaryColumns} FROM activities
       WHERE user_id = $1 AND ($2::timestamptz IS NULL OR start_time >= $2)
       ORDER BY start_time ASC NULLS LAST`,
      [userId, since],
    );
    return result.rows.map(summary);
  }

  async listTrainingActivities(userId: string): Promise<TrainingActivity[]> {
    const activities = await this.pool.query<{ id: string; start_time: Date }>(
      "SELECT id, start_time FROM activities WHERE user_id = $1 AND start_time IS NOT NULL ORDER BY start_time",
      [userId],
    );
    if (activities.rows.length === 0) return [];
    const samples = await this.pool.query<SampleRow>(
      `SELECT s.activity_id, s.recorded_at, s.distance_meters, s.latitude_degrees,
              s.longitude_degrees, s.altitude_meters, s.heart_rate_bpm, s.speed_mps,
              s.cadence_rpm, s.power_watts, s.temperature_celsius
       FROM activity_samples s JOIN activities a ON a.id = s.activity_id
       WHERE a.user_id = $1 ORDER BY s.activity_id, s.sample_index`,
      [userId],
    );
    const byActivity = new Map<string, ActivitySample[]>();
    for (const row of samples.rows) {
      const list = byActivity.get(row.activity_id!) ?? [];
      list.push(sample(row));
      byActivity.set(row.activity_id!, list);
    }
    return activities.rows.map((activity) => ({
      id: activity.id,
      startTime: activity.start_time,
      samples: byActivity.get(activity.id) ?? [],
    }));
  }

  async getActivity(userId: string, activityId: string): Promise<ActivityDetail | null> {
    const activity = await this.pool.query<ActivityRow>(
      `SELECT ${summaryColumns}, elapsed_seconds, maximum_speed_mps,
              minimum_altitude_meters, average_altitude_meters, maximum_altitude_meters,
              total_descent_meters, maximum_heart_rate_bpm, maximum_cadence_rpm,
              maximum_power_watts, devices
       FROM activities WHERE id = $1 AND user_id = $2`,
      [activityId, userId],
    );
    const row = activity.rows[0];
    if (!row) return null;
    const [samples, laps] = await Promise.all([
      this.pool.query<SampleRow>(
        `SELECT recorded_at, distance_meters, latitude_degrees, longitude_degrees,
                altitude_meters, heart_rate_bpm, speed_mps, cadence_rpm, power_watts,
                temperature_celsius
         FROM activity_samples WHERE activity_id = $1 ORDER BY sample_index`,
        [activityId],
      ),
      this.pool.query<LapRow>(
        `SELECT lap_index, start_time, duration_seconds, distance_meters, average_speed_mps,
                average_heart_rate_bpm, average_cadence_rpm, average_power_watts,
                total_ascent_meters
         FROM activity_laps WHERE activity_id = $1 ORDER BY lap_index`,
        [activityId],
      ),
    ]);
    return {
      ...summary(row),
      elapsedSeconds: row.elapsed_seconds ?? null,
      maximumSpeedMps: row.maximum_speed_mps ?? null,
      minimumAltitudeMeters: row.minimum_altitude_meters ?? null,
      averageAltitudeMeters: row.average_altitude_meters ?? null,
      maximumAltitudeMeters: row.maximum_altitude_meters ?? null,
      totalDescentMeters: row.total_descent_meters ?? null,
      maximumHeartRateBpm: row.maximum_heart_rate_bpm ?? null,
      maximumCadenceRpm: row.maximum_cadence_rpm ?? null,
      maximumPowerWatts: row.maximum_power_watts ?? null,
      devices: row.devices ?? [],
      samples: samples.rows.map(sample),
      laps: laps.rows.map(lap),
    };
  }

  async getMaxHeartRate(userId: string): Promise<number | null> {
    const result = await this.pool.query<{ max_heart_rate: number | null }>(
      "SELECT max_heart_rate FROM user_sport_settings WHERE user_id = $1",
      [userId],
    );
    return result.rows[0]?.max_heart_rate ?? null;
  }

  async setMaxHeartRate(userId: string, maxHeartRate: number | null): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_sport_settings(user_id, max_heart_rate) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE
       SET max_heart_rate = EXCLUDED.max_heart_rate, updated_at = NOW()`,
      [userId, maxHeartRate],
    );
  }

  async createActivity(activity: ActivityImport): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const inserted = await client.query(
        `INSERT INTO activities(
           id, user_id, original_filename, file_sha256, sport, sub_sport, start_time,
           duration_seconds, elapsed_seconds, distance_meters, average_speed_mps,
           maximum_speed_mps, average_pace_seconds_per_km, minimum_altitude_meters,
           average_altitude_meters, maximum_altitude_meters, total_ascent_meters,
           total_descent_meters, average_heart_rate_bpm, maximum_heart_rate_bpm,
           average_cadence_rpm, maximum_cadence_rpm, average_power_watts,
           maximum_power_watts, devices
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
         ) ON CONFLICT (user_id, file_sha256) DO NOTHING`,
        [
          activity.id, activity.userId, activity.filename, activity.sha256, activity.sport,
          activity.subSport, activity.startTime, activity.durationSeconds, activity.elapsedSeconds,
          activity.distanceMeters, activity.averageSpeedMps, activity.maximumSpeedMps,
          activity.averagePaceSecondsPerKm, activity.minimumAltitudeMeters,
          activity.averageAltitudeMeters, activity.maximumAltitudeMeters,
          activity.totalAscentMeters, activity.totalDescentMeters,
          activity.averageHeartRateBpm, activity.maximumHeartRateBpm,
          activity.averageCadenceRpm, activity.maximumCadenceRpm,
          activity.averagePowerWatts, activity.maximumPowerWatts,
          JSON.stringify(activity.devices),
        ],
      );
      if (inserted.rowCount === 0) {
        await client.query("ROLLBACK");
        return false;
      }
      await this.insertSamples(client, activity);
      await this.insertLaps(client, activity);
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async insertSamples(client: PoolClient, activity: ActivityImport): Promise<void> {
    for (let index = 0; index < activity.samples.length; index += 1) {
      const value = activity.samples[index]!;
      await client.query(
        `INSERT INTO activity_samples(
           activity_id, sample_index, recorded_at, distance_meters, latitude_degrees,
           longitude_degrees, altitude_meters, heart_rate_bpm, speed_mps, cadence_rpm,
           power_watts, temperature_celsius
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [activity.id, index, value.recordedAt, value.distanceMeters, value.latitudeDegrees,
          value.longitudeDegrees, value.altitudeMeters, value.heartRateBpm, value.speedMps,
          value.cadenceRpm, value.powerWatts, value.temperatureCelsius],
      );
    }
  }

  private async insertLaps(client: PoolClient, activity: ActivityImport): Promise<void> {
    for (const value of activity.laps) {
      await client.query(
        `INSERT INTO activity_laps(
           activity_id, lap_index, start_time, duration_seconds, distance_meters,
           average_speed_mps, average_heart_rate_bpm, average_cadence_rpm,
           average_power_watts, total_ascent_meters
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [activity.id, value.lapIndex, value.startTime, value.durationSeconds,
          value.distanceMeters, value.averageSpeedMps, value.averageHeartRateBpm,
          value.averageCadenceRpm, value.averagePowerWatts, value.totalAscentMeters],
      );
    }
  }
}
