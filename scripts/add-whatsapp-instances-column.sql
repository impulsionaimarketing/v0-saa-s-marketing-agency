-- Add whatsapp_instances column to clients table
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS whatsapp_instances jsonb DEFAULT '[]'::jsonb;
