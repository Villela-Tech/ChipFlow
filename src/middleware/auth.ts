import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';
import type { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  name: string;
  role: string;
  token: string | null;
}

export async function authMiddleware(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const [user] = await executeQuery<UserRow[]>(
      'SELECT * FROM User WHERE token = ?',
      [token]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Add user info to request headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-role', user.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
} 