import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Props = {
  params: {
    id: string;
  };
};

export async function DELETE(
  request: Request,
  props: Props
) {
  try {
    const chip = await prisma.chip.delete({
      where: {
        id: props.params.id,
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