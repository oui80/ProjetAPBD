CREATE TABLE activities (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  file_sha256 CHAR(64) NOT NULL,
  sport TEXT,
  start_time TIMESTAMPTZ,
  duration_seconds DOUBLE PRECISION,
  elapsed_seconds DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION,
  average_speed_mps DOUBLE PRECISION,
  maximum_speed_mps DOUBLE PRECISION,
  average_pace_seconds_per_km DOUBLE PRECISION,
  minimum_altitude_meters DOUBLE PRECISION,
  average_altitude_meters DOUBLE PRECISION,
  maximum_altitude_meters DOUBLE PRECISION,
  total_ascent_meters DOUBLE PRECISION,
  total_descent_meters DOUBLE PRECISION,
  average_heart_rate_bpm DOUBLE PRECISION,
  maximum_heart_rate_bpm DOUBLE PRECISION,
  average_cadence_rpm DOUBLE PRECISION,
  maximum_cadence_rpm DOUBLE PRECISION,
  average_power_watts DOUBLE PRECISION,
  maximum_power_watts DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, file_sha256)
);

CREATE INDEX activities_user_history_idx
  ON activities(user_id, start_time DESC NULLS LAST, created_at DESC);

CREATE TABLE activity_samples (
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  sample_index INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ,
  distance_meters DOUBLE PRECISION,
  latitude_degrees DOUBLE PRECISION,
  longitude_degrees DOUBLE PRECISION,
  altitude_meters DOUBLE PRECISION,
  heart_rate_bpm DOUBLE PRECISION,
  speed_mps DOUBLE PRECISION,
  cadence_rpm DOUBLE PRECISION,
  power_watts DOUBLE PRECISION,
  temperature_celsius DOUBLE PRECISION,
  PRIMARY KEY (activity_id, sample_index)
);

CREATE INDEX activity_samples_timeline_idx
  ON activity_samples(activity_id, recorded_at, sample_index);

CREATE TABLE activity_laps (
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  lap_index INTEGER NOT NULL,
  start_time TIMESTAMPTZ,
  duration_seconds DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION,
  average_speed_mps DOUBLE PRECISION,
  average_heart_rate_bpm DOUBLE PRECISION,
  average_cadence_rpm DOUBLE PRECISION,
  average_power_watts DOUBLE PRECISION,
  total_ascent_meters DOUBLE PRECISION,
  PRIMARY KEY (activity_id, lap_index)
);
