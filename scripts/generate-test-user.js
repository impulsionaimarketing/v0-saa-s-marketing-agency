const bcryptjs = require('bcryptjs')

async function createTestUser() {
  console.log('[v0] Gerando hash de senha para teste...')
  
  try {
    // Gerar hash para a senha 'senha123'
    const password = 'senha123'
    const hashedPassword = await bcryptjs.hash(password, 10)
    
    console.log('[v0] Hash gerado com sucesso!')
    console.log('[v0]')
    console.log('[v0] Para criar um usuário de teste no Supabase:')
    console.log('[v0]')
    console.log('[v0] 1. Acesse: https://app.supabase.com/projects/oohfpxgryppemtqhcbbw/editor/29')
    console.log('[v0] 2. Execute este SQL:')
    console.log('[v0]')
    console.log(`INSERT INTO public.users (email, name, password_hash, role, status) VALUES (
  'teste@example.com',
  'Usuário Teste',
  '${hashedPassword}',
  'Admin',
  'Ativo'
);`)
    console.log('[v0]')
    console.log('[v0] 3. Depois faça login com:')
    console.log('[v0]    Email: teste@example.com')
    console.log('[v0]    Senha: senha123')
    console.log('[v0]')
  } catch (error) {
    console.error('[v0] Erro:', error.message)
  }
}

createTestUser()
