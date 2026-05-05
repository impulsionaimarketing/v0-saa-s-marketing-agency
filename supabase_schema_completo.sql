-- ============================================================
-- SCHEMA COMPLETO - SUPABASE
-- Gerado automaticamente em 05/05/2026
-- Projeto: impulsionaimarketing / v0-saas-marketing-agency
-- ============================================================

-- ============================================================
-- 1. EXTENSÕES NECESSÁRIAS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. TABELAS (em ordem de dependência)
-- ============================================================

-- users (sem FK externa)
CREATE TABLE IF NOT EXISTS public.users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  role            VARCHAR(100),
  area            VARCHAR(100),
  status          VARCHAR(50) DEFAULT 'Ativo',
  password_hash   TEXT,
  avatar_url      TEXT,
  modules_access  JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- modules
CREATE TABLE IF NOT EXISTS public.modules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255),
  description  TEXT,
  icon         VARCHAR(100),
  sort_order   INTEGER DEFAULT 0
);

-- clients
CREATE TABLE IF NOT EXISTS public.clients (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(255) NOT NULL,
  type                  VARCHAR(100),
  campaign_type         VARCHAR(100),
  payment_frequency     VARCHAR(100),
  plan                  VARCHAR(100),
  monthly_value         NUMERIC(12,2),
  payment_day           INTEGER,
  contract_status       VARCHAR(100),
  contract_start_date   DATE,
  contract_end_date     DATE,
  renewal_date          DATE,
  month_status          VARCHAR(100),
  whatsapp_group_name   VARCHAR(255),
  whatsapp_group_id     VARCHAR(255),
  ad_account_name       VARCHAR(255),
  ad_account_id         VARCHAR(255),
  business_manager_id   VARCHAR(255),
  google_ads_id         VARCHAR(255),
  status                VARCHAR(50) DEFAULT 'Ativo',
  aviso_de_saldo        BOOLEAN DEFAULT FALSE,
  enviar_relatorio      BOOLEAN DEFAULT FALSE,
  whatsapp_instances    JSONB,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- alerts (depende de clients)
CREATE TABLE IF NOT EXISTS public.alerts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                 VARCHAR(100) NOT NULL,
  title                VARCHAR(255) NOT NULL,
  description          TEXT,
  severity             VARCHAR(50),
  client_id            UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  related_entity_type  VARCHAR(100),
  related_entity_id    UUID,
  is_read              BOOLEAN DEFAULT FALSE,
  is_resolved          BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- demands (depende de clients e users)
CREATE TABLE IF NOT EXISTS public.demands (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  client_id      UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  area           VARCHAR(100),
  responsible_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  deadline       DATE,
  status         VARCHAR(100),
  priority       VARCHAR(50),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- productions (depende de clients e users)
CREATE TABLE IF NOT EXISTS public.productions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  type           VARCHAR(100),
  responsible_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status         VARCHAR(100),
  post_date      DATE,
  notes          TEXT,
  description    TEXT,
  observations   TEXT,
  format         VARCHAR(100),
  dimension      VARCHAR(100),
  deadline       DATE,
  demand_id      UUID,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- production_files (depende de productions)
CREATE TABLE IF NOT EXISTS public.production_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id UUID NOT NULL REFERENCES public.productions(id) ON DELETE CASCADE,
  file_name     VARCHAR(255),
  file_url      TEXT,
  file_type     VARCHAR(100),
  file_size     BIGINT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- payments (depende de clients)
CREATE TABLE IF NOT EXISTS public.payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  due_date       DATE,
  amount         NUMERIC(12,2),
  is_paid        BOOLEAN DEFAULT FALSE,
  paid_date      DATE,
  payment_method VARCHAR(100),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- monthly_plannings (depende de clients)
CREATE TABLE IF NOT EXISTS public.monthly_plannings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  month             INTEGER NOT NULL,
  year              INTEGER NOT NULL,
  videos_qty        INTEGER DEFAULT 0,
  artes_qty         INTEGER DEFAULT 0,
  trafego_qty       INTEGER DEFAULT 0,
  comunicacao_qty   INTEGER DEFAULT 0,
  trafego_budget    NUMERIC(12,2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, month, year)
);

-- monthly_planning_items (depende de monthly_plannings)
CREATE TABLE IF NOT EXISTS public.monthly_planning_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id UUID NOT NULL REFERENCES public.monthly_plannings(id) ON DELETE CASCADE,
  type        VARCHAR(100),
  title       VARCHAR(255),
  description TEXT,
  status      VARCHAR(100),
  due_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- user_permissions (depende de users e modules)
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  module_id   UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  can_view    BOOLEAN DEFAULT FALSE,
  can_edit    BOOLEAN DEFAULT FALSE,
  is_blocked  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, module_id)
);

-- arte_briefs (depende de clients e users)
CREATE TABLE IF NOT EXISTS public.arte_briefs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  responsible_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  month          INTEGER,
  year           INTEGER,
  title          VARCHAR(255),
  description    TEXT,
  status         VARCHAR(100),
  format         VARCHAR(100),
  dimension      VARCHAR(100),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- video_scripts (depende de clients e users)
CREATE TABLE IF NOT EXISTS public.video_scripts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  responsible_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  month          INTEGER,
  year           INTEGER,
  title          VARCHAR(255),
  script         TEXT,
  status         VARCHAR(100),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- platform_balances (depende de clients)
CREATE TABLE IF NOT EXISTS public.platform_balances (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform     VARCHAR(100),
  account_id   VARCHAR(255),
  account_name VARCHAR(255),
  balance      NUMERIC(14,2),
  currency     VARCHAR(10),
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- activity_logs (sem FK obrigatória – user_id opcional)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50)  NOT NULL,
  entity_id   UUID         NOT NULL,
  changes     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- campaigns (depende de clients opcionalmente)
CREATE TABLE IF NOT EXISTS public.campaigns (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID,
  name                 VARCHAR(255),
  objective            VARCHAR(255),
  platform             VARCHAR(100),
  status               VARCHAR(100),
  daily_budget         NUMERIC(12,2),
  impressions          BIGINT,
  clicks               BIGINT,
  messages             BIGINT,
  conversions          BIGINT,
  spend                NUMERIC(12,2),
  cpl                  NUMERIC(12,4),
  cpa                  NUMERIC(12,4),
  performance          VARCHAR(100),
  external_campaign_id VARCHAR(255),
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- client_monthly_plans
CREATE TABLE IF NOT EXISTS public.client_monthly_plans (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID,
  month      INTEGER,
  year       INTEGER,
  plan_data  JSONB,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, month, year)
);

-- client_onboarding_tasks
CREATE TABLE IF NOT EXISTS public.client_onboarding_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID,
  title        VARCHAR(255),
  "order"      INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- client_responsibles
CREATE TABLE IF NOT EXISTS public.client_responsibles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID,
  area       VARCHAR(100),
  name       VARCHAR(255),
  email      VARCHAR(255),
  phone      VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, area)
);

-- reports
CREATE TABLE IF NOT EXISTS public.reports (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID,
  month      VARCHAR(20),
  data       JSONB,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, month)
);

-- notes
CREATE TABLE IF NOT EXISTS public.notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      VARCHAR(255),
  content    TEXT,
  color      VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- crm_leads
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255),
  email       VARCHAR(255),
  phone       VARCHAR(50),
  company     VARCHAR(255),
  status      VARCHAR(100),
  source      VARCHAR(100),
  notes       TEXT,
  data        JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- leads_tracking
