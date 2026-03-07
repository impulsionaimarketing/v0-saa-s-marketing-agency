-- PASSO 1: Criar todas as tabelas
-- Execute este script primeiro no SQL Editor do Supabase

-- Tabela de usuários
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
