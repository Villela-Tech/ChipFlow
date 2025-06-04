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

interface TaskRow extends RowDataPacket {
  id: string;
  title: string;
  content: string | null;
  column_id: string;
  order: number;
  labels?: string;
  checklist?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  assignee?: string;
  due_date?: string;
}

interface ColumnRow extends RowDataPacket {
  id: string;
  title: string;
  kanban_id: string;
  order: number;
}

interface KanbanData {
  tasks: { [key: string]: { 
    id: string; 
    title: string; 
    content: string | null;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    status?: 'todo' | 'in_progress' | 'review' | 'done';
    assignee?: string | null;
    dueDate?: string | null;
    labels?: string[];
    checklist?: any[];
  } };
  columns: { [key: string]: { id: string; title: string; taskIds: string[] } };
  columnOrder: string[];
  kanbanInfo?: {
    id: string;
    title: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  };
}

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { params } = context;
  const kanbanId = params.id;

  try {
    console.log('GET /api/kanbans/[id] - Starting request for kanban:', kanbanId);
    
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

    console.log('GET /api/kanbans/[id] - Fetching kanban data with userId:', userId);

    // Verificar se o kanban existe e pertence ao usuário
    const kanbans = await executeQuery<RowDataPacket[]>(
      'SELECT * FROM kanbans WHERE id = ?',
      [kanbanId]
    );

    if (!kanbans || kanbans.length === 0) {
      console.log('GET /api/kanbans/[id] - Kanban not found:', kanbanId);
      return NextResponse.json({ error: 'Kanban não encontrado' }, { status: 404 });
    }

    const kanbanInfo = kanbans[0];
    console.log('GET /api/kanbans/[id] - Found kanban:', kanbanInfo.id);

    // Buscar colunas do kanban
    console.log('GET /api/kanbans/[id] - Fetching columns');
    const columns = await executeQuery<ColumnRow[]>(
      'SELECT * FROM columns WHERE kanban_id = ? ORDER BY `order` ASC',
      [kanbanId]
    );
    console.log('GET /api/kanbans/[id] - Found columns:', columns.length);

    // Buscar tarefas de todas as colunas
    console.log('GET /api/kanbans/[id] - Fetching tasks');
    const tasks = await executeQuery<TaskRow[]>(
      'SELECT t.* FROM tasks t INNER JOIN columns c ON t.column_id = c.id WHERE c.kanban_id = ? ORDER BY t.`order` ASC',
      [kanbanId]
    );
    console.log('GET /api/kanbans/[id] - Found tasks:', tasks.length);

    // Transformar os dados para o formato esperado pelo componente KanbanBoard
    const data: KanbanData = {
      tasks: {},
      columns: {},
      columnOrder: columns.map(col => col.id)
    };

    // Adicionar informações básicas do kanban na resposta
    data.kanbanInfo = {
      id: kanbanInfo.id,
      title: kanbanInfo.title,
      description: kanbanInfo.description,
      created_at: kanbanInfo.created_at,
      updated_at: kanbanInfo.updated_at,
    };

    // Organizar colunas
    columns.forEach(column => {
      const columnTasks = tasks.filter(task => task.column_id === column.id);
      data.columns[column.id] = {
        id: column.id,
        title: column.title,
        taskIds: columnTasks.map(task => task.id),
      };
    });

    // Organizar tarefas com desserialização dos campos JSON
    tasks.forEach(task => {
      let labels = [];
      let checklist = [];
      
      try {
        labels = task.labels ? JSON.parse(task.labels) : [];
      } catch (e) {
        console.warn('GET /api/kanbans/[id] - Error parsing labels for task:', task.id, e);
        labels = [];
      }
      
      try {
        checklist = task.checklist ? JSON.parse(task.checklist) : [];
      } catch (e) {
        console.warn('GET /api/kanbans/[id] - Error parsing checklist for task:', task.id, e);
        checklist = [];
      }
      
      data.tasks[task.id] = {
        id: task.id,
        title: task.title,
        content: task.content,
        priority: task.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: task.status as 'todo' | 'in_progress' | 'review' | 'done',
        assignee: task.assignee,
        dueDate: task.due_date,
        labels,
        checklist,
      };
    });

    console.log('GET /api/kanbans/[id] - Successfully built response data');
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/kanbans/[id] - Error:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Erro ao carregar kanban',
        details: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  const { params } = context;
  const kanbanId = params.id;

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

    const data = await request.json();

    // Verificar se o usuário tem acesso a este kanban
    const kanbans = await executeQuery<RowDataPacket[]>(
      'SELECT * FROM kanbans WHERE id = ?',
      [kanbanId]
    );

    if (!kanbans || kanbans.length === 0) {
      return NextResponse.json({ error: 'Kanban não encontrado' }, { status: 404 });
    }

    // Atualizar posições das tarefas baseado no drag & drop
    if (data.tasks && data.columns) {
      for (const columnId in data.columns) {
        const column = data.columns[columnId];
        for (let i = 0; i < column.taskIds.length; i++) {
          const taskId = column.taskIds[i];
          await executeQuery(
            'UPDATE tasks SET column_id = ?, `order` = ? WHERE id = ?',
            [columnId, i, taskId]
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating kanban:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar kanban' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const { params } = context;
  const kanbanId = params.id;

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

    // Verificar se o kanban existe
    const kanbans = await executeQuery<RowDataPacket[]>(
      'SELECT * FROM kanbans WHERE id = ?',
      [kanbanId]
    );

    if (!kanbans || kanbans.length === 0) {
      return NextResponse.json({ error: 'Kanban não encontrado' }, { status: 404 });
    }

    // Deletar o kanban (as colunas e tarefas serão deletadas automaticamente devido à foreign key CASCADE)
    await executeQuery('DELETE FROM kanbans WHERE id = ?', [kanbanId]);

    return NextResponse.json({ message: 'Kanban excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting kanban:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir kanban' },
      { status: 500 }
    );
  }
} 