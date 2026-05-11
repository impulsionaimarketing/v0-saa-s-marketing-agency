const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://chatwoot-supabase.6gpkjl.easypanel.host/';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function verifyTestUser() {
  try {
    console.log('[v0] Verificando usuário de teste no Supabase autohospedado...\n');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, password_hash')
      .eq('email', 'teste@example.com')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[v0] ❌ Usuário NÃO encontrado no banco');
        console.log('[v0] Email: teste@example.com não existe');
        return;
      }
      console.error('[v0] Erro ao buscar:', error.message);
      return;
    }
    
    if (users) {
      console.log('[v0] ✅ Usuário ENCONTRADO!');
      console.log('[v0] ID:', users.id);
      console.log('[v0] Email:', users.email);
      console.log('[v0] Nome:', users.name);
      console.log('[v0] Password Hash:', users.password_hash ? '✅ Configurado' : '❌ Não configurado');
    } else {
      console.log('[v0] ❌ Nenhum usuário encontrado');
    }
  } catch (error) {
    console.error('[v0] Erro:', error.message);
  }
}

verifyTestUser();
