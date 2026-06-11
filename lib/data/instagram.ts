"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"
import type { InstagramMedia } from "@/lib/types/stories"

// =====================================================================
// Serviço de Instagram
// Preparado para integração futura com a Instagram Graph API.
//
// Hoje, retorna os posts já importados/cadastrados para a empresa
// (ou um conjunto vazio). Quando a Graph API for conectada, basta
// implementar `fetchInstagramMediaFromGraphApi` lendo o token de
// acesso salvo na empresa (clients) e chamar o endpoint /media.
// =====================================================================

interface FetchInstagramPostsResult {
  connected: boolean
  media: InstagramMedia[]
}

/**
 * Lê o token/conta do Instagram associada à empresa.
 * Estrutura preparada para o futuro — hoje retorna null.
 */
async function getInstagramAccount(companyId: string): Promise<{
  access_token: string
  instagram_business_account_id: string
} | null> {
  try {
    const supabase = await createSupabaseClient()
    // No futuro, esses campos podem viver em `clients` ou numa tabela
    // dedicada de conexões sociais. Por ora, tentamos ler de clients.
    const { data } = await supabase
      .from("clients")
      .select("id")
      .eq("id", companyId)
      .maybeSingle()

    if (!data) return null
    // Sem credenciais configuradas ainda.
    return null
  } catch (error) {
    console.error("[v0] Error reading instagram account:", error)
    return null
  }
}

/**
 * Busca mídias publicadas no Instagram conectado da empresa.
 * Retorna `connected: false` enquanto a Graph API não estiver configurada,
 * permitindo que a UI mostre o estado adequado.
 */
export async function fetchInstagramPosts(
  companyId: string,
): Promise<FetchInstagramPostsResult> {
  const account = await getInstagramAccount(companyId)

  if (!account) {
    return { connected: false, media: [] }
  }

  // TODO (integração futura):
  // const res = await fetch(
  //   `https://graph.facebook.com/v21.0/${account.instagram_business_account_id}/media` +
  //   `?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp` +
  //   `&access_token=${account.access_token}`,
  // )
  // const json = await res.json()
  // return { connected: true, media: json.data as InstagramMedia[] }

  return { connected: true, media: [] }
}
