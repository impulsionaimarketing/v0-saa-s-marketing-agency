-- Lead que fechou contrato vira cliente: guarda o vínculo para o lead sair do funil
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS converted_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
