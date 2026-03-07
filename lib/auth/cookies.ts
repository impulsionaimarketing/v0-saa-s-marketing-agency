'use server'

import { cookies } from 'next/headers'

export async function setAuthCookie(userData: {
  id: string
  name: string
  email: string
  role: string
  area: string
  status: string
}) {
  const cookieStore = await cookies()
  
  // Armazenar usuário em cookie seguro (httpOnly)
  cookieStore.set('user', JSON.stringify(userData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  })

  return { success: true }
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('user')
  return { success: true }
}
