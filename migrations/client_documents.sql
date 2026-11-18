-- Documentos do cronograma mensal (folhas estilo Google Docs, por cliente e mês)
CREATE TABLE IF NOT EXISTS public.client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  month INTEGER,
  year INTEGER,
  title TEXT NOT NULL,
  template TEXT NOT NULL DEFAULT 'blank' CHECK (template IN ('blank', 'video', 'arte')),
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_documents_client ON public.client_documents(client_id, year, month);

-- Permissões: o app acessa o banco pelos papéis anon/authenticated do Supabase
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.client_documents TO anon, authenticated, service_role;
ALTER TABLE public.client_documents DISABLE ROW LEVEL SECURITY;
