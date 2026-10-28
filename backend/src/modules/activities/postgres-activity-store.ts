import type { Pool, PoolClient } from "pg";
import type { ActivityImport, ActivityStore, ActivitySummary } from "./activity-store.js";

type ActivityRow = {
  id: string;
  original_filename: string;
  sport: string | null;
  start_time: Date | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  average_speed_mps: number | null;
  average_pace_seconds_per_km: number | null;
  total_ascent_meters: number | null;
  average_heart_rate_bpm: number | null;
  average_power_watts: number | null;
};

function summary(row: ActivityRow): ActivitySummary {
  return {
    id: row.id,
    filename: row.original_filename,
    sport: row.sport,
    startTime: row.start_time,
    durationSeconds: row.duration_seconds,
    distanceMeters: row.distance_meters,
    averageSpeedMps: row.average_speed_mps,
    averagePaceSecondsPerKm: row.average_pace_seconds_per_km,
    totalAscentMeters: row.total_ascent_meters,
    averageHeartRateBpm: row.average_heart_rate_bpm,
    averagePowerWatts: row.average_power_watts,
  };
}

export class PostgresActivityStore implements ActivityStore {
  constructor(private readonly pool: Pool) {}

  async listActivities(userId: string): Promise<ActivitySummary[]> {
    const result = await this.pool.query<ActivityRow>(
      `SELECT id, original_filename, sport, start_time, duration_seconds, distance_meters,
              average_speed_mps, average_pace_seconds_per_km, total_ascent_meters,
              average_heart_rate_bpm, average_power_watts
       FROM activities WHERE user_id = $1 ORDER BY start_time DESC NULLS LAST, created_at DESC`,
      [userId],
    );
    return result.rows.map(summary);
  }

  async createActivity(activity: ActivityImport): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const inserted = await client.query(
        `INSERT INTO activities(
           id, user_id, original_filename, file_sha256, sport, start_time, duration_seconds,
           elapsed_seconds, distance_meters, average_speed_mps, maximum_speed_mps,
           average_pace_seconds_per_km, minimum_altitude_meters, average_altitude_meters,
           maximum_altitude_meters, total_ascent_meters, total_descent_meters,
           average_heart_rate_bpm, maximum_heart_rate_bpm, average_cadence_rpm,
           maximum_cadence_rpm, average_power_watts, maximum_power_watts
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
         ) ON CONFLICT (user_id, file_sha256) DO NOTHING`,
        [
          activity.id, activity.userId, activity.filename, activity.sha256, activity.sport,
          activity.startTime, activity.durationSeconds, activity.elapsedSeconds,
          activity.distanceMeters, activity.averageSpeedMps, activity.maximumSpeedMps,
          activity.averagePaceSecondsPerKm, activity.minimumAltitudeMeters,
          activity.averageAltitudeMeters, activity.maximumAltitudeMeters,
          activity.totalAscentMeters, activity.totalDescentMeters,
          activity.averageHeartRateBpm, activity.maximumHeartRateBpm,
          activity.averageCadenceRpm, activity.maximumCadenceRpm,
          activity.averagePowerWatts, activity.maximumPowerWatts,
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
      const sample = activity.samples[index]!;
      await client.query(
        `INSERT INTO activity_samples(
           activity_id, sample_index, recorded_at, distance_meters, latitude_degrees,
           longitude_degrees, altitude_meters, heart_rate_bpm, speed_mps, cadence_rpm,
           power_watts, temperature_celsius
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [activity.id, index, sample.recordedAt, sample.distanceMeters, sample.latitudeDegrees,
          sample.longitudeDegrees, sample.altitudeMeters, sample.heartRateBpm, sample.speedMps,
          sample.cadenceRpm, sample.powerWatts, sample.temperatureCelsius],
      );
    }
  }

  private async insertLaps(client: PoolClient, activity: ActivityImport): Promise<void> {
    for (const lap of activity.laps) {
      await client.query(
        `INSERT INTO activity_laps(
           activity_id, lap_index, start_time, duration_seconds, distance_meters,
           average_speed_mps, average_heart_rate_bpm, average_cadence_rpm,
           average_power_watts, total_ascent_meters
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [activity.id, lap.lapIndex, lap.startTime, lap.durationSeconds, lap.distanceMeters,
          lap.averageSpeedMps, lap.averageHeartRateBpm, lap.averageCadenceRpm,
          lap.averagePowerWatts, lap.totalAscentMeters],
      );
    }
  }
}
