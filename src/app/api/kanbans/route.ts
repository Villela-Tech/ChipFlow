import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';
import { verifyToken } from '@/lib/auth';
import { headers } from 'next/headers';
import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

// Desativando bypass para usar banco real
const BYPASS_AUTH = true; // Manter apenas auth bypass por enquanto

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

interface KanbanCountRow extends RowDataPacket {
  kanban_id: string;
  columns_count: number;
  tasks_count: number;
}

export async function GET() {
  try {
    let userId = 'admin1'; // Usuário padrão para bypass

    if (!BYPASS_AUTH) {
      console.log('Kanbans API: Auth bypass disabled, checking token...');
      // Pegar o token do header Authorization
      const headersList = await headers();
      const authHeader = headersList.get('authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        console.log('Kanbans API: No token provided');
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }

      // Verificar o token
      const decoded = verifyToken(token) as JWTPayload;
      userId = decoded.userId;
      console.log('Kanbans API: Token verified for user:', userId);
    } else {
      console.log('Kanbans API: Auth bypassed, using default user:', userId);
    }

    console.log('Kanbans API: Fetching kanbans from database...');

    // Buscar kanbans do usuário (usar nome correto da tabela)
    const kanbans = await executeQuery<KanbanRow[]>(
      'SELECT * FROM kanbans ORDER BY created_at DESC'
    );

    console.log('Kanbans API: Found', kanbans.length, 'kanbans in database');

    // Para cada kanban, contar colunas e tarefas
    const kanbansWithCounts = await Promise.all(
      kanbans.map(async (kanban) => {
        let columnCount = 0;
        let taskCount = 0;

        try {
          const [columnResult] = await executeQuery<RowDataPacket[]>(
            'SELECT COUNT(*) as count FROM columns WHERE kanban_id = ?',
            [kanban.id]
          );
          columnCount = columnResult?.count || 0;
        } catch (error) {
          console.log('Warning: Could not count columns for kanban', kanban.id);
        }

        try {
          const [taskResult] = await executeQuery<RowDataPacket[]>(
            'SELECT COUNT(*) as count FROM tasks WHERE column_id IN (SELECT id FROM columns WHERE kanban_id = ?)',
            [kanban.id]
          );
          taskCount = taskResult?.count || 0;
        } catch (error) {
          console.log('Warning: Could not count tasks for kanban', kanban.id);
        }

        return {
          id: kanban.id,
          title: kanban.title,
          description: kanban.description,
          columnsCount: columnCount,
          tasksCount: taskCount,
        };
      })
    );

    console.log('Kanbans API: Returning', kanbansWithCounts.length, 'kanbans with counts');
    return NextResponse.json(kanbansWithCounts);
    
  } catch (error) {
    console.error('Kanbans API: Error fetching kanbans:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar kanbans: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let userId = 'admin1'; // Usuário padrão para bypass

    if (!BYPASS_AUTH) {
      console.log('Kanbans API POST: Auth bypass disabled, checking token...');
      // Pegar o token do header Authorization
      const headersList = await headers();
      const authHeader = headersList.get('authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        console.log('Kanbans API POST: No token provided');
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }

      // Verificar o token
      const decoded = verifyToken(token) as JWTPayload;
      userId = decoded.userId;
      console.log('Kanbans API POST: Token verified for user:', userId);
    } else {
      console.log('Kanbans API POST: Auth bypassed, using default user:', userId);
    }

    const { title, description, columns } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    // Gerar UUID para o kanban
    const kanbanId = uuidv4();
    console.log('Kanbans API POST: Creating kanban with ID:', kanbanId);

    // Criar kanban
    const kanbanResult = await executeQuery(
      'INSERT INTO kanbans (id, title, description, user_id) VALUES (?, ?, ?, ?)',
      [kanbanId, title, description || null, userId]
    );

    // Verificar se o kanban foi criado corretamente
    const verifyKanban = await executeQuery<RowDataPacket[]>(
      'SELECT * FROM kanbans WHERE id = ?',
      [kanbanId]
    );

    if (!verifyKanban || verifyKanban.length === 0) {
      throw new Error('Falha ao criar kanban');
    }

    console.log('Kanbans API POST: Kanban created successfully');

    // Criar colunas (usar colunas personalizadas se fornecidas, senão usar padrão)
    const defaultColumns = ['A fazer', 'Em progresso', 'Concluído'];
    const columnsToCreate = columns && columns.length > 0 ? columns : defaultColumns;
    
    // Criar colunas uma por uma para evitar problemas
    const createdColumns = [];
    for (let i = 0; i < columnsToCreate.length; i++) {
      const columnTitle = columnsToCreate[i];
      if (columnTitle && columnTitle.trim()) {
        const columnId = uuidv4();
        await executeQuery(
          'INSERT INTO columns (id, title, kanban_id, `order`) VALUES (?, ?, ?, ?)',
          [columnId, columnTitle.trim(), kanbanId, i]
        );
        createdColumns.push({ id: columnId, title: columnTitle.trim() });
      }
    }

    console.log('Kanbans API POST: Created', createdColumns.length, 'columns');

    const response = {
      id: kanbanId,
      title,
      description,
      columnsCount: createdColumns.length,
      tasksCount: 0,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Kanbans API POST: Error creating kanban:', error);
    return NextResponse.json(
      { error: 'Erro ao criar kanban' },
      { status: 500 }
    );
  }
}