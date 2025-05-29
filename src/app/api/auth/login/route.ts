import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/userDb';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('Login attempt started');
    
    const { email, password } = await request.json();
    console.log('Request body parsed:', { email, password: '***' });

    if (!email || !password) {
      console.log('Missing email or password');
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('Attempting to find user in database:', email);
    
    // Buscar usuário no banco usando a função do userDb
    const user = await findUserByEmail(email);

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    console.log('Verifying password');
    
    // Verificar senha
    const isPasswordValid = await verifyPassword(password, user.password);

    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Invalid password');
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    console.log('Generating token');

    // Gerar token JWT
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    console.log('Token generated successfully');

    return NextResponse.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Detailed login error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 