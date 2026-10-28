ALTER TABLE activities ADD COLUMN sub_sport TEXT;
ALTER TABLE activities ADD COLUMN devices JSONB NOT NULL DEFAULT '[]'::JSONB;

CREATE TABLE user_sport_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  max_heart_rate SMALLINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_sport_settings_max_hr CHECK (
    max_heart_rate IS NULL OR max_heart_rate BETWEEN 100 AND 240
  )
);
