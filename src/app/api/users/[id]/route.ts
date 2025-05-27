import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { UserUpdateInput, Role, Status } from '@prisma/client'; // Removing these imports for now
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';

// interface RouteContext { // Removing this interface
//   params: {
//     id?: string;
//   };
// }

// PUT /api/users/[id] - Atualizar usuário
export async function PUT(
  request: NextRequest,
  context: any // Reverted to any
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
    const userId = context.params?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing ID in request parameters' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, status } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {}; // Reverted to any for now

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    // Simplified assignment; BEWARE: assumes role/status from body are valid enum strings
    if (role !== undefined) updateData.role = role; 
    if (status !== undefined) updateData.status = status;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Deletar usuário
export async function DELETE(
  request: NextRequest,
  context: any // Reverted to any
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

    const userId = context.params?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing ID in request parameters' },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Deletar usuário
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 