import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/api/auth/login', '/api/auth/register', '/api/auth/verify'];
  
  // Verificar se é uma rota pública
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Para rotas de API protegidas, deixar que cada endpoint verifique o token
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Para rotas da aplicação (páginas), deixar que o useAuth handle o redirecionamento
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|images).*)',
  ],
}; 