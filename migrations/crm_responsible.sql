-- Responsável pela conversa de cada lead do CRM
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS responsible_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
