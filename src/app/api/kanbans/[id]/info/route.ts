import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';
import { verifyToken } from '@/lib/auth';
import { headers } from 'next/headers';
import { RowDataPacket } from 'mysql2';

// Bypass temporário - remova quando a autenticação estiver funcionando
const BYPASS_AUTH = true;

interface JWTPayload {
  userId: string;
  email: string;
  name: string | null;
}

interface KanbanRow extends RowDataPacket {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    let userId = 'admin1'; // Usuário padrão para bypass

    if (!BYPASS_AUTH) {
      // Pegar o token do header Authorization
      const headersList = await headers();
      const authHeader = headersList.get('authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }

      // Verificar o token
      const decoded = verifyToken(token) as JWTPayload;
      userId = decoded.userId;
    }

    // Buscar informações do kanban específico
    const kanbans = await executeQuery<KanbanRow[]>(
      'SELECT * FROM kanbans WHERE id = ?',
      [params.id]
    );

    if (!kanbans || kanbans.length === 0) {
      return NextResponse.json({ error: 'Kanban não encontrado' }, { status: 404 });
    }

    const kanban = kanbans[0];

    const response = {
      id: kanban.id,
      title: kanban.title,
      description: kanban.description,
      created_at: kanban.created_at,
      updated_at: kanban.updated_at,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching kanban info:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar informações do kanban' },
      { status: 500 }
    );
  }
} 