-- ============================================================================
-- SCHEMA DEFINITIVO COMPLETO - TODAS AS TABELAS DO PROJETO
-- ============================================================================
-- Este arquivo contém TODAS as 21 tabelas necessárias para o projeto
-- Gerado após análise completa do código do projeto no GitHub

-- ============================================================================
-- 1. TABELA: users (Usuários do sistema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Gestor', 'Colaborador')),
  area TEXT CHECK (area IN ('Arte', 'Vídeo', 'Tráfego', 'Comunicação', NULL)),
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- ============================================================================
-- 2. TABELA: user_areas (Múltiplas áreas por usuário)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL CHECK (area IN ('Arte', 'Vídeo', 'Tráfego', 'Comunicação')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, area)
);

CREATE INDEX idx_user_areas_user_id ON public.user_areas(user_id);

-- ============================================================================
-- 3. TABELA: clients (Clientes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Serviço', 'Infoproduto', 'Local')),
  campaign_type TEXT CHECK (campaign_type IN ('Mensagem', 'Venda', 'Alcance')),
  payment_frequency TEXT CHECK (payment_frequency IN ('Semanal', 'Quinzenal', 'Mensal', 'Bimestral', 'Trimestral', 'Anual')),
  plan TEXT,
  monthly_value NUMERIC(12, 2) DEFAULT 0,
  payment_day INTEGER,
  contract_status TEXT NOT NULL DEFAULT 'Ativo' CHECK (contract_status IN ('Ativo', 'Pausado', 'Perdido')),
  contract_start_date DATE,
  contract_end_date DATE,
  renewal_date DATE,
  month_status TEXT DEFAULT 'green' CHECK (month_status IN ('green', 'yellow', 'red')),
  whatsapp_instances JSONB,
  whatsapp_group_name TEXT,
  whatsapp_group_id TEXT,
  ad_account_name TEXT,
  ad_account_id TEXT,
  business_manager_id TEXT,
  google_ads_id TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clients_status ON public.clients(contract_status);
CREATE INDEX idx_clients_type ON public.clients(type);
CREATE INDEX idx_clients_name ON public.clients(name);

-- ============================================================================
-- 4. TABELA: client_responsibles (Responsáveis por cliente)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.client_responsibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL CHECK (area IN ('Arte', 'Vídeo', 'Tráfego', 'Comunicação')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, user_id, area)
);

CREATE INDEX idx_client_responsibles_client_id ON public.client_responsibles(client_id);
CREATE INDEX idx_client_responsibles_user_id ON public.client_responsibles(user_id);

