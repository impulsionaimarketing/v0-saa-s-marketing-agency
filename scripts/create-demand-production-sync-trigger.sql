-- Trigger to automatically create production when demand with Arte/Vídeo is created

-- Function that creates a production when a demand is inserted
CREATE OR REPLACE FUNCTION sync_demand_to_production()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create production if area is Arte or Vídeo
  IF NEW.area IN ('Arte', 'Vídeo') THEN
    INSERT INTO productions (
      client_id,
      type,
      responsible_id,
      status,
      post_date,
      notes
    ) VALUES (
      NEW.client_id,
      NEW.area::text,
      NEW.responsible_id,
      'Planejamento',
      NEW.deadline,
      'Demanda: ' || NEW.name
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on demands table
DROP TRIGGER IF EXISTS trigger_sync_demand_to_production ON demands;
CREATE TRIGGER trigger_sync_demand_to_production
  AFTER INSERT ON demands
  FOR EACH ROW
  EXECUTE FUNCTION sync_demand_to_production();

-- Function that creates a demand when a production is inserted
CREATE OR REPLACE FUNCTION sync_production_to_demand()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a demand for every production (Arte or Vídeo)
  INSERT INTO demands (
    name,
    description,
    client_id,
    area,
    responsible_id,
    deadline,
    status,
    priority
  ) VALUES (
    COALESCE(NEW.notes, 'Novo ' || NEW.type),
    NULL,
    NEW.client_id,
    NEW.type::text,
    NEW.responsible_id,
    NEW.post_date,
    'A Fazer',
    'medium'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on productions table
DROP TRIGGER IF EXISTS trigger_sync_production_to_demand ON productions;
CREATE TRIGGER trigger_sync_production_to_demand
  AFTER INSERT ON productions
  FOR EACH ROW
  EXECUTE FUNCTION sync_production_to_demand();
