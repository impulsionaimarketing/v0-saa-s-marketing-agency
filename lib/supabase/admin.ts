import { createClient } from "@supabase/supabase-js"

/**
 * Cliente Supabase com Service Role.
 *
 * Uso EXCLUSIVO no servidor (route handlers chamados por sistemas externos
 * como o n8n), onde não existe sessão de usuário e o RLS precisa ser
 * ignorado de forma controlada. Nunca importe este módulo em código de
 * cliente.
 *
 * Requer a variável de ambiente SUPABASE_SERVICE_ROLE_KEY.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
    )
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
