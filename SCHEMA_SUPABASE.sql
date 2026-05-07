-- ============================================================================
-- SCHEMA COMPLETO DO SUPABASE - MIGRAÇÃO PARA NOVO BANCO DE DADOS
-- ============================================================================
-- Este arquivo contém TODAS as tabelas, colunas e configurações 
-- exatamente como estão no seu Supabase atual.
--
-- Para executar:
-- 1. No Supabase: SQL Editor > Cole tudo > Run
-- 2. No PostgreSQL: psql -d sua_database -f SCHEMA_SUPABASE.sql
-- ============================================================================

-- ============================================================================
-- PASSO 1: CRIAR TODAS AS TABELAS
-- ============================================================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Colaborador' CHECK (role IN ('Admin', 'Gestor', 'Colaborador')),
  area VARCHAR(50) CHECK (area IN ('Arte', 'Vídeo', 'Tráfego', 'Comunicação')),
  status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  avatar_url TEXT,
  modules_access TEXT[] DEFAULT ARRAY[
    'dashboard',
    'clientes', 
    'colaboradores',
    'demandas',
    'producao',
    'trafego',
    'cobrancas',
    'alertas',
    'configuracoes'
  ],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'Serviço' CHECK (type IN ('Serviço', 'Infoproduto', 'Local')),
  campaign_type VARCHAR(50) NOT NULL DEFAULT 'Mensagem' CHECK (campaign_type IN ('Mensagem', 'Venda', 'Alcance')),
  plan VARCHAR(100) NOT NULL,
  monthly_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  contract_status VARCHAR(20) DEFAULT 'Ativo' CHECK (contract_status IN ('Ativo', 'Pausado', 'Perdido')),
  renewal_date DATE,
  month_status VARCHAR(10) DEFAULT 'green' CHECK (month_status IN ('green', 'yellow', 'red')),
  whatsapp_group_name VARCHAR(255),
  whatsapp_group_id VARCHAR(100),
  whatsapp_instances JSONB DEFAULT '[]'::jsonb,
  ad_account_name VARCHAR(255),
  ad_account_id VARCHAR(100),
  business_manager_id VARCHAR(100),
  google_ads_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de responsáveis por área
CREATE TABLE IF NOT EXISTS public.client_responsibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  area VARCHAR(50) NOT NULL CHECK (area IN ('Arte', 'Vídeo', 'Tráfego', 'Comunicação')),
  UNIQUE(client_id, area)
);

-- Tabela de demandas
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

-- Tabela de produções
CREATE TABLE IF NOT EXISTS public.productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
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
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
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

-- Tabela de relatórios
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

-- ============================================================================
-- ÍNDICES PARA MELHOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_type ON public.clients(type);
CREATE INDEX IF NOT EXISTS idx_demands_client_id ON public.demands(client_id);
CREATE INDEX IF NOT EXISTS idx_demands_responsible_id ON public.demands(responsible_id);
CREATE INDEX IF NOT EXISTS idx_demands_status ON public.demands(status);
CREATE INDEX IF NOT EXISTS idx_demands_deadline ON public.demands(deadline);
CREATE INDEX IF NOT EXISTS idx_productions_client_id ON public.productions(client_id);
CREATE INDEX IF NOT EXISTS idx_productions_demand_id ON public.productions(demand_id);
CREATE INDEX IF NOT EXISTS idx_productions_status ON public.productions(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_client_id ON public.campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_reports_client_id ON public.reports(client_id);
CREATE INDEX IF NOT EXISTS idx_alerts_client_id ON public.alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);

-- ============================================================================
-- PASSO 2: HABILITAR RLS (Row Level Security)
-- Descomente se estiver usando Supabase com autenticação
-- ============================================================================

-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.client_responsibles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.productions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASSO 3: CRIAR POLÍTICAS RLS (OPCIONAL)
-- Descomente se estiver usando Supabase com autenticação
-- ============================================================================

