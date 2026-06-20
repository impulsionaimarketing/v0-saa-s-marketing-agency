const { createClient } = require('@supabase/supabase-js');
const bcryptjs = require('bcryptjs');

async function createTestUser() {
  // Credenciais do Supabase (customize conforme necessário)
  const supabaseUrl = 'https://chatwoot-supabase.6gpkjl.easypanel.host/';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

  const supabase = createClient(supabaseUrl, supabaseKey);

  const email = 'teste@example.com';
  const password = 'senha123';
  const name = 'Usuário Teste';

  try {
    console.log('🔄 Criando usuário de teste...');
    
    // Hash da senha
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Criar usuário
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        name,
        password_hash: hashedPassword,
        role: 'Admin',
        status: 'Ativo',
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('duplicate') || error.code === '23505') {
        console.log('✅ Usuário já existe no banco de dados');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Senha: ${password}`);
      } else {
        console.error('❌ Erro ao criar usuário:', error);
        process.exit(1);
      }
    } else {
      console.log('✅ Usuário criado com sucesso!');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Senha: ${password}`);
      console.log(`👤 Nome: ${name}`);
      console.log(`🎭 Role: Admin`);
    }
  } catch (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
}

createTestUser();
