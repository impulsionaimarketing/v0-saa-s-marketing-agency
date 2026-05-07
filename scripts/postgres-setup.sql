-- PostgreSQL Setup Script para Migraçã o do AgencyHub
-- Execute este script no seu banco PostgreSQL

-- =============================================
-- USERS TABLE (collaboradores da agência)
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Colaborador' CHECK (role IN ('Admin', 'Gestor', 'Colaborador')),
  area VARCHAR(50) CHECK (area IN ('Arte', 'Vídeo', 'Tráfego', 'Comunicação')),
  status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CLIENTS TABLE (clientes da agência)
-- =============================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'Serviço' CHECK (type IN ('Serviço', 'Infoproduto', 'Local')),
  campaign_type VARCHAR(50) NOT NULL DEFAULT 'Mensagem' CHECK (campaign_type IN ('Mensagem', 'Venda', 'Alcance')),
  payment_frequency VARCHAR(50) DEFAULT 'Mensal' CHECK (payment_frequency IN ('Semanal', 'Quinzenal', 'Mensal', 'Bimestral', 'Trimestral', 'Anual')),
  plan VARCHAR(100) NOT NULL,
  monthly_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_day INTEGER DEFAULT 10,
  contract_status VARCHAR(20) DEFAULT 'Ativo' CHECK (contract_status IN ('Ativo', 'Pausado', 'Perdido')),
  contract_start_date DATE,
  contract_end_date DATE,
  renewal_date DATE,
  month_status VARCHAR(10) DEFAULT 'green' CHECK (month_status IN ('green', 'yellow', 'red')),
  
  -- Integrações externas
  whatsapp_group_name VARCHAR(255),
  whatsapp_group_id VARCHAR(100),
  ad_account_name VARCHAR(255),
  ad_account_id VARCHAR(100),
  business_manager_id VARCHAR(100),
  google_ads_id VARCHAR(100),
  
  status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CLIENT_RESPONSIBLES TABLE (responsáveis por área)
-- =============================================
CREATE TABLE IF NOT EXISTS public.client_responsibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  area VARCHAR(50) NOT NULL CHECK (area IN ('Arte', 'Vídeo', 'Tráfego', 'Comunicação')),
  UNIQUE(client_id, area)
);

-- =============================================
-- DEMANDS TABLE (tarefas do kanban)
-- =============================================
CREATE TABLE IF NOT EXISTS public.demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  area VARCHAR(50) NOT NULL CHECK (area IN ('Arte', 'Vídeo', 'Tráfego', 'Comunicação')),
  responsible_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  deadline DATE,
  status VARCHAR(50) DEFAULT 'A Fazer' CHECK (status IN ('A Fazer', 'Em Produção', 'Em Revisão', 'Aprovado', 'Publicado', 'Atrasado')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCTIONS TABLE (pipeline de produção)
-- =============================================
CREATE TABLE IF NOT EXISTS public.productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('Vídeo', 'Arte')),
  responsible_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'Planejamento' CHECK (status IN (
    'Planejamento', 'Aprovação do Cliente', 'Captação', 'Edição', 
    'Revisão', 'Legenda', 'Programado', 'Publicado', 'Em Tráfego', 'Finalizado'
  )),
  post_date DATE,
  notes TEXT,
  demand_id UUID REFERENCES public.demands(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CAMPAIGNS TABLE (campanhas de tráfego pago)
-- =============================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  objective VARCHAR(100),
  platform VARCHAR(50) DEFAULT 'Meta' CHECK (platform IN ('Meta', 'Google', 'TikTok', 'LinkedIn')),
  status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Pausado', 'Finalizado')),
  daily_budget DECIMAL(10,2),
  
  -- Métricas
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  messages INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  cpl DECIMAL(10,2),
  cpa DECIMAL(10,2),
  performance VARCHAR(10) DEFAULT 'green' CHECK (performance IN ('green', 'yellow', 'red')),
  
  external_campaign_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REPORTS TABLE (relatórios mensais)
-- =============================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Elaboração', 'Enviado')),
  results_summary TEXT,
  report_url TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, month)
);

-- =============================================
-- PAYMENTS TABLE (pagamentos)
-- =============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  payment_method VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCTION_FILES TABLE (arquivos de produção)
-- =============================================
CREATE TABLE IF NOT EXISTS public.production_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID REFERENCES public.productions(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ALERTS TABLE (alertas do sistema)
-- =============================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'late_task', 'no_balance', 'blocked_account', 'kpi_issue', 'pending_report'
  )),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ACTIVITY_LOGS TABLE (histórico de atividades)
-- =============================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES (para performance)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_demands_client ON public.demands(client_id);
CREATE INDEX IF NOT EXISTS idx_demands_status ON public.demands(status);
CREATE INDEX IF NOT EXISTS idx_demands_responsible ON public.demands(responsible_id);
CREATE INDEX IF NOT EXISTS idx_productions_client ON public.productions(client_id);
CREATE INDEX IF NOT EXISTS idx_productions_status ON public.productions(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_client ON public.campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON public.alerts(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments(due_date);
CREATE INDEX IF NOT EXISTS idx_production_files_production ON public.production_files(production_id);

-- =============================================
-- INSERIR DADOS DE EXEMPLO
-- =============================================

-- Criar usuários de exemplo (se a tabela estiver vazia)
INSERT INTO public.users (name, email, role, area, status) VALUES
  ('João Silva', 'joao@agencia.com', 'Admin', NULL, 'Ativo'),
  ('Maria Santos', 'maria@agencia.com', 'Gestor', 'Comunicação', 'Ativo'),
  ('Pedro Oliveira', 'pedro@agencia.com', 'Colaborador', 'Arte', 'Ativo'),
  ('Ana Costa', 'ana@agencia.com', 'Colaborador', 'Vídeo', 'Ativo'),
  ('Carlos Lima', 'carlos@agencia.com', 'Colaborador', 'Tráfego', 'Ativo')
ON CONFLICT DO NOTHING;

-- Criar clientes de exemplo (se a tabela estiver vazia)
INSERT INTO public.clients (name, type, campaign_type, plan, monthly_value, contract_status, month_status) VALUES
  ('Tech Solutions', 'Serviço', 'Mensagem', 'Premium', 5000.00, 'Ativo', 'green'),
  ('Loja Fashion', 'Local', 'Venda', 'Básico', 2500.00, 'Ativo', 'yellow'),
  ('Curso Online Pro', 'Infoproduto', 'Venda', 'Avançado', 8000.00, 'Ativo', 'green'),
  ('Restaurante Sabor', 'Local', 'Alcance', 'Básico', 1500.00, 'Pausado', 'red'),
  ('Consultoria ABC', 'Serviço', 'Mensagem', 'Premium', 6000.00, 'Ativo', 'green')
ON CONFLICT DO NOTHING;

-- =============================================
-- CONFIRMAÇÃO
-- =============================================
SELECT 'PostgreSQL setup completado com sucesso!' as status;
