import { cookies } from 'next/headers'

export interface SessionUser {
  id: string
  name: string
  role: string
}

// Usuário logado a partir do cookie httpOnly "user" (gravado no login)
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const raw = (await cookies()).get('user')?.value
    if (!raw) return null
    const user = JSON.parse(raw)
    if (typeof user?.id !== 'string') return null
    return { id: user.id, name: String(user.name || ''), role: String(user.role || 'Colaborador') }
  } catch {
    return null
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  return (await getCurrentUser())?.id ?? null
}
