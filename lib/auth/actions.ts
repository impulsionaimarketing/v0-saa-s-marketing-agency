'use server'

import { createClient } from '@/lib/supabase/server'
import bcryptjs from 'bcryptjs'
import { cookies } from 'next/headers'

export async function loginUser(email: string, password: string) {
  try {
    const supabase = await createClient()

    // Buscar usuário no banco de dados
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (queryError || !users) {
      return { success: false, error: 'Email ou senha incorretos' }
    }

    // Verificar se o usuário tem password_hash
    if (!users.password_hash) {
      // Se não houver password_hash, criar uma (para compatibilidade com dados existentes)
      // Aqui você pode definir uma senha padrão ou retornar um erro
      return { success: false, error: 'Usuário não tem senha configurada' }
    }

    // Comparar senha com hash armazenado
    const passwordMatch = await bcryptjs.compare(password, users.password_hash)

    if (!passwordMatch) {
      return { success: false, error: 'Email ou senha incorretos' }
    }

    // Usuário autenticado com sucesso
    const userData = {
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      modules_access: users.modules_access,
    }

    // Armazenar no cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_user', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    })

    return { success: true, user: userData }
  } catch (error) {
    console.error('[v0] Login error:', error)
    return { success: false, error: 'Erro ao fazer login' }
  }
}

export async function registerUser(email: string, password: string, name: string) {
  try {
    if (password.length < 6) {
      return { success: false, error: 'Senha deve ter pelo menos 6 caracteres' }
    }

    const supabase = await createClient()

    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return { success: false, error: 'Este email já está registrado' }
    }

    // Criar hash da senha
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Criar novo usuário
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        name,
        password_hash: hashedPassword,
        role: 'Colaborador',
        status: 'Ativo',
      })
      .select()
      .single()

    if (insertError || !newUser) {
      return { success: false, error: 'Erro ao criar usuário' }
    }

    // Armazenar no cookie
    const userData = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      modules_access: newUser.modules_access,
    }

    const cookieStore = await cookies()
    cookieStore.set('auth_user', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return { success: true, user: userData }
  } catch (error) {
    console.error('[v0] Register error:', error)
    return { success: false, error: 'Erro ao registrar usuário' }
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('auth_user')
    return { success: true }
  } catch (error) {
    console.error('[v0] Logout error:', error)
    return { success: false, error: 'Erro ao fazer logout' }
  }
}
