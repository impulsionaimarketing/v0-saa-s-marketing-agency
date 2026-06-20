const { createClient } = require('@supabase/supabase-js')
const bcryptjs = require('bcryptjs')

const supabaseUrl = 'https://oohfpxgryppemtqhcbbw.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vaGZweGdyeXBwZW10cWhjYmJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjkyNzIzMiwiZXhwIjoyMDg4NTAzMjMyfQ.Nq_tWVSSgmbhA9kliga8xW2pPe2xYG4PFeJh8upx5q0'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function verifyUsers() {
  console.log('[v0] Verificando usuários no banco...')
  
  try {
    // Buscar todos os usuários
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, password_hash')
      .limit(10)
    
    if (error) {
      console.error('[v0] Erro ao buscar usuários:', error)
      return
    }
    
    console.log(`[v0] Total de usuários encontrados: ${users?.length || 0}`)
    
    users?.forEach((user, index) => {
      console.log(`[v0] Usuário ${index + 1}:`)
      console.log(`  - ID: ${user.id}`)
      console.log(`  - Email: ${user.email}`)
      console.log(`  - Nome: ${user.name}`)
      console.log(`  - Tem senha: ${user.password_hash ? 'SIM' : 'NÃO'}`)
    })
    
    // Contar quantos usuários têm password_hash
    const usersWithPassword = users?.filter(u => u.password_hash).length || 0
    console.log(`[v0] Usuários com senha: ${usersWithPassword}/${users?.length}`)
    
    // Se não houver usuários com senha, criar um de teste
    if (usersWithPassword === 0 && users && users.length > 0) {
      console.log('\n[v0] Criando senha para primeiro usuário...')
      const hashedPassword = await bcryptjs.hash('senha123', 10)
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('id', users[0].id)
      
      if (updateError) {
        console.error('[v0] Erro ao atualizar senha:', updateError)
      } else {
        console.log(`[v0] Senha criada com sucesso para: ${users[0].email}`)
        console.log(`[v0] Credenciais de teste:`)
        console.log(`    Email: ${users[0].email}`)
        console.log(`    Senha: senha123`)
      }
    }
  } catch (error) {
    console.error('[v0] Erro geral:', error)
  }
}

verifyUsers()
