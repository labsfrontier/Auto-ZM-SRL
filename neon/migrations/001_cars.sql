-- Auto ZM — schema partajata Neon (branch production, db neondb)
CREATE TABLE IF NOT EXISTS cars (
  id TEXT PRIMARY KEY,
  marca TEXT NOT NULL,
  model TEXT NOT NULL,
  an INT NOT NULL CHECK (an BETWEEN 1950 AND 2100),
  pret NUMERIC NOT NULL CHECK (pret >= 0),
  km BIGINT NOT NULL DEFAULT 0 CHECK (km >= 0),
  carburant TEXT NOT NULL DEFAULT '',
  cutie TEXT NOT NULL DEFAULT '',
  putere TEXT NOT NULL DEFAULT '',
  culoare TEXT NOT NULL DEFAULT '',
  tractiune TEXT NOT NULL DEFAULT '',
  locuri INT NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'disponibil' CHECK (status IN ('disponibil','rezervat','vandut')),
  descriere TEXT NOT NULL DEFAULT '',
  dotari JSONB NOT NULL DEFAULT '[]',
  imagini JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_marca ON cars(marca);
CREATE INDEX IF NOT EXISTS idx_cars_updated ON cars(updated_at DESC);
