import { type NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas que não requerem autenticação
  const publicRoutes = ['/auth/login', '/auth/signup']

  // Rotas que começam com esses prefixos também são públicas
  const publicPrefixes = ['/aprovacao']

  // Se está em rota pública, deixa passar
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Se a rota começa com um prefixo público, deixa passar
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // Para todas as outras rotas, verifica se usuário está logado
  const user = request.cookies.get('user')?.value

  // Se não está logado e tenta acessar rota protegida, redireciona para login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
