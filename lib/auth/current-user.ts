import { cookies } from 'next/headers'

// Usuário logado a partir do cookie httpOnly "user" (gravado no login)
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const raw = (await cookies()).get('user')?.value
    if (!raw) return null
    const user = JSON.parse(raw)
    return typeof user?.id === 'string' ? user.id : null
  } catch {
    return null
  }
}
