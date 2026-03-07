-- Usuários do sistema (colaboradores da agência)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Gestor', 'Colaborador')),
  area VARCHAR(50) CHECK (area IN ('Arte', 'Vídeo', 'Tráfego', 'Comunicação')),
  status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Clientes da agência
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Serviço', 'Infoproduto', 'Local')),
  campaign_type VARCHAR(50) NOT NULL CHECK (campaign_type IN ('Mensagem', 'Venda', 'Alcance')),
  plan VARCHAR(100) NOT NULL,
  monthly_value DECIMAL(10,2) NOT NULL,
  contract_status VARCHAR(20) DEFAULT 'Ativo' CHECK (contract_status IN ('Ativo', 'Pausado', 'Perdido')),
  renewal_date DATE,
  month_status VARCHAR(10) DEFAULT 'green' CHECK (month_status IN ('green', 'yellow', 'red')),
  
  -- Integrações externas
  whatsapp_group_name VARCHAR(255),
  whatsapp_group_id VARCHAR(100),
  ad_account_name VARCHAR(255),
  ad_account_id VARCHAR(100),
  business_manager_id VARCHAR(100),
  google_ads_id VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Responsáveis por área de cada cliente (relação N:N)
CREATE TABLE IF NOT EXISTS client_responsibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  area VARCHAR(50) NOT NULL CHECK (area IN ('Arte', 'Vídeo', 'Tráfego', 'Comunicação')),
  UNIQUE(client_id, area)
);

-- Demandas (tarefas do kanban)
CREATE TABLE IF NOT EXISTS demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  area VARCHAR(50) NOT NULL CHECK (area IN ('Arte', 'Vídeo', 'Tráfego', 'Comunicação')),
  responsible_id UUID REFERENCES users(id) ON DELETE SET NULL,
  deadline DATE,
  status VARCHAR(50) DEFAULT 'A Fazer' CHECK (status IN ('A Fazer', 'Em Produção', 'Em Revisão', 'Aprovado', 'Publicado', 'Atrasado')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Pipeline de produção de conteúdo
CREATE TABLE IF NOT EXISTS productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('Vídeo', 'Arte')),
  responsible_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'Planejamento' CHECK (status IN (
    'Planejamento', 'Aprovação do Cliente', 'Captação', 'Edição', 
    'Revisão', 'Legenda', 'Programado', 'Publicado', 'Em Tráfego', 'Finalizado'
  )),
  post_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campanhas de tráfego pago
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  objective VARCHAR(100),
  platform VARCHAR(50) DEFAULT 'Meta' CHECK (platform IN ('Meta', 'Google', 'TikTok', 'LinkedIn')),
  status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Pausado', 'Finalizado')),
  daily_budget DECIMAL(10,2),
  
  -- Métricas (atualizadas periodicamente via integração)
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  messages INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  cpl DECIMAL(10,2),
  cpa DECIMAL(10,2),
  performance VARCHAR(10) DEFAULT 'green' CHECK (performance IN ('green', 'yellow', 'red')),
  
  external_campaign_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Relatórios mensais
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Elaboração', 'Enviado')),
  results_summary TEXT,
  report_url TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, month)
);

-- Alertas do sistema
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'late_task', 'no_balance', 'blocked_account', 'kpi_issue', 'pending_report'
  )),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Histórico de atividades (audit log)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_demands_client ON demands(client_id);
CREATE INDEX IF NOT EXISTS idx_demands_status ON demands(status);
CREATE INDEX IF NOT EXISTS idx_demands_responsible ON demands(responsible_id);
CREATE INDEX IF NOT EXISTS idx_productions_client ON productions(client_id);
CREATE INDEX IF NOT EXISTS idx_productions_status ON productions(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_client ON campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON alerts(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Inserir dados de exemplo
INSERT INTO users (name, email, role, area, status) VALUES
  ('Ana Silva', 'ana@agencia.com', 'Admin', NULL, 'Ativo'),
  ('Carlos Santos', 'carlos@agencia.com', 'Gestor', 'Tráfego', 'Ativo'),
  ('Marina Costa', 'marina@agencia.com', 'Colaborador', 'Arte', 'Ativo'),
  ('Pedro Lima', 'pedro@agencia.com', 'Colaborador', 'Vídeo', 'Ativo'),
  ('Julia Mendes', 'julia@agencia.com', 'Colaborador', 'Comunicação', 'Ativo')
ON CONFLICT (email) DO NOTHING;

INSERT INTO clients (name, type, campaign_type, plan, monthly_value, contract_status, renewal_date, month_status) VALUES
  ('Clínica Odontológica Sorriso', 'Serviço', 'Mensagem', 'Premium', 3500.00, 'Ativo', '2026-03-15', 'green'),
  ('Escola de Inglês ABC', 'Serviço', 'Mensagem', 'Básico', 1500.00, 'Ativo', '2026-04-01', 'yellow'),
  ('Restaurante Sabor & Arte', 'Local', 'Alcance', 'Intermediário', 2000.00, 'Ativo', '2026-02-28', 'green'),
  ('Coach Financeiro João', 'Infoproduto', 'Venda', 'Premium', 5000.00, 'Pausado', '2026-03-20', 'red'),
  ('Academia FitLife', 'Local', 'Mensagem', 'Intermediário', 2500.00, 'Ativo', '2026-05-10', 'green')
ON CONFLICT DO NOTHING;
