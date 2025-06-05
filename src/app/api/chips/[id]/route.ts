import { NextResponse, NextRequest } from 'next/server';
import { executeQuery } from '@/lib/mysql';
import { verifyToken } from '@/lib/auth';

// interface RouteParams { params: { id: string } } // Previous attempt removed

// interface RouteContext {  // Removing the custom RouteContext
//   params: {
//     id?: string;
//   };
// }

interface ChipRow {
  id: string;
  number: string;
  status: string;
  operator: string;
  category: string;
  cid: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const chips = await executeQuery<ChipRow[]>(
      'SELECT * FROM Chip WHERE id = ?',
      [context.params.id]
    );

    if (!chips || chips.length === 0) {
      return NextResponse.json(
        { error: 'Chip não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(chips[0]);
  } catch (error) {
    console.error('Error fetching chip:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar chip' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { number, status, operator, category, cid } = body;

    // Validar dados
    if (!number || !status || !operator || !category) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Atualizar chip no banco de dados
    const query = `
      UPDATE Chip 
      SET number = ?, 
          status = ?, 
          operator = ?, 
          category = ?, 
          cid = ?,
          updatedAt = NOW()
      WHERE id = ?
    `;

    await executeQuery(query, [number, status, operator, category, cid, params.id]);

    return NextResponse.json({ message: 'Chip atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar chip:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar chip' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const query = 'DELETE FROM Chip WHERE id = ?';
    await executeQuery(query, [params.id]);

    return NextResponse.json({ message: 'Chip excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir chip:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir chip' },
      { status: 500 }
    );
  }
} 