-- Políticas para USERS
-- CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);
-- CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (true);
-- CREATE POLICY "users_update" ON public.users FOR UPDATE USING (true);
-- CREATE POLICY "users_delete" ON public.users FOR DELETE USING (true);

-- Políticas para CLIENTS
-- CREATE POLICY "clients_select" ON public.clients FOR SELECT USING (true);
-- CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (true);
-- CREATE POLICY "clients_update" ON public.clients FOR UPDATE USING (true);
-- CREATE POLICY "clients_delete" ON public.clients FOR DELETE USING (true);

-- Políticas para CLIENT_RESPONSIBLES
-- CREATE POLICY "client_responsibles_select" ON public.client_responsibles FOR SELECT USING (true);
-- CREATE POLICY "client_responsibles_insert" ON public.client_responsibles FOR INSERT WITH CHECK (true);
-- CREATE POLICY "client_responsibles_update" ON public.client_responsibles FOR UPDATE USING (true);
-- CREATE POLICY "client_responsibles_delete" ON public.client_responsibles FOR DELETE USING (true);

-- Políticas para DEMANDS
-- CREATE POLICY "demands_select" ON public.demands FOR SELECT USING (true);
-- CREATE POLICY "demands_insert" ON public.demands FOR INSERT WITH CHECK (true);
-- CREATE POLICY "demands_update" ON public.demands FOR UPDATE USING (true);
-- CREATE POLICY "demands_delete" ON public.demands FOR DELETE USING (true);

-- Políticas para PRODUCTIONS
-- CREATE POLICY "productions_select" ON public.productions FOR SELECT USING (true);
-- CREATE POLICY "productions_insert" ON public.productions FOR INSERT WITH CHECK (true);
-- CREATE POLICY "productions_update" ON public.productions FOR UPDATE USING (true);
-- CREATE POLICY "productions_delete" ON public.productions FOR DELETE USING (true);

-- Políticas para CAMPAIGNS
-- CREATE POLICY "campaigns_select" ON public.campaigns FOR SELECT USING (true);
-- CREATE POLICY "campaigns_insert" ON public.campaigns FOR INSERT WITH CHECK (true);
-- CREATE POLICY "campaigns_update" ON public.campaigns FOR UPDATE USING (true);
-- CREATE POLICY "campaigns_delete" ON public.campaigns FOR DELETE USING (true);

-- Políticas para REPORTS
-- CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (true);
-- CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (true);
-- CREATE POLICY "reports_update" ON public.reports FOR UPDATE USING (true);
-- CREATE POLICY "reports_delete" ON public.reports FOR DELETE USING (true);

-- Políticas para ALERTS
-- CREATE POLICY "alerts_select" ON public.alerts FOR SELECT USING (true);
-- CREATE POLICY "alerts_insert" ON public.alerts FOR INSERT WITH CHECK (true);
-- CREATE POLICY "alerts_update" ON public.alerts FOR UPDATE USING (true);
-- CREATE POLICY "alerts_delete" ON public.alerts FOR DELETE USING (true);

-- Políticas para ACTIVITY_LOGS
-- CREATE POLICY "activity_logs_select" ON public.activity_logs FOR SELECT USING (true);
-- CREATE POLICY "activity_logs_insert" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- ============================================================================
-- ✅ SCHEMA CRIADO COM SUCESSO!
-- ============================================================================
-- 
-- Tabelas criadas (9 tabelas):
--   1. users (com modules_access)
--   2. clients (com whatsapp_instances)
--   3. client_responsibles
--   4. demands
--   5. productions (com demand_id)
--   6. campaigns
--   7. reports
--   8. alerts
--   9. activity_logs
--
-- Próximos passos:
-- 1. Migre os dados do Supabase antigo com: node scripts/migrate-data.js
-- 2. Verifique os dados com: SELECT COUNT(*) FROM cada_tabela;
-- 3. Teste a aplicação
--
-- ============================================================================
