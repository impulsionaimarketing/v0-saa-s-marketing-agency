-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_is_paid ON public.payments(is_paid);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view payments" ON public.payments
  FOR SELECT USING (true);

CREATE POLICY "Users can update payments" ON public.payments
  FOR UPDATE USING (true);

CREATE POLICY "Users can insert payments" ON public.payments
  FOR INSERT WITH CHECK (true);
