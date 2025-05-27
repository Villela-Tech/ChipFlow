import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// interface RouteParams { params: { id: string } } // Previous attempt removed

// interface RouteContext {  // Removing the custom RouteContext
//   params: {
//     id?: string;
//   };
// }

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Correctly typing the second argument as a Promise
) {
  try {
    // Assuming the context object will have a params property with an id
    const { id } = await params; // Await the promise to get the id
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