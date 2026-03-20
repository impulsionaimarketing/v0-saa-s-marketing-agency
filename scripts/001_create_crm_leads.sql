-- Create CRM leads table for sales pipeline management
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,
  status TEXT NOT NULL DEFAULT 'lead_novo' CHECK (status IN (
    'lead_novo',
    'entrar_em_contato',
    'proposta_enviada',
    'contrato_ativo',
    'contrato_pausado',
    'contrato_cancelado'
  )),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster status-based queries
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(status);

-- Create index for search functionality
CREATE INDEX IF NOT EXISTS idx_crm_leads_name ON public.crm_leads(name);
CREATE INDEX IF NOT EXISTS idx_crm_leads_company ON public.crm_leads(company);

-- Enable Row Level Security
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

-- Create policies for full access (adjust based on your auth requirements)
CREATE POLICY "Allow full access to crm_leads" ON public.crm_leads
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_crm_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_crm_leads_updated_at ON public.crm_leads;
CREATE TRIGGER trigger_update_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_leads_updated_at();
