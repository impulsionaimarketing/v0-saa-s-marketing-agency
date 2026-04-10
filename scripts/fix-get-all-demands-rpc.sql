-- Fix the get_all_demands RPC function to properly include responsible_name and client_name

-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_all_demands();

-- Create the corrected function
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
  status VARCHAR(50),
  priority VARCHAR(20),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    d.status,
    d.priority,
    d.created_at,
    d.updated_at
  FROM demands d
  LEFT JOIN clients c ON d.client_id = c.id
  LEFT JOIN users u ON d.responsible_id = u.id
  ORDER BY d.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_all_demands() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_demands() TO anon;
