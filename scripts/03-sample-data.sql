-- PASSO 3: Inserir dados de exemplo
-- Execute este script após criar tabelas e RLS

-- Colaboradores
INSERT INTO public.users (name, email, role, area, status) VALUES
  ('João Silva', 'joao@agencia.com', 'Admin', NULL, 'Ativo'),
  ('Maria Santos', 'maria@agencia.com', 'Gestor', 'Comunicação', 'Ativo'),
  ('Pedro Oliveira', 'pedro@agencia.com', 'Colaborador', 'Arte', 'Ativo'),
  ('Ana Costa', 'ana@agencia.com', 'Colaborador', 'Vídeo', 'Ativo'),
  ('Carlos Lima', 'carlos@agencia.com', 'Colaborador', 'Tráfego', 'Ativo');

-- Clientes
INSERT INTO public.clients (name, type, campaign_type, plan, monthly_value, contract_status, month_status) VALUES
  ('Tech Solutions', 'Serviço', 'Mensagem', 'Premium', 5000.00, 'Ativo', 'green'),
  ('Loja Fashion', 'Local', 'Venda', 'Básico', 2500.00, 'Ativo', 'yellow'),
  ('Curso Online Pro', 'Infoproduto', 'Venda', 'Avançado', 8000.00, 'Ativo', 'green'),
  ('Restaurante Sabor', 'Local', 'Alcance', 'Básico', 1500.00, 'Pausado', 'red'),
  ('Consultoria ABC', 'Serviço', 'Mensagem', 'Premium', 6000.00, 'Ativo', 'green');

-- Demandas de exemplo
INSERT INTO public.demands (name, description, client_id, area, status, priority, deadline)
SELECT 
  'Criar posts para Instagram',
  'Desenvolver 10 posts para o feed do Instagram do cliente',
  c.id,
  'Arte',
  'A Fazer',
  'high',
  CURRENT_DATE + INTERVAL '7 days'
FROM public.clients c WHERE c.name = 'Tech Solutions';

INSERT INTO public.demands (name, description, client_id, area, status, priority, deadline)
SELECT 
  'Vídeo institucional',
  'Produzir vídeo de apresentação da empresa',
  c.id,
  'Vídeo',
  'Em Produção',
  'medium',
  CURRENT_DATE + INTERVAL '14 days'
FROM public.clients c WHERE c.name = 'Loja Fashion';

INSERT INTO public.demands (name, description, client_id, area, status, priority, deadline)
SELECT 
  'Campanha de lançamento',
  'Configurar campanhas de tráfego para o novo curso',
  c.id,
  'Tráfego',
  'Em Revisão',
  'high',
  CURRENT_DATE + INTERVAL '3 days'
FROM public.clients c WHERE c.name = 'Curso Online Pro';

-- Alertas de exemplo
INSERT INTO public.alerts (type, title, description, severity, client_id)
SELECT 
  'late_task',
  'Tarefa atrasada',
  'A demanda "Criar posts" está atrasada há 2 dias',
  'high',
  c.id
FROM public.clients c WHERE c.name = 'Tech Solutions';

INSERT INTO public.alerts (type, title, description, severity, client_id)
SELECT 
  'kpi_issue',
  'CPA acima do esperado',
  'O CPA da campanha está 30% acima da meta',
  'medium',
  c.id
FROM public.clients c WHERE c.name = 'Loja Fashion';

INSERT INTO public.alerts (type, title, description, severity, client_id)
SELECT 
  'pending_report',
  'Relatório pendente',
  'O relatório mensal ainda não foi enviado',
  'low',
  c.id
FROM public.clients c WHERE c.name = 'Consultoria ABC';
