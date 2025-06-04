import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/mysql';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

interface UserRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// GET /api/users - Listar todos os usuários
export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    try {
      const users = await executeQuery<UserRow[]>(
        'SELECT id, name, email, createdAt, updatedAt FROM User'
      );
      return NextResponse.json(users);
    } catch (dbError: any) {
      console.error('Erro específico na consulta SQL:', dbError);
      return NextResponse.json(
        { error: 'Erro ao executar consulta no banco de dados', details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}

// POST /api/users - Criar novo usuário
export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar se o usuário atual é admin
    const [currentUser] = await executeQuery<UserRow[]>(
      'SELECT role FROM User WHERE id = ?',
      [decoded.userId]
    );

    const body = await request.json();
    const { name, email, password, role = 'user' } = body;

    // Apenas admins podem criar outros admins
    if (role === 'admin' && currentUser?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar outros administradores' },
        { status: 403 }
      );
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se já existe um usuário com este email
    const existingUsers = await executeQuery<UserRow[]>(
      'SELECT id FROM User WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a UUID for the new user
    const userId = uuidv4();

    // Criar novo usuário
    await executeQuery<ResultSetHeader>(
      'INSERT INTO User (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, hashedPassword, role]
    );

    const [newUser] = await executeQuery<UserRow[]>(
      'SELECT id, name, email, role, createdAt, updatedAt FROM User WHERE id = ?',
      [userId]
    );

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, currentPassword } = body;

    // Buscar usuário atual
    const [currentUser] = await executeQuery<UserRow[]>(
      'SELECT * FROM User WHERE id = ?',
      [decoded.userId]
    );

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Se estiver alterando a senha, verificar a senha atual
    if (password) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Senha atual é necessária para alterar a senha' },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Senha atual incorreta' },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização
    const updates = [];
    const values = [];
    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (password) {
      updates.push('password = ?');
      values.push(await bcrypt.hash(password, 10));
    }
    values.push(decoded.userId);

    if (updates.length > 0) {
      await executeQuery(
        `UPDATE User SET ${updates.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
    }

    const [updatedUser] = await executeQuery<UserRow[]>(
      'SELECT id, name, email, createdAt, updatedAt FROM User WHERE id = ?',
      [decoded.userId]
    );

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    await executeQuery(
      'DELETE FROM User WHERE id = ?',
      [decoded.userId]
    );

    return NextResponse.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir usuário' },
      { status: 500 }
    );
  }
} 