'use server'

import { createClient } from '@/lib/supabase/server'
import bcryptjs from 'bcryptjs'

export async function createUserWithAuth(
  email: string,
  password: string,
  userData: {
    name: string
    role: string
    area?: string
    status: string
  }
) {
  try {
    const supabase = await createClient()

    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw new Error('Este email já está registrado')
    }

    // Criar hash da senha
    const passwordHash = await bcryptjs.hash(password, 10)

    // Inserir novo usuário no banco de dados
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name: userData.name,
        email: email,
        password_hash: passwordHash,
        role: userData.role,
        area: userData.area || 'Arte',
        status: userData.status,
        modules_access: [
          'dashboard',
          'clientes',
          'colaboradores',
          'demandas',
          'producao',
          'trafego',
          'cobrancas',
          'relatorios',
          'alertas',
          'configuracoes',
        ],
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Erro ao criar usuário: ${insertError.message}`)
    }

    if (!newUser) {
      throw new Error('Erro ao criar usuário')
    }

    return { success: true, userId: newUser.id }
  } catch (error) {
    console.error('[v0] Error creating user:', error)
    throw error
  }
}
