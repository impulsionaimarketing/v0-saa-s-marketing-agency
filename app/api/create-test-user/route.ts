import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está registrado' },
        { status: 409 }
      )
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
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      message: 'Usuário criado com sucesso! Você pode fazer login agora.'
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}
