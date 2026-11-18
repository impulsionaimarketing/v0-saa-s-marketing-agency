-- Aparelhos que recebem notificações push (um usuário pode ter vários)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.push_subscriptions TO anon, authenticated, service_role;
ALTER TABLE public.push_subscriptions DISABLE ROW LEVEL SECURITY;
