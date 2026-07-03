-- ========================================
-- SCHEMA COMPLETO - SISTEMA DE GESTÃO DE AGÊNCIA
-- ========================================
-- Este script cria TODAS as tabelas, índices, funções e triggers necessários
-- Execute em ordem: 
-- 1. Este script completo
-- 2. Depois adicione seus dados nas tabelas

-- ========================================
-- PARTE 1: TABELAS PRINCIPAIS
-- ========================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Colaborador' CHECK (role IN ('Admin', 'Gestor', 'Colaborador')),
  status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  avatar_url TEXT,
  modules_access TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de áreas de usuários (suporta múltiplas áreas por usuário)
CREATE TABLE IF NOT EXISTS public.user_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  area VARCHAR(50) NOT NULL CHECK (area IN ('Arte', 'Vídeo', 'Tráfego', 'Comunicação')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, area)
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'Serviço' CHECK (type IN ('Serviço', 'Infoproduto', 'Local')),
  campaign_type VARCHAR(50) NOT NULL DEFAULT 'Mensagem' CHECK (campaign_type IN ('Mensagem', 'Venda', 'Alcance')),
  payment_frequency VARCHAR(50) DEFAULT 'Mensal' CHECK (payment_frequency IN ('Semanal', 'Quinzenal', 'Mensal', 'Bimestral', 'Trimestral', 'Anual')),
  plan VARCHAR(100) NOT NULL,
  monthly_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_day INTEGER DEFAULT 10 CHECK (payment_day >= 1 AND payment_day <= 31),
  contract_status VARCHAR(20) DEFAULT 'Ativo' CHECK (contract_status IN ('Ativo', 'Pausado', 'Perdido')),
  contract_start_date DATE,
  contract_end_date DATE,
  renewal_date DATE,
  month_status VARCHAR(10) DEFAULT 'green' CHECK (month_status IN ('green', 'yellow', 'red')),
  whatsapp_instances JSONB DEFAULT '[]'::jsonb,
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

-- Tabela de responsáveis por área de cliente
CREATE TABLE IF NOT EXISTS public.client_responsibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  area VARCHAR(50) NOT NULL CHECK (area IN ('Arte', 'Vídeo', 'Tráfego', 'Comunicação')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, area)
);

-- Tabela de demandas
CREATE TABLE IF NOT EXISTS public.demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  area VARCHAR(50) NOT NULL CHECK (area IN ('Arte', 'Vídeo', 'Tráfego', 'Comunicação')),
  responsible_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  deadline DATE,
  status VARCHAR(50) DEFAULT 'A Fazer' CHECK (status IN ('A Fazer', 'Em Produção', 'Em Revisão', 'Aprovado', 'Publicado', 'Atrasado')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de produções
CREATE TABLE IF NOT EXISTS public.productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  demand_id UUID REFERENCES public.demands(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('Vídeo', 'Arte')),
  responsible_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'Planejamento' CHECK (status IN (
    'Planejamento', 'Aprovação do Cliente', 'Captação', 'Edição', 
    'Revisão', 'Legenda', 'Programado', 'Publicado', 'Em Tráfego', 'Finalizado'
  )),
  post_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de campanhas
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  objective VARCHAR(100),
  platform VARCHAR(50) DEFAULT 'Meta' CHECK (platform IN ('Meta', 'Google', 'TikTok', 'LinkedIn')),
  status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Pausado', 'Finalizado')),
  daily_budget DECIMAL(10,2),
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

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de planejamentos mensais
CREATE TABLE IF NOT EXISTS public.monthly_plannings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  videos_qty INTEGER DEFAULT 0 CHECK (videos_qty >= 0),
  artes_qty INTEGER DEFAULT 0 CHECK (artes_qty >= 0),
  trafego_qty INTEGER DEFAULT 0 CHECK (trafego_qty >= 0),
  comunicacao_qty INTEGER DEFAULT 0 CHECK (comunicacao_qty >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, month, year)
);

-- Tabela de relatórios
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Elaboração', 'Enviado')),
  results_summary TEXT,
  report_url TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, month)
);

-- Tabela de alertas
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

