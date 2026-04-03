-- Migrate deadline column from date to timestamp
ALTER TABLE demands ALTER COLUMN deadline TYPE timestamp USING deadline::timestamp;

-- Drop all overloaded versions of insert_demand
DROP FUNCTION IF EXISTS public.insert_demand(text, text, uuid, text, uuid, date, text, text);
DROP FUNCTION IF EXISTS public.insert_demand(character varying, text, uuid, character varying, uuid, date, character varying, character varying);

-- Drop all overloaded versions of update_demand
DROP FUNCTION IF EXISTS public.update_demand(uuid, text, uuid, text, text, uuid, date, text, text);
DROP FUNCTION IF EXISTS public.update_demand(uuid, character varying, text, uuid, character varying, uuid, date, character varying, character varying);

-- Recreate insert_demand with timestamp
CREATE OR REPLACE FUNCTION public.insert_demand(
  p_name text,
  p_description text,
  p_client_id uuid,
  p_area text,
  p_responsible_id uuid,
  p_deadline timestamp,
  p_status text,
  p_priority text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO demands (name, description, client_id, area, responsible_id, deadline, status, priority)
  VALUES (p_name, p_description, p_client_id, p_area, p_responsible_id, p_deadline, p_status, p_priority)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Recreate update_demand with timestamp
CREATE OR REPLACE FUNCTION public.update_demand(
  p_id uuid,
  p_name text,
  p_client_id uuid,
  p_area text,
  p_description text,
  p_responsible_id uuid,
  p_deadline timestamp,
  p_status text,
  p_priority text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE demands
  SET
    name = p_name,
    description = p_description,
    client_id = p_client_id,
    area = p_area,
    responsible_id = p_responsible_id,
    deadline = p_deadline,
    status = p_status,
    priority = p_priority,
    updated_at = now()
  WHERE id = p_id;
END;
$$;
