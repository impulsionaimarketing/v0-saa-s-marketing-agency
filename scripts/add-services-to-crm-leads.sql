-- Adiciona a coluna de serviços desejados ao CRM
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS services TEXT[] NOT NULL DEFAULT '{}';
