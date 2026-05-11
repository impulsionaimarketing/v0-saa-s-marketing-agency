const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://chatwoot-supabase.6gpkjl.easypanel.host/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';
const PASSWORD_HASH = '$2b$10$lyyV0LnQ4UHZLtQ63w0jl.UYGGHUXk9OY/sCOzorwDa.VDCKOxDwa';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertTestUser() {
  try {
    console.log('[v0] Tentando inserir usuário de teste...');
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: 'teste@example.com',
        name: 'Usuário Teste',
        password_hash: PASSWORD_HASH,
        role: 'Admin',
        status: 'Ativo',
        area: 'Administração',
        modules_access: ['dashboard', 'clientes', 'colaboradores', 'demandas', 'producao', 'trafego', 'cobrancas', 'relatorios', 'alertas', 'configuracoes']
      })
      .select();

    if (error) {
      console.error('[v0] Erro ao inserir usuário:', error.message);
      console.log('[v0] Se o erro for "Duplicate key", o usuário já existe!');
      return;
    }

    console.log('[v0] Usuário inserido com sucesso!');
    console.log('[v0] Email: teste@example.com');
    console.log('[v0] Senha: senha123');
    console.log('[v0] Hash: ' + PASSWORD_HASH);
  } catch (err) {
    console.error('[v0] Erro:', err.message);
  }
}

insertTestUser();
