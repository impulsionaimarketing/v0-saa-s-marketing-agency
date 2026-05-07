-- Update payments table to support standalone payments
-- Make client_id nullable and add payment_method and client_name columns
ALTER TABLE public.payments 
  ALTER COLUMN client_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);

-- Add payment_method column if it doesn't exist
ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);

-- Update the foreign key constraint to allow NULL
ALTER TABLE public.payments 
  DROP CONSTRAINT IF EXISTS payments_client_id_fkey;

ALTER TABLE public.payments 
  ADD CONSTRAINT payments_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES public.clients(id) 
  ON DELETE SET NULL;
