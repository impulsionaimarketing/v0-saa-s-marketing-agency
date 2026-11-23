-- Nova coluna "Em Contato" no CRM: libera o status na trava da tabela crm_leads
ALTER TABLE public.crm_leads DROP CONSTRAINT IF EXISTS crm_leads_status_check;
ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_status_check CHECK (status IN (
  'lead_novo',
  'entrar_em_contato',
  'em_contato',
  'proposta_enviada',
  'contrato_ativo',
  'contrato_pausado',
  'contrato_cancelado'
));
