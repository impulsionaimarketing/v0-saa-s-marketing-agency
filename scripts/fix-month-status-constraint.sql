-- Fix month_status constraint to allow NULL values
ALTER TABLE clients 
DROP CONSTRAINT IF EXISTS clients_month_status_check;

ALTER TABLE clients 
ADD CONSTRAINT clients_month_status_check 
CHECK (month_status IS NULL OR month_status IN ('green', 'yellow', 'red'));
