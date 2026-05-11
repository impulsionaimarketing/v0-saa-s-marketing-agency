-- CRM Visual - Schema completo estilo Kommo/AmoCRM
-- Execute este script no Supabase SQL Editor

-- =============================================
-- TABELA: crm_pipelines (Funis)
-- =============================================
CREATE TABLE IF NOT EXISTS crm_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABELA: crm_columns (Colunas/Etapas do funil)
-- =============================================
CREATE TABLE IF NOT EXISTS crm_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  position INTEGER DEFAULT 0,
  lead_limit INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABELA: crm_tags (Tags coloridas)
-- =============================================
CREATE TABLE IF NOT EXISTS crm_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABELA: crm_custom_fields (Campos personalizados)
-- =============================================
CREATE TABLE IF NOT EXISTS crm_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'multiselect', 'checkbox', 'url', 'whatsapp', 'email')),
  options JSONB DEFAULT '[]',
  position INTEGER DEFAULT 0,
  required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABELA: crm_leads_v2 (Leads com estrutura completa)
-- =============================================
CREATE TABLE IF NOT EXISTS crm_leads_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES crm_columns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  value DECIMAL(15,2) DEFAULT 0,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID,
  notes TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABELA: crm_lead_tags (Relação N:N Lead-Tags)
-- =============================================
CREATE TABLE IF NOT EXISTS crm_lead_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES crm_leads_v2(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES crm_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lead_id, tag_id)
);

-- =============================================
-- TABELA: crm_lead_custom_values (Valores campos custom)
-- =============================================
CREATE TABLE IF NOT EXISTS crm_lead_custom_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES crm_leads_v2(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES crm_custom_fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lead_id, field_id)
);

-- =============================================
-- TABELA: crm_activity_history (Histórico/Timeline)
-- =============================================
CREATE TABLE IF NOT EXISTS crm_activity_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES crm_leads_v2(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ÍNDICES para performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_crm_columns_pipeline ON crm_columns(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_v2_pipeline ON crm_leads_v2(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_v2_column ON crm_leads_v2(column_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_tags_lead ON crm_lead_tags(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_tags_tag ON crm_lead_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_crm_activity_lead ON crm_activity_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_custom_fields_pipeline ON crm_custom_fields(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_custom_values_lead ON crm_lead_custom_values(lead_id);

-- =============================================
-- DADOS INICIAIS: Funil padrão
-- =============================================
INSERT INTO crm_pipelines (id, name, color, position)
VALUES ('00000000-0000-0000-0000-000000000001', 'Captação de Clientes', '#3b82f6', 0)
ON CONFLICT (id) DO NOTHING;

-- Colunas padrão para o funil
INSERT INTO crm_columns (pipeline_id, name, color, position) VALUES
('00000000-0000-0000-0000-000000000001', 'Novo Lead', '#22c55e', 0),
('00000000-0000-0000-0000-000000000001', 'Contato Inicial', '#eab308', 1),
('00000000-0000-0000-0000-000000000001', 'Reunião Marcada', '#f97316', 2),
('00000000-0000-0000-0000-000000000001', 'Proposta Enviada', '#8b5cf6', 3),
('00000000-0000-0000-0000-000000000001', 'Negociação', '#06b6d4', 4),
('00000000-0000-0000-0000-000000000001', 'Fechado', '#10b981', 5),
('00000000-0000-0000-0000-000000000001', 'Perdido', '#ef4444', 6)
ON CONFLICT DO NOTHING;

-- Tags padrão
INSERT INTO crm_tags (name, color) VALUES
('Quente', '#ef4444'),
('Frio', '#3b82f6'),
('Alto Ticket', '#f59e0b'),
('Indicação', '#22c55e'),
('Tráfego Pago', '#8b5cf6'),
('Instagram', '#ec4899'),
('WhatsApp', '#22c55e'),
('Orgânico', '#06b6d4')
ON CONFLICT DO NOTHING;
