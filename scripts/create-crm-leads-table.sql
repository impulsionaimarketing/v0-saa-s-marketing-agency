-- Create crm_leads table for CRM Kanban
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,
  source TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'lead_novo' CHECK (status IN (
    'lead_novo',
    'entrar_em_contato',
    'proposta_enviada',
    'contrato_ativo',
    'contrato_pausado',
    'contrato_cancelado'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);

-- Create index for search
CREATE INDEX IF NOT EXISTS idx_crm_leads_name ON crm_leads(name);

-- Enable RLS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all authenticated users to view crm_leads" 
  ON crm_leads FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow all authenticated users to insert crm_leads" 
  ON crm_leads FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update crm_leads" 
  ON crm_leads FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow all authenticated users to delete crm_leads" 
  ON crm_leads FOR DELETE 
  TO authenticated 
  USING (true);
