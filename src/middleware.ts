import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { authMiddleware } from './middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Add paths that don't require authentication
const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/register',
  '/',
  '/favicon.ico',
  '/_next'
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if the path is public
  if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
    // Se estiver logado e tentar acessar o login, redireciona para o dashboard
    if (path === '/login') {
      const token = request.cookies.get('token')?.value;
      if (token) {
        try {
          jwt.verify(token, JWT_SECRET);
          return NextResponse.redirect(new URL('/dashboard', request.url));
        } catch (error) {
          // Token inválido, continua para a página de login
          return NextResponse.next();
        }
      }
    }
    return NextResponse.next();
  }

  // Check if the path starts with /api
  if (path.startsWith('/api')) {
    return authMiddleware(request);
  }

  // Check for auth token
  const token = request.cookies.get('token')?.value;

  // If no token is present, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify token
    jwt.verify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    // If token is invalid, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Configure paths that should be protected
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/login (authentication endpoint)
     * 2. /login (login page)
     * 3. /_next (Next.js internals)
     * 4. /static (static files)
     * 5. /favicon.ico, /images (public assets)
     */
    '/((?!api/auth/login|login|_next|static|favicon.ico|images).*)',
  ],
}; 