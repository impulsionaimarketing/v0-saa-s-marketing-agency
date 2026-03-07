-- Create monthly_plannings table
CREATE TABLE IF NOT EXISTS monthly_plannings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  videos_qty INTEGER DEFAULT 0 CHECK (videos_qty >= 0),
  artes_qty INTEGER DEFAULT 0 CHECK (artes_qty >= 0),
  trafego_qty INTEGER DEFAULT 0 CHECK (trafego_qty >= 0),
  comunicacao_qty INTEGER DEFAULT 0 CHECK (comunicacao_qty >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(client_id, month, year)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_monthly_plannings_client_id ON monthly_plannings(client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_plannings_month_year ON monthly_plannings(month, year);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_monthly_plannings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_monthly_plannings_updated_at
  BEFORE UPDATE ON monthly_plannings
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_plannings_updated_at();

-- Enable RLS
ALTER TABLE monthly_plannings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all access for authenticated users" ON monthly_plannings
  FOR ALL USING (true);

-- Create function to upsert monthly planning
CREATE OR REPLACE FUNCTION upsert_monthly_planning(
  p_client_id UUID,
  p_month INTEGER,
  p_year INTEGER,
  p_videos_qty INTEGER,
  p_artes_qty INTEGER,
  p_trafego_qty INTEGER,
  p_comunicacao_qty INTEGER
)
RETURNS monthly_plannings AS $$
DECLARE
  result monthly_plannings;
BEGIN
  INSERT INTO monthly_plannings (
    client_id,
    month,
    year,
    videos_qty,
    artes_qty,
    trafego_qty,
    comunicacao_qty
  ) VALUES (
    p_client_id,
    p_month,
    p_year,
    p_videos_qty,
    p_artes_qty,
    p_trafego_qty,
    p_comunicacao_qty
  )
  ON CONFLICT (client_id, month, year)
  DO UPDATE SET
    videos_qty = EXCLUDED.videos_qty,
    artes_qty = EXCLUDED.artes_qty,
    trafego_qty = EXCLUDED.trafego_qty,
    comunicacao_qty = EXCLUDED.comunicacao_qty,
    updated_at = CURRENT_TIMESTAMP
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
