-- Atualizar a constraint da coluna campaign_type na tabela clients
-- Para aceitar: 'Mensagem', 'Mensagens', 'Venda', 'Alcance'

BEGIN;

-- Remove a constraint antiga
ALTER TABLE public.clients
DROP CONSTRAINT IF EXISTS clients_campaign_type_check;

-- Adiciona a constraint nova com os novos valores aceitos
ALTER TABLE public.clients
ADD CONSTRAINT clients_campaign_type_check CHECK (campaign_type IN ('Mensagem', 'Mensagens', 'Venda', 'Alcance'));

COMMIT;
