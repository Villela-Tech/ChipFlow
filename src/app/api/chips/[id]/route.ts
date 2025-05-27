import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const chip = await prisma.chip.delete({
      where: {
        id: context.params.id,
      },
    });

    return NextResponse.json(chip);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir o chip' },
      { status: 500 }
    );
  }
} 