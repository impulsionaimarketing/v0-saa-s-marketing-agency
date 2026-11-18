-- Serviços contratados por cliente (recorrentes ou específicos/pontuais)
-- Formato: [{"name":"Tráfego Pago","kind":"recorrente","value":1500}, {"name":"Criação de E-commerce","kind":"especifico","value":3000}]
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS services JSONB NOT NULL DEFAULT '[]'::jsonb;
