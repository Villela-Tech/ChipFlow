import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/mysql';
import { RowDataPacket } from 'mysql2';

// Bypass temporário para debug - remover depois
const BYPASS_TOKEN_VERIFICATION = true;

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('Auth Verify API: Starting token verification...');
    
    if (BYPASS_TOKEN_VERIFICATION) {
      console.log('Auth Verify API: BYPASS_TOKEN_VERIFICATION is enabled');
      // Retornar usuário admin padrão
      return NextResponse.json({
        valid: true,
        user: {
          id: 'admin1',
          email: 'admin@chipflow.com',
          name: 'Administrador',
          role: 'ADMIN',
        },
      });
    }
    
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Auth Verify API: No token provided in Authorization header');
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      );
    }

    console.log('Auth Verify API: Token found, attempting to verify...');
    console.log('Auth Verify API: Token preview:', token.substring(0, 20) + '...');

    // Verificar se o token é válido
    let decoded;
    try {
      decoded = verifyToken(token);
      console.log('Auth Verify API: Token decoded successfully for user:', decoded.userId);
    } catch (tokenError) {
      console.error('Auth Verify API: Token verification failed:', tokenError);
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }
    
    console.log('Auth Verify API: Checking if user exists in database...');
    // Verificar se o usuário ainda existe no banco
    const users = await executeQuery<UserRow[]>(
      'SELECT id, email, name, role FROM User WHERE id = ?',
      [decoded.userId]
    );

    console.log('Auth Verify API: Database query result:', users?.length || 0, 'users found');

    if (!users || users.length === 0) {
      console.log('Auth Verify API: User not found in database for ID:', decoded.userId);
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      );
    }

    const user = users[0];
    console.log('Auth Verify API: User found, returning success for:', user.email);

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Auth Verify API: Unexpected error during token verification:', error);
    return NextResponse.json(
      { error: 'Token inválido' },
      { status: 401 }
    );
  }
} 