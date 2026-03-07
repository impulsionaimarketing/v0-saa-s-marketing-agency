'use server'

import { createClient } from '@/lib/supabase/server'

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

    // Hash password using the same function as login
    const { data: hashResult, error: hashError } = await supabase.rpc(
      'hash_password',
      { password }
    )

    if (hashError) {
      throw new Error(`Erro ao processar senha: ${hashError.message}`)
    }

    // Create user in users table
    const { data: newUser, error: dbError } = await supabase
      .from('users')
      .insert({
        email,
        name: userData.name,
        role: userData.role,
        area: userData.area || 'Arte',
        status: userData.status,
        password_hash: hashResult,
      })
      .select()
      .single()

    if (dbError) {
      throw new Error(`Erro ao criar usuário: ${dbError.message}`)
    }

    return { success: true, userId: newUser.id }
  } catch (error) {
    console.error('[v0] Error creating user:', error)
    throw error
  }
}
