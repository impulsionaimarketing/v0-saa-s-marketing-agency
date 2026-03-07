-- Update demands status constraint to use "Feito" instead of "Publicado"
-- Drop the old constraint
ALTER TABLE demands DROP CONSTRAINT IF EXISTS demands_status_check;

-- Add new constraint with correct values
ALTER TABLE demands ADD CONSTRAINT demands_status_check 
CHECK (status IN ('A Fazer', 'Em Produção', 'Feito', 'Atrasado'));

-- Log the change
SELECT 'Migration complete: Updated demands status constraint' as message;