-- ============================================================================
-- 5. TABELA: demands (Demandas/Tarefas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  area TEXT NOT NULL CHECK (area IN ('Arte', 'Vídeo', 'Tráfego', 'Comunicação')),
  responsible_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'A Fazer' CHECK (status IN ('A Fazer', 'Em Produção', 'Em Revisão', 'Aprovado', 'Publicado', 'Atrasado')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_demands_client_id ON public.demands(client_id);
CREATE INDEX idx_demands_status ON public.demands(status);
CREATE INDEX idx_demands_responsible_id ON public.demands(responsible_id);
CREATE INDEX idx_demands_deadline ON public.demands(deadline);

-- ============================================================================
-- 6. TABELA: productions (Produções - Vídeos/Artes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  demand_id UUID REFERENCES public.demands(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('Arte', 'Vídeo')),
  responsible_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Planejamento' CHECK (status IN ('Planejamento', 'Produção', 'Revisão', 'Aprovado', 'Publicado')),
  post_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_productions_client_id ON public.productions(client_id);
CREATE INDEX idx_productions_demand_id ON public.productions(demand_id);
CREATE INDEX idx_productions_status ON public.productions(status);

-- ============================================================================
-- 7. TABELA: production_files (Arquivos de Produção)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.production_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('video', 'image', 'document')),
  file_name TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_production_files_production_id ON public.production_files(production_id);

-- ============================================================================
-- 8. TABELA: video_scripts (Roteiros de Vídeo)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.video_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT,
  reference_links TEXT,
  script_text TEXT,
  responsible_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Roteiro', 'Roteiro Aprovado', 'Em Gravação', 'Em Edição', 'Finalizado')),
  is_converted_to_demand BOOLEAN DEFAULT FALSE,
  demand_id UUID REFERENCES public.demands(id) ON DELETE SET NULL,
  month INTEGER,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_video_scripts_client_id ON public.video_scripts(client_id);
CREATE INDEX idx_video_scripts_demand_id ON public.video_scripts(demand_id);

-- ============================================================================
-- 9. TABELA: arte_briefs (Briefings de Arte)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.arte_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT,
  reference_links TEXT,
  description TEXT,
  colors TEXT,
  elements TEXT,
  responsible_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Criação', 'Em Revisão', 'Aprovado', 'Finalizado')),
  is_converted_to_demand BOOLEAN DEFAULT FALSE,
  demand_id UUID REFERENCES public.demands(id) ON DELETE SET NULL,
  month INTEGER,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_arte_briefs_client_id ON public.arte_briefs(client_id);
CREATE INDEX idx_arte_briefs_demand_id ON public.arte_briefs(demand_id);

-- ============================================================================
-- 10. TABELA: campaigns (Campanhas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  objective TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Completed', 'Archived')),
  start_date DATE,
  end_date DATE,
  budget NUMERIC(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaigns_client_id ON public.campaigns(client_id);

-- ============================================================================
-- 11. TABELA: payments (Pagamentos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Pago', 'Atrasado', 'Cancelado')),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_client_id ON public.payments(client_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_due_date ON public.payments(due_date);

-- ============================================================================
-- 12. TABELA: monthly_plannings (Planejamentos Mensais)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.monthly_plannings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  posts_count INTEGER,
  videos_count INTEGER,
  arts_count INTEGER,
  campaigns_count INTEGER,
  estimated_reach NUMERIC(12, 0),
  estimated_budget NUMERIC(12, 2),
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Approved', 'Completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, month, year)
);

CREATE INDEX idx_monthly_plannings_client_id ON public.monthly_plannings(client_id);

-- ============================================================================
-- 13. TABELA: alerts (Alertas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('late_task', 'no_balance', 'blocked_account', 'kpi_issue', 'pending_report')),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  related_entity_type TEXT,
  related_entity_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alerts_type ON public.alerts(type);
CREATE INDEX idx_alerts_severity ON public.alerts(severity);
CREATE INDEX idx_alerts_is_read ON public.alerts(is_read);

-- ============================================================================
-- 14. TABELA: reports (Relatórios)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reports_client_id ON public.reports(client_id);

-- ============================================================================
-- 15. TABELA: crm_leads (Leads do CRM)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  status TEXT NOT NULL DEFAULT 'Novo' CHECK (status IN ('Novo', 'Contato', 'Proposta', 'Ganho', 'Perdido')),
  source TEXT,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_crm_leads_status ON public.crm_leads(status);
CREATE INDEX idx_crm_leads_email ON public.crm_leads(email);

-- ============================================================================
-- 16. TABELA: activity_logs (Logs de Atividade)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at);

-- ============================================================================
-- 17. TABELA: dashboard_views (Salvar Visões do Dashboard)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dashboard_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  filters JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dashboard_views_user_id ON public.dashboard_views(user_id);

-- ============================================================================
-- 18. TABELA: meta_ads_insights_full (Insights Meta Ads - VIEW ou TABLE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.meta_ads_insights_full (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT,
  ad_account_id TEXT NOT NULL,
  report_date DATE NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  campaign_objective TEXT,
  campaign_status TEXT,
  adset_id TEXT NOT NULL,
  adset_name TEXT,
  ad_id TEXT NOT NULL,
  ad_name TEXT,
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(12, 2) DEFAULT 0,
  frequency NUMERIC(6, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meta_ads_client_id ON public.meta_ads_insights_full(client_id);
CREATE INDEX idx_meta_ads_campaign_id ON public.meta_ads_insights_full(campaign_id);
CREATE INDEX idx_meta_ads_report_date ON public.meta_ads_insights_full(report_date);

-- ============================================================================
-- TRIGGERS E FUNÇÕES
-- ============================================================================

-- Trigger para atualizar updated_at em users
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON public.users;
CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Trigger para atualizar updated_at em clients
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_clients_updated_at ON public.clients;
CREATE TRIGGER trigger_update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

-- Trigger para atualizar updated_at em demands
CREATE OR REPLACE FUNCTION update_demands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_demands_updated_at ON public.demands;
CREATE TRIGGER trigger_update_demands_updated_at
  BEFORE UPDATE ON public.demands
  FOR EACH ROW
  EXECUTE FUNCTION update_demands_updated_at();

-- Trigger para atualizar updated_at em productions
CREATE OR REPLACE FUNCTION update_productions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_productions_updated_at ON public.productions;
CREATE TRIGGER trigger_update_productions_updated_at
  BEFORE UPDATE ON public.productions
  FOR EACH ROW
  EXECUTE FUNCTION update_productions_updated_at();

-- Trigger para atualizar updated_at em video_scripts
CREATE OR REPLACE FUNCTION update_video_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_video_scripts_updated_at ON public.video_scripts;
CREATE TRIGGER trigger_update_video_scripts_updated_at
  BEFORE UPDATE ON public.video_scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_video_scripts_updated_at();

-- Trigger para atualizar updated_at em arte_briefs
CREATE OR REPLACE FUNCTION update_arte_briefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_arte_briefs_updated_at ON public.arte_briefs;
CREATE TRIGGER trigger_update_arte_briefs_updated_at
  BEFORE UPDATE ON public.arte_briefs
  FOR EACH ROW
  EXECUTE FUNCTION update_arte_briefs_updated_at();

-- ============================================================================
-- DADOS DE EXEMPLO (Opcional - Descomente se quiser)
-- ============================================================================

-- INSERT INTO public.users (name, email, role, status) VALUES
-- ('Admin User', 'admin@example.com', 'Admin', 'Ativo'),
-- ('Gerenciador', 'gerenciador@example.com', 'Gestor', 'Ativo'),
-- ('Colaborador', 'colaborador@example.com', 'Colaborador', 'Ativo');

-- INSERT INTO public.clients (name, type, plan, monthly_value, contract_status) VALUES
-- ('Cliente Exemplo', 'Serviço', 'Premium', 5000.00, 'Ativo');

-- ============================================================================
-- FIM DO SCHEMA DEFINITIVO
-- ============================================================================
