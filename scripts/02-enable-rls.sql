-- PASSO 2: Habilitar RLS e criar políticas
-- Execute este script após criar as tabelas

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_responsibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para USERS
CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (true);
CREATE POLICY "users_delete" ON public.users FOR DELETE USING (true);

-- Políticas para CLIENTS
CREATE POLICY "clients_select" ON public.clients FOR SELECT USING (true);
CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "clients_update" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "clients_delete" ON public.clients FOR DELETE USING (true);

-- Políticas para CLIENT_RESPONSIBLES
CREATE POLICY "client_responsibles_select" ON public.client_responsibles FOR SELECT USING (true);
CREATE POLICY "client_responsibles_insert" ON public.client_responsibles FOR INSERT WITH CHECK (true);
CREATE POLICY "client_responsibles_update" ON public.client_responsibles FOR UPDATE USING (true);
CREATE POLICY "client_responsibles_delete" ON public.client_responsibles FOR DELETE USING (true);

-- Políticas para DEMANDS
CREATE POLICY "demands_select" ON public.demands FOR SELECT USING (true);
CREATE POLICY "demands_insert" ON public.demands FOR INSERT WITH CHECK (true);
CREATE POLICY "demands_update" ON public.demands FOR UPDATE USING (true);
CREATE POLICY "demands_delete" ON public.demands FOR DELETE USING (true);

-- Políticas para PRODUCTIONS
CREATE POLICY "productions_select" ON public.productions FOR SELECT USING (true);
CREATE POLICY "productions_insert" ON public.productions FOR INSERT WITH CHECK (true);
CREATE POLICY "productions_update" ON public.productions FOR UPDATE USING (true);
CREATE POLICY "productions_delete" ON public.productions FOR DELETE USING (true);

-- Políticas para CAMPAIGNS
CREATE POLICY "campaigns_select" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "campaigns_insert" ON public.campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "campaigns_update" ON public.campaigns FOR UPDATE USING (true);
CREATE POLICY "campaigns_delete" ON public.campaigns FOR DELETE USING (true);

-- Políticas para REPORTS
CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (true);
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "reports_update" ON public.reports FOR UPDATE USING (true);
CREATE POLICY "reports_delete" ON public.reports FOR DELETE USING (true);

-- Políticas para ALERTS
CREATE POLICY "alerts_select" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "alerts_insert" ON public.alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "alerts_update" ON public.alerts FOR UPDATE USING (true);
CREATE POLICY "alerts_delete" ON public.alerts FOR DELETE USING (true);

-- Políticas para ACTIVITY_LOGS
CREATE POLICY "activity_logs_select" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "activity_logs_insert" ON public.activity_logs FOR INSERT WITH CHECK (true);
