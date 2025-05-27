import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// interface RouteParams { params: { id: string } } // Previous attempt removed

interface RouteContext {
  params: {
    id?: string;
  };
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext // Using RouteContext interface
) {
  try {
    // Assuming the context object will have a params property with an id
    const id = context.params?.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Missing ID in request parameters' },
        { status: 400 }
      );
    }

    const chip = await prisma.chip.delete({
      where: {
        id: id,
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