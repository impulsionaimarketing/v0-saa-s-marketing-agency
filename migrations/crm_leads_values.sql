-- Leads do CRM com dois valores: recorrente (por mês) e específico (pontual)
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS recurring_value NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS specific_value NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Propostas que já existiam: o valor antigo vira "recorrente" (ajuste no lead se for pontual)
UPDATE public.crm_leads
SET recurring_value = proposal_value
WHERE recurring_value = 0 AND specific_value = 0 AND proposal_value > 0;