CREATE TABLE IF NOT EXISTS public.leads_tracking (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID,
  name       VARCHAR(255),
  email      VARCHAR(255),
  phone      VARCHAR(50),
  status     VARCHAR(100),
  source     VARCHAR(100),
  notes      TEXT,
  data       JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- leads_dashboard
CREATE TABLE IF NOT EXISTS public.leads_dashboard (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name      VARCHAR(255),
  instance_name    VARCHAR(255),
  session_id       VARCHAR(255),
  contact_name     VARCHAR(255),
  contact_phone    VARCHAR(50),
  status           VARCHAR(100),
  first_message_at TIMESTAMPTZ,
  last_message_at  TIMESTAMPTZ,
  data             JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_name, instance_name, session_id),
  UNIQUE (session_id, instance_name)
);

-- clients_tracking
CREATE TABLE IF NOT EXISTS public.clients_tracking (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255),
  email      VARCHAR(255) UNIQUE,
  phone      VARCHAR(50),
  data       JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- users_trackeamento (depende de clients)
CREATE TABLE IF NOT EXISTS public.users_trackeamento (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES public.clients(id),
  client_name VARCHAR(255),
  name        VARCHAR(255),
  email       VARCHAR(255) NOT NULL UNIQUE,
  role        VARCHAR(100),
  data        JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- meta_ads_insights_full
CREATE TABLE IF NOT EXISTS public.meta_ads_insights_full (
  report_date   DATE        NOT NULL,
  ad_id         VARCHAR(255) NOT NULL,
  business_id   VARCHAR(255),
  account_id    VARCHAR(255),
  account_name  VARCHAR(255),
  campaign_id   VARCHAR(255),
  campaign_name VARCHAR(255),
  adset_id      VARCHAR(255),
  adset_name    VARCHAR(255),
  ad_name       VARCHAR(255),
  impressions   BIGINT,
  clicks        BIGINT,
  spend         NUMERIC(14,4),
  reach         BIGINT,
  cpm           NUMERIC(14,4),
  cpc           NUMERIC(14,4),
  ctr           NUMERIC(14,4),
  actions       JSONB,
  data          JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (report_date, ad_id)
);

-- n8n_chat_histories
CREATE TABLE IF NOT EXISTS public.n8n_chat_histories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    VARCHAR(255),
  instance_name VARCHAR(255),
  message_id    VARCHAR(255),
  contact_name  VARCHAR(255),
  phone         VARCHAR(50),
  role          VARCHAR(50),
  content       TEXT,
  "timestamp"   TIMESTAMPTZ,
  data          JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (instance_name, message_id)
);

-- n8n_chat_histories_criartarefas
CREATE TABLE IF NOT EXISTS public.n8n_chat_histories_criartarefas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255),
  role       VARCHAR(50),
  content    TEXT,
  data       JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- board_views
CREATE TABLE IF NOT EXISTS public.board_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255),
  data       JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- board_columns (depende de board_views)
CREATE TABLE IF NOT EXISTS public.board_columns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_view_id UUID REFERENCES public.board_views(id) ON DELETE CASCADE,
  name          VARCHAR(255),
  "order"       INTEGER DEFAULT 0,
  color         VARCHAR(50),
  data          JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- board_column_statuses (depende de board_columns)
