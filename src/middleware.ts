import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { authMiddleware } from './middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Add paths that don't require authentication
const publicPaths = ['/login', '/api/auth/login', '/api/auth/register'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow access to public paths
  if (publicPaths.includes(path)) {
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