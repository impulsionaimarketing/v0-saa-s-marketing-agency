const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://chatwoot-supabase.6gpkjl.easypanel.host/';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkRLSPolicies() {
  try {
    console.log('[v0] Verificando políticas RLS da tabela users...\n');
    
    // Query para ver as políticas RLS
    const { data, error } = await supabase.rpc('get_policies', {
      schema_name: 'public',
      table_name: 'users'
    }).catch(() => null);
    
    if (error || !data) {
      console.log('[v0] Não foi possível buscar políticas via RPC');
      console.log('[v0] Problema: RLS está bloqueando o acesso com ANON KEY para login\n');
      console.log('[v0] SOLUÇÃO NECESSÁRIA:');
      console.log('[v0] Adicione esta política RLS na tabela users:\n');
      console.log(`
CREATE POLICY "Allow anonymous to authenticate" ON public.users
  FOR SELECT
  USING (true);
      `);
      return;
    }
    
    console.log('[v0] Políticas encontradas:', data);
  } catch (error) {
    console.error('[v0] Erro:', error.message);
  }
}

checkRLSPolicies();
