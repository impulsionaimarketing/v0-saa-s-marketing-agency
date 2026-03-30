-- Adiciona campo de horário do prazo na tabela de demandas
ALTER TABLE public.demands
ADD COLUMN IF NOT EXISTS deadline_time TIME;

-- Remove as funções existentes para poder recriá-las com novo tipo de retorno
DROP FUNCTION IF EXISTS get_all_demands();
DROP FUNCTION IF EXISTS insert_demand(VARCHAR, TEXT, UUID, VARCHAR, UUID, DATE, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS insert_demand(VARCHAR, TEXT, UUID, VARCHAR, UUID, DATE, TIME, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS update_demand(UUID, VARCHAR, TEXT, UUID, VARCHAR, UUID, DATE, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS update_demand(UUID, VARCHAR, TEXT, UUID, VARCHAR, UUID, DATE, TIME, VARCHAR, VARCHAR);

-- Recria a função get_all_demands para incluir deadline_time
CREATE OR REPLACE FUNCTION get_all_demands()
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  description TEXT,
  client_id UUID,
  client_name VARCHAR(255),
  area VARCHAR(50),
  responsible_id UUID,
  responsible_name VARCHAR(255),
  deadline DATE,
  deadline_time TIME,
  status VARCHAR(50),
  priority VARCHAR(20),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.description,
    d.client_id,
    c.name AS client_name,
    d.area,
    d.responsible_id,
    u.name AS responsible_name,
    d.deadline,
    d.deadline_time,
    d.status,
    d.priority,
    d.created_at,
    d.updated_at
  FROM public.demands d
  LEFT JOIN public.clients c ON d.client_id = c.id
  LEFT JOIN public.users u ON d.responsible_id = u.id
  ORDER BY d.deadline ASC NULLS LAST, d.deadline_time ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recria a função insert_demand para incluir deadline_time
CREATE OR REPLACE FUNCTION insert_demand(
  p_name VARCHAR(255),
  p_description TEXT,
  p_client_id UUID,
  p_area VARCHAR(50),
  p_responsible_id UUID,
  p_deadline DATE,
  p_deadline_time TIME DEFAULT NULL,
  p_status VARCHAR(50) DEFAULT 'A Fazer',
  p_priority VARCHAR(20) DEFAULT 'medium'
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  description TEXT,
  client_id UUID,
  client_name VARCHAR(255),
  area VARCHAR(50),
  responsible_id UUID,
  responsible_name VARCHAR(255),
  deadline DATE,
  deadline_time TIME,
  status VARCHAR(50),
  priority VARCHAR(20),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.demands (name, description, client_id, area, responsible_id, deadline, deadline_time, status, priority)
  VALUES (p_name, p_description, p_client_id, p_area, p_responsible_id, p_deadline, p_deadline_time, p_status, p_priority)
  RETURNING demands.id INTO new_id;
  
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.description,
    d.client_id,
    c.name AS client_name,
    d.area,
    d.responsible_id,
    u.name AS responsible_name,
    d.deadline,
    d.deadline_time,
    d.status,
    d.priority,
    d.created_at,
    d.updated_at
  FROM public.demands d
  LEFT JOIN public.clients c ON d.client_id = c.id
  LEFT JOIN public.users u ON d.responsible_id = u.id
  WHERE d.id = new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recria a função update_demand para incluir deadline_time
CREATE OR REPLACE FUNCTION update_demand(
  p_id UUID,
  p_name VARCHAR(255),
  p_description TEXT,
  p_client_id UUID,
  p_area VARCHAR(50),
  p_responsible_id UUID,
  p_deadline DATE,
  p_deadline_time TIME DEFAULT NULL,
  p_status VARCHAR(50),
  p_priority VARCHAR(20)
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  description TEXT,
  client_id UUID,
  client_name VARCHAR(255),
  area VARCHAR(50),
  responsible_id UUID,
  responsible_name VARCHAR(255),
  deadline DATE,
  deadline_time TIME,
  status VARCHAR(50),
  priority VARCHAR(20),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  UPDATE public.demands d
  SET 
    name = COALESCE(p_name, d.name),
    description = p_description,
    client_id = COALESCE(p_client_id, d.client_id),
    area = COALESCE(p_area, d.area),
    responsible_id = p_responsible_id,
    deadline = p_deadline,
    deadline_time = p_deadline_time,
    status = COALESCE(p_status, d.status),
    priority = COALESCE(p_priority, d.priority),
    updated_at = NOW()
  WHERE d.id = p_id;
  
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.description,
    d.client_id,
    c.name AS client_name,
    d.area,
    d.responsible_id,
    u.name AS responsible_name,
    d.deadline,
    d.deadline_time,
    d.status,
    d.priority,
    d.created_at,
    d.updated_at
  FROM public.demands d
  LEFT JOIN public.clients c ON d.client_id = c.id
  LEFT JOIN public.users u ON d.responsible_id = u.id
  WHERE d.id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
