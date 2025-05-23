import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Função auxiliar para verificar autenticação
async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { token },
  });

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const chips = await prisma.chip.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(chips);
  } catch (error) {
    console.error('Failed to fetch chips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chips' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const chip = await prisma.chip.create({
      data: {
        number: data.number,
        status: data.status,
        operator: data.operator,
        category: data.category,
        cid: data.cid,
      },
    });
    return NextResponse.json(chip);
  } catch (error) {
    console.error('Failed to create chip:', error);
    return NextResponse.json(
      { error: 'Failed to create chip' },
      { status: 500 }
    );
  }
} 