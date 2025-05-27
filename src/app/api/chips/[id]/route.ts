import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams { params: { id: string } }

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const chip = await prisma.chip.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json(chip);
  } catch (error) {
    console.error('Error in DELETE /api/chips/[id]:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir o chip' },
      { status: 500 }
    );
  }
} 