CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS habitats (
 id BIGSERIAL PRIMARY KEY,
 source_record_id TEXT UNIQUE,
 scientific_name TEXT,
 species TEXT,
 observed_at DATE,
 source TEXT NOT NULL DEFAULT 'unknown',
 source_url TEXT,
 basis_of_record TEXT,
 coordinate_uncertainty_m DOUBLE PRECISION,
 geom GEOMETRY(Point,4326) NOT NULL,
 created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS habitats_geom_idx ON habitats USING GIST(geom);

CREATE TABLE IF NOT EXISTS environmental_observations (
 id BIGSERIAL PRIMARY KEY,
 observed_at TIMESTAMPTZ NOT NULL,
 variable TEXT NOT NULL,
 value DOUBLE PRECISION NOT NULL,
 unit TEXT,
 source TEXT NOT NULL,
 source_dataset TEXT,
 quality_flag TEXT,
 is_simulated BOOLEAN DEFAULT FALSE,
 geom GEOMETRY(Point,4326) NOT NULL,
 created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS env_geom_idx ON environmental_observations USING GIST(geom);
CREATE INDEX IF NOT EXISTS env_time_idx ON environmental_observations(observed_at);

CREATE TABLE IF NOT EXISTS vessel_positions (
 id BIGSERIAL PRIMARY KEY,
 vessel_id TEXT NOT NULL,
 observed_at TIMESTAMPTZ NOT NULL,
 speed_knots DOUBLE PRECISION,
 heading DOUBLE PRECISION,
 is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
 geom GEOMETRY(Point,4326) NOT NULL,
 created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS vessels_geom_idx ON vessel_positions USING GIST(geom);

CREATE TABLE IF NOT EXISTS images (
 id BIGSERIAL PRIMARY KEY,
 filename TEXT NOT NULL,
 stored_path TEXT NOT NULL,
 habitat_id BIGINT REFERENCES habitats(id) ON DELETE SET NULL,
 captured_at TIMESTAMPTZ,
 source TEXT NOT NULL DEFAULT 'user_upload',
 is_simulated BOOLEAN DEFAULT FALSE,
 created_at TIMESTAMPTZ DEFAULT NOW()
);
