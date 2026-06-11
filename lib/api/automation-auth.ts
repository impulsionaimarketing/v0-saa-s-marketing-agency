import { NextResponse, type NextRequest } from "next/server"

/**
 * Autenticação simples por API key para endpoints consumidos pelo n8n.
 *
 * O n8n deve enviar o header `x-api-key` (ou `Authorization: Bearer <key>`)
 * com o valor de STORY_AUTOMATION_API_KEY.
 *
 * Se a variável não estiver configurada, o acesso é negado por segurança.
 */
export function authorizeAutomationRequest(request: NextRequest): NextResponse | null {
  const expected = process.env.STORY_AUTOMATION_API_KEY

  if (!expected) {
    return NextResponse.json(
      { error: "STORY_AUTOMATION_API_KEY não configurada no servidor." },
      { status: 500 },
    )
  }

  const headerKey = request.headers.get("x-api-key")
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const provided = headerKey || bearer

  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  return null
}
