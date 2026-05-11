const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'https://chatwoot-supabase.6gpkjl.easypanel.host/';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createTestUser() {
  try {
    // Gerar hash da senha
    const password = 'senha123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('[v0] Inserindo usuário de teste...');
    console.log('[v0] Email: teste@example.com');
    console.log('[v0] Senha: senha123');
    console.log('[v0] Hash: ' + passwordHash);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: 'teste@example.com',
          name: 'Usuário Teste',
          password_hash: passwordHash,
          role: 'Admin',
          status: 'Ativo',
          area: 'Administração',
          modules_access: ['dashboard', 'clientes', 'colaboradores', 'demandas', 'producao', 'trafego', 'cobrancas', 'relatorios', 'alertas', 'configuracoes']
        }
      ])
      .select();

    if (error) {
      console.error('[v0] Erro ao inserir usuário:', error.message);
      process.exit(1);
    }

    console.log('[v0] ✅ Usuário criado com sucesso!');
    console.log('[v0] Dados:', JSON.stringify(data, null, 2));
    
    // Verificar se o usuário foi criado
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', 'teste@example.com');

    if (selectError) {
      console.error('[v0] Erro ao verificar usuário:', selectError.message);
    } else {
      console.log('[v0] Usuário verificado:', JSON.stringify(users, null, 2));
    }

  } catch (error) {
    console.error('[v0] Erro:', error);
    process.exit(1);
  }
}

createTestUser();
