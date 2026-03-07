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

    // Create user using RPC function directly in the users table
    const { data, error: rpcError } = await supabase.rpc('create_new_user', {
      p_name: userData.name,
      p_email: email,
      p_password: password,
      p_role: userData.role,
      p_area: userData.area || 'Arte',
    })

    if (rpcError) {
      throw new Error(`Erro ao criar usuário: ${rpcError.message}`)
    }

    if (!data?.success) {
      throw new Error(data?.message || 'Erro ao criar usuário')
    }

    return { success: true, userId: data.user_id }
  } catch (error) {
    console.error('[v0] Error creating user:', error)
    throw error
  }
}
