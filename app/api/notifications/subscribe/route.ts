import { NextRequest, NextResponse } from "next/server"

// In production, you would store tokens in a database
// This is a simple in-memory store for demonstration
const tokenStore = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token FCM inválido" },
        { status: 400 }
      )
    }

    // Store the token
    // In production: save to database with user ID, timestamp, device info
    tokenStore.add(token)

    console.log(`[Notifications] Token registrado: ${token.substring(0, 20)}...`)

    return NextResponse.json({ 
      success: true,
      message: "Token registrado com sucesso" 
    })
  } catch (error) {
    console.error("[Notifications] Erro ao registrar token:", error)
    return NextResponse.json(
      { error: "Falha ao processar requisição" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token FCM inválido" },
        { status: 400 }
      )
    }

    tokenStore.delete(token)

    return NextResponse.json({ 
      success: true,
      message: "Token removido com sucesso" 
    })
  } catch (error) {
    console.error("[Notifications] Erro ao remover token:", error)
    return NextResponse.json(
      { error: "Falha ao processar requisição" },
      { status: 500 }
    )
  }
}

// Export token store for the send route
export { tokenStore }