-- Tabela de leads (CRM)
CREATE TABLE IF NOT EXISTS public.crm_leads (
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

-- Tabela de logs de atividade
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de visualizações do dashboard
CREATE TABLE IF NOT EXISTS public.dashboard_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  user_id UUID,
  context VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  visible_metrics JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PARTE 2: ÍNDICES
-- ========================================

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Índices para user_areas
CREATE INDEX IF NOT EXISTS idx_user_areas_user_id ON public.user_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_areas_area ON public.user_areas(area);

-- Índices para clients
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_type ON public.clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_contract_status ON public.clients(contract_status);

-- Índices para client_responsibles
CREATE INDEX IF NOT EXISTS idx_client_responsibles_client_id ON public.client_responsibles(client_id);
CREATE INDEX IF NOT EXISTS idx_client_responsibles_user_id ON public.client_responsibles(user_id);
CREATE INDEX IF NOT EXISTS idx_client_responsibles_area ON public.client_responsibles(area);

-- Índices para demands
CREATE INDEX IF NOT EXISTS idx_demands_client_id ON public.demands(client_id);
CREATE INDEX IF NOT EXISTS idx_demands_responsible_id ON public.demands(responsible_id);
CREATE INDEX IF NOT EXISTS idx_demands_status ON public.demands(status);
CREATE INDEX IF NOT EXISTS idx_demands_area ON public.demands(area);
CREATE INDEX IF NOT EXISTS idx_demands_deadline ON public.demands(deadline);

-- Índices para productions
CREATE INDEX IF NOT EXISTS idx_productions_client_id ON public.productions(client_id);
CREATE INDEX IF NOT EXISTS idx_productions_demand_id ON public.productions(demand_id);
CREATE INDEX IF NOT EXISTS idx_productions_responsible_id ON public.productions(responsible_id);
CREATE INDEX IF NOT EXISTS idx_productions_status ON public.productions(status);
CREATE INDEX IF NOT EXISTS idx_productions_type ON public.productions(type);

-- Índices para campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_client_id ON public.campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_platform ON public.campaigns(platform);

-- Índices para payments
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_is_paid ON public.payments(is_paid);

-- Índices para monthly_plannings
CREATE INDEX IF NOT EXISTS idx_monthly_plannings_client_id ON public.monthly_plannings(client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_plannings_month_year ON public.monthly_plannings(month, year);

-- Índices para reports
CREATE INDEX IF NOT EXISTS idx_reports_client_id ON public.reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- Índices para alerts
CREATE INDEX IF NOT EXISTS idx_alerts_client_id ON public.alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON public.alerts(is_read);

-- Índices para crm_leads
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_name ON public.crm_leads(name);

-- Índices para dashboard_views
CREATE INDEX IF NOT EXISTS idx_dashboard_views_context ON public.dashboard_views(context);
CREATE INDEX IF NOT EXISTS idx_dashboard_views_company_id ON public.dashboard_views(company_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_views_user_id ON public.dashboard_views(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_views_is_default ON public.dashboard_views(is_default);

-- ========================================
-- PARTE 3: FUNÇÕES E TRIGGERS
-- ========================================

-- Função para atualizar updated_at em monthly_plannings
CREATE OR REPLACE FUNCTION update_monthly_plannings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_monthly_plannings_updated_at ON public.monthly_plannings;
CREATE TRIGGER trigger_update_monthly_plannings_updated_at
  BEFORE UPDATE ON public.monthly_plannings
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_plannings_updated_at();

-- NOTA: A sincronização entre demands e productions é feita no código da
-- aplicação (lib/data/productions.ts -> createLinkedProductionForDemand,
-- chamado por createDemand). Os antigos triggers de sincronização foram
-- removidos porque causavam duplicação de registros e recursão infinita.
-- NÃO recrie triggers de sync aqui.

-- Função para fazer upsert de monthly_planning
CREATE OR REPLACE FUNCTION upsert_monthly_planning(
  p_client_id UUID,
  p_month INTEGER,
  p_year INTEGER,
  p_videos_qty INTEGER,
  p_artes_qty INTEGER,
  p_trafego_qty INTEGER,
  p_comunicacao_qty INTEGER
)
RETURNS public.monthly_plannings AS $$
DECLARE
  result public.monthly_plannings;
BEGIN
  INSERT INTO public.monthly_plannings (
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
    updated_at = NOW()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PARTE 4: ROW LEVEL SECURITY (Para Supabase)
-- ========================================
-- Descomente as linhas abaixo se estiver usando Supabase

-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_areas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.client_responsibles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.productions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.monthly_plannings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.dashboard_views ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas básicas (descomentar se usar Supabase)
-- CREATE POLICY "allow_all_users" ON public.users FOR ALL USING (true);
-- CREATE POLICY "allow_all_user_areas" ON public.user_areas FOR ALL USING (true);
-- CREATE POLICY "allow_all_clients" ON public.clients FOR ALL USING (true);
-- CREATE POLICY "allow_all_client_responsibles" ON public.client_responsibles FOR ALL USING (true);
-- CREATE POLICY "allow_all_demands" ON public.demands FOR ALL USING (true);
-- CREATE POLICY "allow_all_productions" ON public.productions FOR ALL USING (true);
-- CREATE POLICY "allow_all_campaigns" ON public.campaigns FOR ALL USING (true);
-- CREATE POLICY "allow_all_payments" ON public.payments FOR ALL USING (true);
-- CREATE POLICY "allow_all_monthly_plannings" ON public.monthly_plannings FOR ALL USING (true);
-- CREATE POLICY "allow_all_reports" ON public.reports FOR ALL USING (true);
-- CREATE POLICY "allow_all_alerts" ON public.alerts FOR ALL USING (true);
-- CREATE POLICY "allow_all_crm_leads" ON public.crm_leads FOR ALL USING (true);
-- CREATE POLICY "allow_all_activity_logs" ON public.activity_logs FOR ALL USING (true);
-- CREATE POLICY "allow_all_dashboard_views" ON public.dashboard_views FOR ALL USING (true);

-- ========================================
-- FIM DO SCHEMA
-- ========================================
-- 
-- PRÓXIMOS PASSOS:
-- 1. Este script criou TODAS as tabelas, índices, funções e triggers
-- 2. Agora adicione seus dados em cada tabela
-- 3. Se usar Supabase, descomente as linhas de RLS e políticas acima
-- 4. Use INSERT para adicionar dados
--
-- EXEMPLO DE INSERT:
-- INSERT INTO public.users (name, email, role) VALUES ('João', 'joao@email.com', 'Admin');
-- INSERT INTO public.clients (name, type, plan, monthly_value) VALUES ('Cliente A', 'Serviço', 'Premium', 5000);