CREATE TABLE IF NOT EXISTS public.board_column_statuses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_column_id  UUID REFERENCES public.board_columns(id) ON DELETE CASCADE,
  status_value     VARCHAR(255),
  "order"          INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. INDEXES EXTRAS (PKs já criadas acima)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs USING btree (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts USING btree (severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON public.alerts USING btree (is_read) WHERE (is_read = false);
CREATE INDEX IF NOT EXISTS idx_arte_briefs_client_id ON public.arte_briefs USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_arte_briefs_month_year ON public.arte_briefs USING btree (client_id, month, year);
CREATE INDEX IF NOT EXISTS idx_arte_briefs_status ON public.arte_briefs USING btree (status);
CREATE INDEX IF NOT EXISTS idx_campaigns_client ON public.campaigns USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_client_monthly_plans_client_id ON public.client_monthly_plans USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_client_monthly_plans_month_year ON public.client_monthly_plans USING btree (month, year);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_tasks_client_id ON public.client_onboarding_tasks USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_name ON public.crm_leads USING btree (name);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads USING btree (status);
CREATE INDEX IF NOT EXISTS idx_demands_client ON public.demands USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_demands_responsible ON public.demands USING btree (responsible_id);
CREATE INDEX IF NOT EXISTS idx_demands_status ON public.demands USING btree (status);
CREATE INDEX IF NOT EXISTS idx_leads_dashboard_client_name ON public.leads_dashboard USING btree (client_name);
CREATE INDEX IF NOT EXISTS idx_leads_dashboard_first_message_at ON public.leads_dashboard USING btree (first_message_at);
CREATE INDEX IF NOT EXISTS idx_leads_dashboard_instance_name ON public.leads_dashboard USING btree (instance_name);
CREATE INDEX IF NOT EXISTS idx_leads_dashboard_last_message_at ON public.leads_dashboard USING btree (last_message_at);
CREATE INDEX IF NOT EXISTS idx_leads_dashboard_session_id ON public.leads_dashboard USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_leads_tracking_client_id ON public.leads_tracking USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_leads_tracking_created_at ON public.leads_tracking USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_tracking_status ON public.leads_tracking USING btree (status);
CREATE INDEX IF NOT EXISTS idx_meta_ads_business_id ON public.meta_ads_insights_full USING btree (business_id);
CREATE INDEX IF NOT EXISTS idx_monthly_planning_items_planning_id ON public.monthly_planning_items USING btree (planning_id);
CREATE INDEX IF NOT EXISTS idx_monthly_planning_items_type ON public.monthly_planning_items USING btree (type);
CREATE INDEX IF NOT EXISTS idx_monthly_plannings_client_id ON public.monthly_plannings USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_plannings_month_year ON public.monthly_plannings USING btree (month, year);
CREATE INDEX IF NOT EXISTS idx_contact_name ON public.n8n_chat_histories USING btree (contact_name);
CREATE INDEX IF NOT EXISTS idx_phone ON public.n8n_chat_histories USING btree (phone);
CREATE INDEX IF NOT EXISTS idx_session ON public.n8n_chat_histories USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_timestamp ON public.n8n_chat_histories USING btree ("timestamp");
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments USING btree (due_date);
CREATE INDEX IF NOT EXISTS idx_payments_is_paid ON public.payments USING btree (is_paid);
CREATE INDEX IF NOT EXISTS idx_platform_balances_account_date ON public.platform_balances USING btree (account_id, collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_balances_client ON public.platform_balances USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_platform_balances_platform ON public.platform_balances USING btree (platform);
CREATE INDEX IF NOT EXISTS idx_production_files_production_id ON public.production_files USING btree (production_id);
CREATE INDEX IF NOT EXISTS idx_productions_client ON public.productions USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_productions_demand_id ON public.productions USING btree (demand_id);
CREATE INDEX IF NOT EXISTS idx_productions_status ON public.productions USING btree (status);
CREATE INDEX IF NOT EXISTS idx_video_scripts_client_id ON public.video_scripts USING btree (client_id);
CREATE INDEX IF NOT EXISTS idx_video_scripts_month_year ON public.video_scripts USING btree (client_id, month, year);
CREATE INDEX IF NOT EXISTS idx_video_scripts_status ON public.video_scripts USING btree (status);
CREATE INDEX IF NOT EXISTS clients_tracking_name_idx ON public.clients_tracking USING btree (name);
CREATE INDEX IF NOT EXISTS users_client_id_idx ON public.users_trackeamento USING btree (client_id);
CREATE INDEX IF NOT EXISTS users_trackeamento_email_idx ON public.users_trackeamento USING btree (email);
CREATE INDEX IF NOT EXISTS users_trackeamento_role_idx ON public.users_trackeamento USING btree (role);

-- ============================================================
-- 4. FUNCTIONS
-- ============================================================

-- hash_password
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN encode(digest(password, 'sha256'), 'hex');
END;
$$;

-- authenticate_user
CREATE OR REPLACE FUNCTION public.authenticate_user(p_email TEXT, p_password TEXT)
RETURNS TABLE(id UUID, name TEXT, email TEXT, role TEXT, area TEXT, status TEXT, authenticated BOOLEAN)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.area,
    u.status,
    (u.password_hash = crypt(p_password, u.password_hash)) as authenticated
  FROM users u
  WHERE u.email = p_email
    AND u.status = 'Ativo'
    AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$;

-- validate_login
CREATE OR REPLACE FUNCTION public.validate_login(p_email TEXT, p_password TEXT)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  v_user RECORD;
BEGIN
  SELECT id, name, email, role, area, status 
  INTO v_user
  FROM users
  WHERE email = p_email 
  AND password_hash = encode(digest(p_password, 'sha256'), 'hex')
  AND status = 'Ativo'
  LIMIT 1;

  IF v_user IS NULL THEN
    RETURN json_build_object('error', 'Invalid credentials');
  END IF;

  RETURN json_build_object(
    'id', v_user.id,
    'name', v_user.name,
    'email', v_user.email,
    'role', v_user.role,
    'area', v_user.area,
    'status', v_user.status
  );
END;
$$;

-- create_new_user
CREATE OR REPLACE FUNCTION public.create_new_user(
  p_name TEXT, p_email TEXT, p_password TEXT, p_role TEXT, p_area TEXT
)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE email = p_email;
  
  IF v_user_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Este email já está registrado');
  END IF;
  
  IF p_name IS NULL OR p_name = '' THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Nome é obrigatório');
  END IF;
  
  IF p_email IS NULL OR p_email = '' THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Email é obrigatório');
  END IF;
  
  IF p_password IS NULL OR LENGTH(p_password) < 6 THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Senha deve ter pelo menos 6 caracteres');
  END IF;
  
  INSERT INTO users (name, email, password_hash, role, area, status)
  VALUES (p_name, p_email, crypt(p_password, gen_salt('bf')), p_role, p_area, 'Ativo')
  RETURNING id INTO v_user_id;
  
  RETURN jsonb_build_object('success', TRUE, 'message', 'Usuário criado com sucesso', 'user_id', v_user_id);
END;
$$;

-- reset_user_password
CREATE OR REPLACE FUNCTION public.reset_user_password(p_email TEXT, p_new_password TEXT)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Email não encontrado no sistema');
  END IF;
  
  UPDATE users
  SET password_hash = crypt(p_new_password, gen_salt('bf')), updated_at = NOW()
  WHERE id = v_user_id;
  
  RETURN jsonb_build_object('success', TRUE, 'message', 'Senha resetada com sucesso');
END;
$$;

-- update_user_password
CREATE OR REPLACE FUNCTION public.update_user_password(p_user_id UUID, p_current_password TEXT, p_new_password TEXT)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_password_hash VARCHAR;
  v_is_valid BOOLEAN;
BEGIN
  SELECT password_hash INTO v_password_hash FROM users WHERE id = p_user_id;
  
  IF v_password_hash IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Usuário não encontrado');
  END IF;
  
  v_is_valid := (v_password_hash = crypt(p_current_password, v_password_hash));
  
  IF NOT v_is_valid THEN
    RETURN jsonb_build_object('success', FALSE, 'message', 'Senha atual incorreta');
  END IF;
  
  UPDATE users
  SET password_hash = crypt(p_new_password, gen_salt('bf')), updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object('success', TRUE, 'message', 'Senha alterada com sucesso');
END;
$$;

-- get_all_users
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE(id UUID, name TEXT, email TEXT, role TEXT, area TEXT, status TEXT, avatar_url TEXT, modules_access JSONB, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE sql AS $$
  SELECT id, name, email, role, area, status, avatar_url, modules_access, created_at, updated_at
  FROM public.users
  ORDER BY name;
$$;

-- get_user_by_id
CREATE OR REPLACE FUNCTION public.get_user_by_id(p_id UUID)
RETURNS TABLE(id UUID, name TEXT, email TEXT, role TEXT, area TEXT, status TEXT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.email, u.role, u.area, u.status
  FROM users u
  WHERE u.id = p_id;
END;
$$;

-- insert_user
CREATE OR REPLACE FUNCTION public.insert_user(p_name TEXT, p_email TEXT, p_role TEXT, p_area TEXT, p_status TEXT)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  result JSON;
BEGIN
  INSERT INTO users (name, email, role, area, status)
  VALUES (p_name, p_email, p_role, p_area, p_status)
  RETURNING row_to_json(users.*) INTO result;
  RETURN result;
END;
$$;

-- update_user
CREATE OR REPLACE FUNCTION public.update_user(p_id UUID, p_name TEXT, p_email TEXT, p_role TEXT, p_area TEXT, p_status TEXT)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  result JSON;
BEGIN
  UPDATE users SET
    name = COALESCE(p_name, name),
    email = COALESCE(p_email, email),
    role = COALESCE(p_role, role),
    area = COALESCE(p_area, area),
    status = COALESCE(p_status, status),
    updated_at = NOW()
  WHERE id = p_id
  RETURNING row_to_json(users.*) INTO result;
  RETURN result;
END;
$$;

-- delete_user_by_id
CREATE OR REPLACE FUNCTION public.delete_user_by_id(p_id UUID)
RETURNS JSON LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM users WHERE id = p_id;
  RETURN json_build_object('success', true);
END;
$$;

-- get_all_modules
CREATE OR REPLACE FUNCTION public.get_all_modules()
RETURNS TABLE(id UUID, name TEXT, display_name TEXT, description TEXT, icon TEXT, sort_order INTEGER)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.name, m.display_name, m.description, m.icon, m.sort_order
  FROM modules m
  ORDER BY m.sort_order;
END;
$$;

-- get_user_permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS TABLE(id UUID, name TEXT, display_name TEXT, description TEXT, icon TEXT, can_view BOOLEAN, can_edit BOOLEAN, is_blocked BOOLEAN)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id, m.name, m.display_name, m.description, m.icon,
    COALESCE(up.can_view, FALSE) as can_view,
    COALESCE(up.can_edit, FALSE) as can_edit,
    COALESCE(up.is_blocked, FALSE) as is_blocked
  FROM modules m
  LEFT JOIN user_permissions up ON m.id = up.module_id AND up.user_id = p_user_id
  ORDER BY m.sort_order;
END;
$$;

-- update_user_permission
CREATE OR REPLACE FUNCTION public.update_user_permission(p_user_id UUID, p_module_id UUID, p_can_view BOOLEAN, p_can_edit BOOLEAN, p_is_blocked BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO user_permissions (user_id, module_id, can_view, can_edit, is_blocked)
  VALUES (p_user_id, p_module_id, p_can_view, p_can_edit, p_is_blocked)
  ON CONFLICT (user_id, module_id) DO UPDATE SET
    can_view = p_can_view,
    can_edit = p_can_edit,
    is_blocked = p_is_blocked,
    updated_at = NOW();
  
  RETURN jsonb_build_object('success', TRUE, 'message', 'Permissão atualizada com sucesso');
END;
$$;

-- get_all_clients
CREATE OR REPLACE FUNCTION public.get_all_clients()
RETURNS TABLE(
  id UUID, name TEXT, type TEXT, campaign_type TEXT, plan TEXT, monthly_value NUMERIC,
  contract_status TEXT, renewal_date DATE, month_status TEXT,
  whatsapp_group_name TEXT, whatsapp_group_id TEXT,
  ad_account_name TEXT, ad_account_id TEXT, business_manager_id TEXT, google_ads_id TEXT,
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  payment_day INTEGER, payment_frequency TEXT,
  contract_start_date DATE, contract_end_date DATE,
  status TEXT, aviso_de_saldo BOOLEAN, enviar_relatorio BOOLEAN,
  whatsapp_instances JSONB
)
LANGUAGE sql AS $$
  SELECT
    id, name, type, campaign_type, plan, monthly_value,
    contract_status, renewal_date, month_status,
    whatsapp_group_name, whatsapp_group_id,
    ad_account_name, ad_account_id, business_manager_id, google_ads_id,
    created_at, updated_at,
    payment_day, payment_frequency,
    contract_start_date, contract_end_date,
    status, aviso_de_saldo, enviar_relatorio,
    whatsapp_instances
  FROM public.clients
  ORDER BY created_at DESC;
$$;

-- insert_client (version returning clients row)
CREATE OR REPLACE FUNCTION public.insert_client(
  p_name TEXT, p_type TEXT, p_campaign_type TEXT, p_plan TEXT, p_monthly_value NUMERIC,
  p_contract_status TEXT, p_renewal_date DATE, p_month_status TEXT,
  p_whatsapp_group_name TEXT, p_whatsapp_group_id TEXT,
  p_ad_account_name TEXT, p_ad_account_id TEXT, p_business_manager_id TEXT, p_google_ads_id TEXT
)
RETURNS public.clients LANGUAGE plpgsql AS $$
DECLARE
  v_client public.clients;
BEGIN
  INSERT INTO clients (
    name, type, campaign_type, plan, monthly_value,
    contract_status, renewal_date, month_status,
    whatsapp_group_name, whatsapp_group_id,
    ad_account_name, ad_account_id, business_manager_id, google_ads_id
  )
  VALUES (
    p_name, p_type, p_campaign_type, p_plan, p_monthly_value,
    p_contract_status, p_renewal_date, p_month_status,
    p_whatsapp_group_name, p_whatsapp_group_id,
    p_ad_account_name, p_ad_account_id, p_business_manager_id, p_google_ads_id
  )
  RETURNING * INTO v_client;
  RETURN v_client;
END;
$$;

-- delete_client
CREATE OR REPLACE FUNCTION public.delete_client(p_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM clients WHERE id = p_id;
END;
$$;

-- delete_client_by_id
CREATE OR REPLACE FUNCTION public.delete_client_by_id(p_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM clients WHERE id = p_id;
END;
$$;

-- create_client (full version)
CREATE OR REPLACE FUNCTION public.create_client(
  p_name TEXT, p_type TEXT, p_campaign_type TEXT, p_payment_frequency TEXT,
  p_plan TEXT, p_monthly_value NUMERIC, p_payment_day INTEGER,
  p_contract_status TEXT, p_contract_start_date DATE, p_contract_end_date DATE,
  p_renewal_date DATE, p_month_status TEXT,
  p_whatsapp_group_name TEXT, p_whatsapp_group_id TEXT,
  p_ad_account_name TEXT, p_ad_account_id TEXT,
  p_business_manager_id TEXT, p_google_ads_id TEXT
)
RETURNS TABLE(
  id UUID, name TEXT, type TEXT, campaign_type TEXT, payment_frequency TEXT,
  plan TEXT, monthly_value NUMERIC, payment_day INTEGER, contract_status TEXT,
  contract_start_date DATE, contract_end_date DATE, renewal_date DATE,
  month_status TEXT, whatsapp_group_name TEXT, whatsapp_group_id TEXT,
  ad_account_name TEXT, ad_account_id TEXT, business_manager_id TEXT,
  google_ads_id TEXT, status TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  INSERT INTO clients (
    name, type, campaign_type, payment_frequency, plan, monthly_value, payment_day,
    contract_status, contract_start_date, contract_end_date, renewal_date, month_status,
    whatsapp_group_name, whatsapp_group_id, ad_account_name, ad_account_id,
    business_manager_id, google_ads_id, status
  )
  VALUES (
    p_name, p_type, p_campaign_type, p_payment_frequency, p_plan, p_monthly_value, p_payment_day,
    p_contract_status, p_contract_start_date, p_contract_end_date, p_renewal_date, p_month_status,
    p_whatsapp_group_name, p_whatsapp_group_id, p_ad_account_name, p_ad_account_id,
    p_business_manager_id, p_google_ads_id, 'Ativo'
  )
  RETURNING 
    clients.id, clients.name, clients.type, clients.campaign_type, clients.payment_frequency,
    clients.plan, clients.monthly_value, clients.payment_day, clients.contract_status,
    clients.contract_start_date, clients.contract_end_date, clients.renewal_date,
    clients.month_status, clients.whatsapp_group_name, clients.whatsapp_group_id,
    clients.ad_account_name, clients.ad_account_id, clients.business_manager_id,
    clients.google_ads_id, clients.status, clients.created_at, clients.updated_at;
END;
$$;

-- update_client
CREATE OR REPLACE FUNCTION public.update_client(
  p_id UUID, p_name TEXT, p_type TEXT, p_campaign_type TEXT, p_payment_frequency TEXT,
  p_plan TEXT, p_monthly_value NUMERIC, p_payment_day INTEGER,
  p_contract_status TEXT, p_contract_start_date DATE, p_contract_end_date DATE,
  p_renewal_date DATE, p_month_status TEXT,
  p_whatsapp_group_name TEXT, p_whatsapp_group_id TEXT,
  p_ad_account_name TEXT, p_ad_account_id TEXT,
  p_business_manager_id TEXT, p_google_ads_id TEXT
)
RETURNS TABLE(
  id UUID, name TEXT, type TEXT, campaign_type TEXT, payment_frequency TEXT,
  plan TEXT, monthly_value NUMERIC, payment_day INTEGER, contract_status TEXT,
  contract_start_date DATE, contract_end_date DATE, renewal_date DATE,
  month_status TEXT, whatsapp_group_name TEXT, whatsapp_group_id TEXT,
  ad_account_name TEXT, ad_account_id TEXT, business_manager_id TEXT,
  google_ads_id TEXT, status TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  UPDATE clients SET 
    name = p_name, type = p_type, campaign_type = p_campaign_type,
    payment_frequency = p_payment_frequency, plan = p_plan, monthly_value = p_monthly_value,
    payment_day = p_payment_day, contract_status = p_contract_status,
    contract_start_date = p_contract_start_date, contract_end_date = p_contract_end_date,
    renewal_date = p_renewal_date, month_status = p_month_status,
    whatsapp_group_name = p_whatsapp_group_name, whatsapp_group_id = p_whatsapp_group_id,
    ad_account_name = p_ad_account_name, ad_account_id = p_ad_account_id,
    business_manager_id = p_business_manager_id, google_ads_id = p_google_ads_id,
    updated_at = NOW()
  WHERE clients.id = p_id
  RETURNING 
    clients.id, clients.name, clients.type, clients.campaign_type, clients.payment_frequency,
    clients.plan, clients.monthly_value, clients.payment_day, clients.contract_status,
    clients.contract_start_date, clients.contract_end_date, clients.renewal_date,
    clients.month_status, clients.whatsapp_group_name, clients.whatsapp_group_id,
    clients.ad_account_name, clients.ad_account_id, clients.business_manager_id,
    clients.google_ads_id, clients.status, clients.created_at, clients.updated_at;
END;
$$;

-- insert_default_onboarding_tasks
CREATE OR REPLACE FUNCTION public.insert_default_onboarding_tasks(p_client_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO client_onboarding_tasks (client_id, title, "order")
  VALUES
    (p_client_id, 'Grupo no WhatsApp criado', 1),
    (p_client_id, 'Acesso ao Facebook Ads concedido', 2),
    (p_client_id, 'Acesso ao Google Ads concedido', 3),
    (p_client_id, 'Configuração de contas realizada', 4),
    (p_client_id, 'Reunião de alinhamento feita', 5),
    (p_client_id, 'Briefing preenchido', 6),
    (p_client_id, 'Planejamento inicial definido', 7);
END;
$$;

-- get_all_demands
CREATE OR REPLACE FUNCTION public.get_all_demands()
RETURNS TABLE(
  id UUID, name TEXT, description TEXT, client_id UUID, client_name TEXT,
  area TEXT, responsible_id UUID, responsible_name TEXT,
  deadline DATE, status TEXT, priority TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id, d.name, d.description, d.client_id,
    c.name AS client_name,
    d.area, d.responsible_id,
    u.name AS responsible_name,
    d.deadline, d.status, d.priority, d.created_at, d.updated_at
  FROM public.demands d
  LEFT JOIN public.clients c ON c.id = d.client_id
  LEFT JOIN public.users u ON u.id = d.responsible_id;
END;
$$;

-- insert_demand
CREATE OR REPLACE FUNCTION public.insert_demand(
  p_name TEXT, p_description TEXT, p_client_id UUID, p_area TEXT,
  p_responsible_id UUID, p_deadline DATE, p_status TEXT, p_priority TEXT
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO demands (name, description, client_id, area, responsible_id, deadline, status, priority)
  VALUES (p_name, p_description, p_client_id, p_area, p_responsible_id, p_deadline, p_status, p_priority)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- update_demand
CREATE OR REPLACE FUNCTION public.update_demand(
  p_id UUID, p_name TEXT, p_description TEXT, p_client_id UUID, p_area TEXT,
  p_responsible_id UUID, p_deadline DATE, p_status TEXT, p_priority TEXT
)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE demands SET
    name = p_name, description = p_description, client_id = p_client_id,
    area = p_area, responsible_id = p_responsible_id, deadline = p_deadline,
    status = p_status, priority = p_priority, updated_at = now()
  WHERE id = p_id;
END;
$$;

-- update_demand_status
CREATE OR REPLACE FUNCTION public.update_demand_status(p_id UUID, p_status TEXT)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  result JSON;
BEGIN
  UPDATE demands SET status = p_status, updated_at = NOW()
  WHERE id = p_id
  RETURNING row_to_json(demands.*) INTO result;
  RETURN result;
END;
$$;

-- delete_demand_by_id
CREATE OR REPLACE FUNCTION public.delete_demand_by_id(p_id UUID)
RETURNS JSON LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM demands WHERE id = p_id;
  RETURN json_build_object('success', true);
END;
$$;

-- get_all_productions
CREATE OR REPLACE FUNCTION public.get_all_productions()
RETURNS TABLE(
  id UUID, client_id UUID, client_name TEXT, type TEXT,
  responsible_id UUID, responsible_name TEXT, status TEXT,
  post_date DATE, notes TEXT, demand_id UUID, created_at TIMESTAMPTZ
)
LANGUAGE sql AS $$
  SELECT 
    p.id, p.client_id, c.name AS client_name, p.type,
    p.responsible_id, u.name AS responsible_name,
    p.status, p.post_date, p.notes, p.demand_id, p.created_at
  FROM productions p
  LEFT JOIN clients c ON c.id = p.client_id
  LEFT JOIN users u ON u.id = p.responsible_id
  ORDER BY p.created_at DESC;
$$;

-- get_productions (full version)
CREATE OR REPLACE FUNCTION public.get_productions()
RETURNS TABLE(
  id UUID, client_id UUID, client_name TEXT, type TEXT,
  responsible_id UUID, responsible_name TEXT, status TEXT,
  post_date DATE, notes TEXT, description TEXT, observations TEXT,
  format TEXT, dimension TEXT, deadline DATE, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.client_id, c.name AS client_name, p.type,
    p.responsible_id, u.name AS responsible_name,
    p.status, p.post_date, p.notes, p.description, p.observations,
    p.format, p.dimension, p.deadline, p.created_at, p.updated_at
  FROM productions p
  LEFT JOIN clients c ON p.client_id = c.id
  LEFT JOIN users u ON p.responsible_id = u.id
  ORDER BY p.created_at DESC;
END;
$$;

-- insert_production (json version)
CREATE OR REPLACE FUNCTION public.insert_production(
  p_client_id UUID, p_type TEXT, p_responsible_id UUID,
  p_status TEXT, p_post_date DATE, p_notes TEXT
)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  result JSON;
BEGIN
  INSERT INTO productions (client_id, type, responsible_id, status, post_date, notes)
  VALUES (p_client_id, p_type, p_responsible_id, p_status, p_post_date, p_notes)
  RETURNING row_to_json(productions.*) INTO result;
  RETURN result;
END;
$$;

-- update_production_status
CREATE OR REPLACE FUNCTION public.update_production_status(p_id UUID, p_status TEXT)
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  result JSON;
BEGIN
  UPDATE productions SET status = p_status, updated_at = NOW()
  WHERE id = p_id
  RETURNING row_to_json(productions.*) INTO result;
  RETURN result;
END;
$$;

-- delete_production_by_id
CREATE OR REPLACE FUNCTION public.delete_production_by_id(p_id UUID)
RETURNS VOID LANGUAGE sql AS $$
DELETE FROM productions WHERE id = p_id;
$$;

-- get_all_payments
CREATE OR REPLACE FUNCTION public.get_all_payments()
RETURNS TABLE(
  id UUID, client_id UUID, client_name TEXT, due_date DATE, amount NUMERIC,
  is_paid BOOLEAN, paid_date DATE, payment_method TEXT, notes TEXT, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.client_id, c.name AS client_name,
    p.due_date, p.amount, p.is_paid, p.paid_date, p.payment_method, p.notes, p.created_at
  FROM payments p
  LEFT JOIN clients c ON p.client_id = c.id
  ORDER BY p.due_date DESC;
END;
$$;

-- get_payments
CREATE OR REPLACE FUNCTION public.get_payments()
RETURNS TABLE(
  id UUID, client_id UUID, client_name TEXT, due_date DATE, amount NUMERIC,
  is_paid BOOLEAN, paid_date DATE, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.client_id, c.name AS client_name,
    p.due_date, p.amount, p.is_paid, p.paid_date, p.created_at
  FROM payments p
  LEFT JOIN clients c ON p.client_id = c.id
  ORDER BY p.due_date DESC;
END;
$$;

-- insert_payment
CREATE OR REPLACE FUNCTION public.insert_payment(
  p_client_id UUID, p_due_date DATE, p_amount NUMERIC, p_is_paid BOOLEAN, p_paid_date DATE
)
RETURNS TABLE(
  id UUID, client_id UUID, due_date DATE, amount NUMERIC,
  is_paid BOOLEAN, paid_date DATE, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  INSERT INTO payments (client_id, due_date, amount, is_paid, paid_date)
  VALUES (p_client_id, p_due_date, p_amount, p_is_paid, p_paid_date)
  RETURNING payments.id, payments.client_id, payments.due_date, payments.amount,
            payments.is_paid, payments.paid_date, payments.created_at;
END;
$$;

-- update_payment
CREATE OR REPLACE FUNCTION public.update_payment(
  p_payment_id UUID, p_is_paid BOOLEAN, p_paid_date DATE
)
RETURNS TABLE(id UUID, client_id UUID, due_date DATE, amount NUMERIC, is_paid BOOLEAN, paid_date DATE, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  UPDATE payments
  SET
    is_paid = p_is_paid,
    paid_date = CASE WHEN p_is_paid THEN COALESCE(p_paid_date, CURRENT_DATE) ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_payment_id
  RETURNING payments.id, payments.client_id, payments.due_date, payments.amount,
            payments.is_paid, payments.paid_date, payments.updated_at;
END;
$$;

-- generate_monthly_payments
CREATE OR REPLACE FUNCTION public.generate_monthly_payments(p_month INTEGER, p_year INTEGER)
RETURNS TABLE(success BOOLEAN, message TEXT, count INTEGER)
LANGUAGE plpgsql AS $$
DECLARE
    v_client RECORD;
    v_due_date DATE;
    v_created_count INTEGER := 0;
    v_exists BOOLEAN;
BEGIN
    FOR v_client IN 
        SELECT id, name, monthly_value, COALESCE(payment_day, 10) AS payment_day
        FROM clients
        WHERE TRIM(LOWER(contract_status)) = 'ativo'
          AND monthly_value IS NOT NULL
          AND monthly_value > 0
    LOOP
        v_due_date := make_date(
            p_year, p_month,
            LEAST(v_client.payment_day,
                  EXTRACT(DAY FROM (make_date(p_year, p_month, 1) + INTERVAL '1 month - 1 day'))::INTEGER)
        );

        SELECT EXISTS(
            SELECT 1 FROM payments
            WHERE client_id = v_client.id
              AND EXTRACT(MONTH FROM due_date) = p_month
              AND EXTRACT(YEAR FROM due_date) = p_year
        ) INTO v_exists;

        IF NOT v_exists THEN
            INSERT INTO payments (client_id, due_date, amount, is_paid)
            VALUES (v_client.id, v_due_date, v_client.monthly_value, FALSE);
            v_created_count := v_created_count + 1;
        END IF;
    END LOOP;

    IF v_created_count > 0 THEN
        RETURN QUERY SELECT TRUE, format('%s pagamentos criados para %s/%s', v_created_count, p_month, p_year), v_created_count;
    ELSE
        RETURN QUERY SELECT TRUE, format('Nenhum pagamento novo para criar em %s/%s', p_month, p_year), 0;
    END IF;
END;
$$;

-- upsert_monthly_planning (version with trafego_budget)
CREATE OR REPLACE FUNCTION public.upsert_monthly_planning(
  p_client_id UUID, p_month INTEGER, p_year INTEGER,
  p_videos_qty INTEGER, p_artes_qty INTEGER, p_trafego_budget NUMERIC
)
RETURNS public.monthly_plannings LANGUAGE plpgsql AS $$
DECLARE
  result public.monthly_plannings;
BEGIN
  INSERT INTO monthly_plannings (client_id, month, year, videos_qty, artes_qty, trafego_budget)
  VALUES (p_client_id, p_month, p_year, p_videos_qty, p_artes_qty, p_trafego_budget)
  ON CONFLICT (client_id, month, year)
  DO UPDATE SET
    videos_qty = EXCLUDED.videos_qty,
    artes_qty = EXCLUDED.artes_qty,
    trafego_budget = EXCLUDED.trafego_budget,
    updated_at = CURRENT_TIMESTAMP
  RETURNING * INTO result;
  RETURN result;
END;
$$;

-- increment_monthly_planning_counter
CREATE OR REPLACE FUNCTION public.increment_monthly_planning_counter(
  p_client_id UUID, p_type TEXT, p_date DATE
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_month INT;
  v_year INT;
  v_planning_id UUID;
BEGIN
  v_month := EXTRACT(MONTH FROM p_date);
  v_year  := EXTRACT(YEAR  FROM p_date);
  
  SELECT id INTO v_planning_id
  FROM monthly_plannings
  WHERE client_id = p_client_id AND month = v_month AND year = v_year;
  
  IF v_planning_id IS NULL THEN
    INSERT INTO monthly_plannings (client_id, month, year, videos_qty, artes_qty, trafego_budget)
    VALUES (p_client_id, v_month, v_year, 0, 0, 0)
    RETURNING id INTO v_planning_id;
  END IF;
  
  IF p_type = 'Vídeo' THEN
    UPDATE monthly_plannings SET videos_qty = videos_qty + 1 WHERE id = v_planning_id;
  ELSIF p_type = 'Arte' THEN
    UPDATE monthly_plannings SET artes_qty = artes_qty + 1 WHERE id = v_planning_id;
  END IF;
END;
$$;

-- decrement_monthly_planning_counter
CREATE OR REPLACE FUNCTION public.decrement_monthly_planning_counter(
  p_client_id UUID, p_type TEXT, p_date DATE
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_month INT;
  v_year  INT;
BEGIN
  v_month := EXTRACT(MONTH FROM p_date);
  v_year  := EXTRACT(YEAR  FROM p_date);
  
  IF p_type = 'Vídeo' THEN
    UPDATE monthly_plannings SET videos_qty = GREATEST(videos_qty - 1, 0)
    WHERE client_id = p_client_id AND month = v_month AND year = v_year;
  ELSIF p_type = 'Arte' THEN
    UPDATE monthly_plannings SET artes_qty = GREATEST(artes_qty - 1, 0)
    WHERE client_id = p_client_id AND month = v_month AND year = v_year;
  END IF;
END;
$$;

-- get_all_alerts
CREATE OR REPLACE FUNCTION public.get_all_alerts()
RETURNS TABLE(
  id UUID, type TEXT, title TEXT, description TEXT, severity TEXT,
  client_id UUID, related_entity_type TEXT, related_entity_id UUID,
  is_read BOOLEAN, is_resolved BOOLEAN, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id, a.type, a.title, a.description, a.severity,
    a.client_id, a.related_entity_type, a.related_entity_id,
    a.is_read, a.is_resolved, a.created_at
  FROM alerts a
  ORDER BY a.created_at DESC;
END;
$$;

-- insert_alert
CREATE OR REPLACE FUNCTION public.insert_alert(
  p_type TEXT, p_title TEXT, p_description TEXT, p_severity TEXT,
  p_client_id UUID, p_related_entity_type TEXT, p_related_entity_id UUID
)
RETURNS public.alerts LANGUAGE plpgsql AS $$
DECLARE
  v_alert public.alerts;
BEGIN
  INSERT INTO alerts (type, title, description, severity, client_id, related_entity_type, related_entity_id)
  VALUES (p_type, p_title, p_description, p_severity, p_client_id, p_related_entity_type, p_related_entity_id)
  RETURNING * INTO v_alert;
  RETURN v_alert;
END;
$$;

-- mark_alert_read
CREATE OR REPLACE FUNCTION public.mark_alert_read(p_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE alerts SET is_read = TRUE WHERE id = p_id;
END;
$$;

-- mark_all_alerts_read
CREATE OR REPLACE FUNCTION public.mark_all_alerts_read()
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE alerts SET is_read = TRUE WHERE is_read = FALSE;
END;
$$;

-- resolve_alert
CREATE OR REPLACE FUNCTION public.resolve_alert(p_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE alerts SET is_resolved = TRUE WHERE id = p_id;
END;
$$;

-- delete_alert
CREATE OR REPLACE FUNCTION public.delete_alert(p_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM alerts WHERE id = p_id;
END;
$$;

-- get_all_campaigns
CREATE OR REPLACE FUNCTION public.get_all_campaigns()
RETURNS TABLE(
  id UUID, client_id UUID, name TEXT, objective TEXT, platform TEXT, status TEXT,
  daily_budget NUMERIC, impressions BIGINT, clicks BIGINT, messages BIGINT, conversions BIGINT,
  spend NUMERIC, cpl NUMERIC, cpa NUMERIC, performance TEXT,
  external_campaign_id TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id, c.client_id, c.name, c.objective, c.platform, c.status,
    c.daily_budget, c.impressions, c.clicks, c.messages, c.conversions,
    c.spend, c.cpl, c.cpa, c.performance, c.external_campaign_id,
    c.created_at, c.updated_at
  FROM campaigns c
  ORDER BY c.created_at DESC;
END;
$$;

-- get_dashboard_stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalClients',   (SELECT COUNT(*) FROM clients),
    'activeClients',  (SELECT COUNT(*) FROM clients WHERE contract_status = 'Ativo'),
    'pendingDemands', (SELECT COUNT(*) FROM demands WHERE status IN ('A Fazer', 'Em Produção', 'Em Revisão')),
    'lateDemands',    (SELECT COUNT(*) FROM demands WHERE status = 'Atrasado' OR (deadline < CURRENT_DATE AND status NOT IN ('Publicado', 'Aprovado'))),
    'totalAlerts',    (SELECT COUNT(*) FROM alerts WHERE is_resolved = false),
    'unreadAlerts',   (SELECT COUNT(*) FROM alerts WHERE is_resolved = false AND is_read = false)
  ) INTO result;
  RETURN result;
END;
$$;

-- ============================================================
-- 5. TRIGGER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_arte_briefs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_monthly_planning_items_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_monthly_plannings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_payments_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_video_scripts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at_leads_dashboard()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_user_client_name()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.client_id IS NOT NULL THEN
      SELECT name INTO NEW.client_name FROM public.clients WHERE id = NEW.client_id;
    ELSE
      NEW.client_name := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_increment_planning_on_demand()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.area = 'Vídeo' OR NEW.area = 'Arte') AND NEW.deadline IS NOT NULL THEN
    PERFORM increment_monthly_planning_counter(NEW.client_id, NEW.area, NEW.deadline::DATE);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_decrement_planning_on_demand_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (OLD.area = 'Vídeo' OR OLD.area = 'Arte') AND OLD.deadline IS NOT NULL THEN
    PERFORM decrement_monthly_planning_counter(OLD.client_id, OLD.area, OLD.deadline::DATE);
  END IF;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_increment_planning_on_production()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  PERFORM increment_monthly_planning_counter(
    NEW.client_id, NEW.type, COALESCE(NEW.post_date, CURRENT_DATE)
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_decrement_planning_on_production_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  PERFORM decrement_monthly_planning_counter(
    OLD.client_id, OLD.type, COALESCE(OLD.post_date, CURRENT_DATE)
  );
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_demand_to_production()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('myapp.trigger_depth', TRUE) IS NULL THEN
    PERFORM set_config('myapp.trigger_depth', '1', TRUE);
    IF NEW.area IN ('Arte', 'Vídeo') THEN
      INSERT INTO productions (client_id, type, responsible_id, status, post_date, notes)
      VALUES (NEW.client_id, NEW.area::text, NEW.responsible_id, 'Planejamento', NEW.deadline, 'Demanda: ' || NEW.name);
    END IF;
    PERFORM set_config('myapp.trigger_depth', NULL, TRUE);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_production_to_demand()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('myapp.trigger_depth', TRUE) IS NULL THEN
    PERFORM set_config('myapp.trigger_depth', '1', TRUE);
    INSERT INTO demands (name, description, client_id, area, responsible_id, deadline, status, priority)
    VALUES (
      LEFT(COALESCE(NEW.notes, 'Novo ' || NEW.type), 255),
      NULL, NEW.client_id, NEW.type::text, NEW.responsible_id, NEW.post_date, 'A Fazer', 'medium'
    );
    PERFORM set_config('myapp.trigger_depth', NULL, TRUE);
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

CREATE TRIGGER trigger_update_arte_briefs_updated_at
  BEFORE UPDATE ON public.arte_briefs
  FOR EACH ROW EXECUTE FUNCTION update_arte_briefs_updated_at();

CREATE TRIGGER demands_increment_planning
  AFTER INSERT ON public.demands
  FOR EACH ROW EXECUTE FUNCTION trigger_increment_planning_on_demand();

CREATE TRIGGER demands_decrement_planning
  AFTER DELETE ON public.demands
  FOR EACH ROW EXECUTE FUNCTION trigger_decrement_planning_on_demand_delete();

CREATE TRIGGER trigger_sync_demand_to_production
  AFTER INSERT ON public.demands
  FOR EACH ROW EXECUTE FUNCTION sync_demand_to_production();

CREATE TRIGGER trg_set_updated_at_leads_dashboard
  BEFORE UPDATE ON public.leads_dashboard
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_leads_dashboard();

CREATE TRIGGER trigger_update_monthly_planning_items_updated_at
  BEFORE UPDATE ON public.monthly_planning_items
  FOR EACH ROW EXECUTE FUNCTION update_monthly_planning_items_updated_at();

CREATE TRIGGER trigger_update_monthly_plannings_updated_at
  BEFORE UPDATE ON public.monthly_plannings
  FOR EACH ROW EXECUTE FUNCTION update_monthly_plannings_updated_at();

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_payments_updated_at();

CREATE TRIGGER productions_increment_planning
  AFTER INSERT ON public.productions
  FOR EACH ROW EXECUTE FUNCTION trigger_increment_planning_on_production();

CREATE TRIGGER productions_decrement_planning
  AFTER DELETE ON public.productions
  FOR EACH ROW EXECUTE FUNCTION trigger_decrement_planning_on_production_delete();

CREATE TRIGGER trigger_sync_production_to_demand
  AFTER INSERT ON public.productions
  FOR EACH ROW EXECUTE FUNCTION sync_production_to_demand();

CREATE TRIGGER trg_sync_user_client_name
  BEFORE INSERT OR UPDATE ON public.users_trackeamento
  FOR EACH ROW EXECUTE FUNCTION sync_user_client_name();

CREATE TRIGGER trigger_update_video_scripts_updated_at
  BEFORE UPDATE ON public.video_scripts
  FOR EACH ROW EXECUTE FUNCTION update_video_scripts_updated_at();

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arte_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_responsibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_planning_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_plannings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_trackeamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_scripts ENABLE ROW LEVEL SECURITY;

-- activity_logs
CREATE POLICY "Enable read for authenticated users" ON public.activity_logs FOR SELECT TO public USING (auth.role() = 'authenticated');
CREATE POLICY "public_insert_activity_logs" ON public.activity_logs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_read_activity_logs" ON public.activity_logs FOR SELECT TO public USING (true);

-- alerts
CREATE POLICY "Enable read for authenticated users" ON public.alerts FOR SELECT TO public USING (auth.role() = 'authenticated');

-- arte_briefs
CREATE POLICY "Enable all access for authenticated users" ON public.arte_briefs FOR ALL TO public USING (true);

-- campaigns
CREATE POLICY "Enable read for authenticated users" ON public.campaigns FOR SELECT TO public USING (auth.role() = 'authenticated');
CREATE POLICY "public_delete_campaigns" ON public.campaigns FOR DELETE TO public USING (true);
CREATE POLICY "public_insert_campaigns" ON public.campaigns FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_read_campaigns" ON public.campaigns FOR SELECT TO public USING (true);
CREATE POLICY "public_update_campaigns" ON public.campaigns FOR UPDATE TO public USING (true);

-- client_responsibles
CREATE POLICY "Enable read for authenticated users" ON public.client_responsibles FOR SELECT TO public USING (auth.role() = 'authenticated');
CREATE POLICY "public_delete_client_responsibles" ON public.client_responsibles FOR DELETE TO public USING (true);
CREATE POLICY "public_insert_client_responsibles" ON public.client_responsibles FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_read_client_responsibles" ON public.client_responsibles FOR SELECT TO public USING (true);
CREATE POLICY "public_update_client_responsibles" ON public.client_responsibles FOR UPDATE TO public USING (true);

-- clients
CREATE POLICY "Enable read for authenticated users" ON public.clients FOR SELECT TO public USING (auth.role() = 'authenticated');

-- clients_tracking
CREATE POLICY "Anyone can view clients_tracking" ON public.clients_tracking FOR SELECT TO public USING (true);

-- crm_leads
CREATE POLICY "crm_leads_delete_anon" ON public.crm_leads FOR DELETE TO anon USING (true);
CREATE POLICY "crm_leads_delete_authenticated" ON public.crm_leads FOR DELETE TO authenticated USING (true);
CREATE POLICY "crm_leads_insert_anon" ON public.crm_leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "crm_leads_insert_authenticated" ON public.crm_leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "crm_leads_select_anon" ON public.crm_leads FOR SELECT TO anon USING (true);
CREATE POLICY "crm_leads_select_authenticated" ON public.crm_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_leads_update_anon" ON public.crm_leads FOR UPDATE TO anon USING (true);
CREATE POLICY "crm_leads_update_authenticated" ON public.crm_leads FOR UPDATE TO authenticated USING (true);

-- leads_tracking
CREATE POLICY "Users can create leads for their client" ON public.leads_tracking FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Users can delete leads from their client" ON public.leads_tracking FOR DELETE TO public USING (true);
CREATE POLICY "Users can update leads from their client" ON public.leads_tracking FOR UPDATE TO public USING (true);
CREATE POLICY "Users can view leads from their client" ON public.leads_tracking FOR SELECT TO public USING (true);

-- monthly_planning_items
CREATE POLICY "Enable all access for authenticated users" ON public.monthly_planning_items FOR ALL TO public USING (true);

-- monthly_plannings
CREATE POLICY "Enable all access for authenticated users" ON public.monthly_plannings FOR ALL TO public USING (true);

-- notes
CREATE POLICY "public can read notes" ON public.notes FOR SELECT TO anon USING (true);

-- production_files
CREATE POLICY "Allow delete access to production files" ON public.production_files FOR DELETE TO public USING (true);
CREATE POLICY "Allow insert access to production files" ON public.production_files FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow read access to production files" ON public.production_files FOR SELECT TO public USING (true);

-- productions
CREATE POLICY "Enable read for authenticated users" ON public.productions FOR SELECT TO public USING (auth.role() = 'authenticated');

-- reports
CREATE POLICY "Enable read for authenticated users" ON public.reports FOR SELECT TO public USING (auth.role() = 'authenticated');
CREATE POLICY "public_delete_reports" ON public.reports FOR DELETE TO public USING (true);
CREATE POLICY "public_insert_reports" ON public.reports FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public_read_reports" ON public.reports FOR SELECT TO public USING (true);
CREATE POLICY "public_update_reports" ON public.reports FOR UPDATE TO public USING (true);

-- users
CREATE POLICY "Enable read for authenticated users" ON public.users FOR SELECT TO public USING (auth.role() = 'authenticated');

-- users_trackeamento
CREATE POLICY "Allow all authenticated users to delete users" ON public.users_trackeamento FOR DELETE TO public USING (true);
CREATE POLICY "Allow all authenticated users to insert users" ON public.users_trackeamento FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all authenticated users to update users" ON public.users_trackeamento FOR UPDATE TO public USING (true);
CREATE POLICY "Allow all authenticated users to view users" ON public.users_trackeamento FOR SELECT TO public USING (true);
CREATE POLICY "Public access" ON public.users_trackeamento FOR SELECT TO public USING (true);
CREATE POLICY "Public delete" ON public.users_trackeamento FOR DELETE TO public USING (true);
CREATE POLICY "Public insert" ON public.users_trackeamento FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update" ON public.users_trackeamento FOR UPDATE TO public USING (true);

-- video_scripts
CREATE POLICY "Enable all access for authenticated users" ON public.video_scripts FOR ALL TO public USING (true);

-- ============================================================
-- 8. DADOS INICIAIS (modules)
-- ============================================================
INSERT INTO public.modules (name, display_name, description, icon, sort_order) VALUES
  ('dashboard',         'Dashboard',          'Painel principal com métricas',           'LayoutDashboard', 1),
  ('clients',           'Clientes',           'Gestão de clientes',                      'Users',           2),
  ('demands',           'Demandas',           'Gestão de demandas e tarefas',            'ClipboardList',   3),
  ('productions',       'Produções',          'Controle de produções de conteúdo',       'Film',            4),
  ('payments',          'Financeiro',         'Controle de pagamentos',                  'DollarSign',      5),
  ('reports',           'Relatórios',         'Relatórios de desempenho',                'BarChart',        6),
  ('campaigns',         'Campanhas',          'Gestão de campanhas de tráfego',          'Target',          7),
  ('arte_briefs',       'Briefs de Arte',     'Briefings para criação de arte',          'Palette',         8),
  ('video_scripts',     'Roteiros',           'Roteiros de vídeo',                       'Video',           9),
  ('monthly_plannings', 'Planejamento',       'Planejamento mensal de conteúdo',         'Calendar',        10),
  ('crm',               'CRM',                'Gestão de relacionamento com clientes',   'Handshake',       11),
  ('leads',             'Leads',              'Rastreamento de leads',                   'TrendingUp',      12),
  ('alerts',            'Alertas',            'Central de alertas e notificações',       'Bell',            13),
  ('users',             'Usuários',           'Gestão de usuários do sistema',           'UserCog',         14)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
