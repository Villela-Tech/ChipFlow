import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/mysql';
import type { RowDataPacket } from 'mysql2';

type Role = 'USER' | 'ADMIN';

interface UpdateData {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
}

interface UserRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
}

// PUT /api/users/[id] - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') { 
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = params;
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing ID in request parameters' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    // Check if user exists
    const [existingUser] = await executeQuery<UserRow[]>(
      'SELECT * FROM User WHERE id = ?',
      [userId]
    );

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build update query
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (password) {
      updates.push('password = ?');
      values.push(await bcrypt.hash(password, 10));
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }

    // Add userId as last value
    values.push(userId);

    if (updates.length > 0) {
      await executeQuery(
        `UPDATE User SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values
      );
    }

    const [updatedUser] = await executeQuery<UserRow[]>(
      'SELECT id, name, email, role FROM User WHERE id = ?',
      [userId]
    );

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = params;
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing ID in request parameters' },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const [existingUser] = await executeQuery<UserRow[]>(
      'SELECT id FROM User WHERE id = ?',
      [userId]
    );

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Deletar usuário
    await executeQuery(
      'DELETE FROM User WHERE id = ?',
      [userId]
    );

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 