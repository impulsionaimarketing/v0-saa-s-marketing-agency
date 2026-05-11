const bcryptjs = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://chatwoot-supabase.6gpkjl.easypanel.host/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLogin() {
  try {
    console.log('[v0] Testando login...\n');
    
    const email = 'teste@example.com';
    const password = 'senha123';
    
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (queryError || !user) {
      console.log('[v0] ❌ Erro: Usuário não encontrado');
      return;
    }
    
    console.log('[v0] ✅ Usuário encontrado:', user.email);
    
    if (!user.password_hash) {
      console.log('[v0] ❌ Erro: Usuário não tem password_hash');
      return;
    }
    
    const passwordMatch = await bcryptjs.compare(password, user.password_hash);
    
    if (passwordMatch) {
      console.log('[v0] ✅ LOGIN BEM-SUCEDIDO!');
      console.log('[v0] Email: ' + user.email);
      console.log('[v0] Nome: ' + user.name);
      console.log('[v0] Role: ' + user.role);
    } else {
      console.log('[v0] ❌ Senha incorreta');
      console.log('[v0] Hash armazenado:', user.password_hash);
    }
  } catch (error) {
    console.error('[v0] Erro:', error.message);
  }
}

testLogin();
