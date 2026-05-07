eciso-- Corrigir as constraints da tabela clients para aceitar valores do Notion

-- Remover a constraint antiga de contract_status
ALTER TABLE public.clients 
DROP CONSTRAINT IF EXISTS clients_contract_status_check;

-- Adicionar nova constraint com valores expandidos
ALTER TABLE public.clients 
ADD CONSTRAINT clients_contract_status_check 
CHECK (contract_status IN ('Ativo', 'Pausado', 'Perdido', 'Contrato Fechado', 'Em Negociação', 'Cancelado'));

-- Remover a constraint antiga de campaign_type se existir
ALTER TABLE public.clients 
DROP CONSTRAINT IF EXISTS clients_campaign_type_check;

-- Adicionar nova constraint com valores expandidos
ALTER TABLE public.clients 
ADD CONSTRAINT clients_campaign_type_check 
CHECK (campaign_type IN ('Mensagem', 'Mensagens', 'Venda', 'Alcance', 'Híbrido'));
