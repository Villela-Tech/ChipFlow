import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';
import { verifyToken } from '@/lib/auth';
import { headers } from 'next/headers';
import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

interface JWTPayload {
  userId: string;
  email: string;
  name: string | null;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Pegar o token do header Authorization
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar o token
    const decoded = verifyToken(token) as JWTPayload;

    const { title } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Título da coluna é obrigatório' }, { status: 400 });
    }

    // Verificar se o kanban existe e pertence ao usuário
    const kanbans = await executeQuery<RowDataPacket[]>(
      'SELECT * FROM kanbans WHERE id = ? AND user_id = ?',
      [params.id, decoded.userId]
    );

    if (!kanbans || kanbans.length === 0) {
      return NextResponse.json({ error: 'Kanban não encontrado' }, { status: 404 });
    }

    // Obter a próxima posição para a nova coluna (usar `order` em vez de `position`)
    const [positionResult] = await executeQuery<RowDataPacket[]>(
      'SELECT COALESCE(MAX(`order`), -1) + 1 as nextPosition FROM columns WHERE kanban_id = ?',
      [params.id]
    );

    const nextPosition = positionResult?.nextPosition || 0;

    // Gerar UUID para a nova coluna
    const columnId = uuidv4();

    // Criar a nova coluna
    const result = await executeQuery(
      'INSERT INTO columns (id, title, kanban_id, `order`) VALUES (?, ?, ?, ?)',
      [columnId, title, params.id, nextPosition]
    );

    return NextResponse.json({
      id: columnId,
      title,
      kanbanId: params.id,
      position: nextPosition,
    });
  } catch (error) {
    console.error('Error creating column:', error);
    return NextResponse.json(
      { error: 'Erro ao criar coluna' },
      { status: 500 }
    );
  }
} 