import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';
import { verifyToken } from '@/lib/auth';
import { headers } from 'next/headers';
import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';

// Bypass temporário - remova quando a autenticação estiver funcionando
const BYPASS_AUTH = true;

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

    const { 
      title, 
      content, 
      columnId, 
      priority = 'medium',
      status = 'todo',
      assignee = null,
      dueDate = null,
      labels = [],
      checklist = []
    } = await request.json();

    if (!title || !columnId) {
      return NextResponse.json({ error: 'Título e coluna são obrigatórios' }, { status: 400 });
    }

    // Verificar se o kanban existe e pertence ao usuário
    const kanbans = await executeQuery<RowDataPacket[]>(
      'SELECT * FROM kanbans WHERE id = ? AND user_id = ?',
      [params.id, userId]
    );

    if (!kanbans || kanbans.length === 0) {
      return NextResponse.json({ error: 'Kanban não encontrado' }, { status: 404 });
    }

    // Verificar se a coluna pertence ao kanban
    const columns = await executeQuery<RowDataPacket[]>(
      'SELECT * FROM columns WHERE id = ? AND kanban_id = ?',
      [columnId, params.id]
    );

    if (!columns || columns.length === 0) {
      return NextResponse.json({ error: 'Coluna não encontrada' }, { status: 404 });
    }

    // Obter a próxima posição na coluna (usar `order` em vez de `position`)
    const [positionResult] = await executeQuery<RowDataPacket[]>(
      'SELECT COALESCE(MAX(`order`), -1) + 1 as nextPosition FROM tasks WHERE column_id = ?',
      [columnId]
    );

    const nextPosition = positionResult?.nextPosition || 0;

    // Gerar UUID para a nova tarefa
    const taskId = uuidv4();

    // Serializar arrays como JSON
    const labelsJson = JSON.stringify(labels);
    const checklistJson = JSON.stringify(checklist);

    // Criar a tarefa com todos os campos
    const result = await executeQuery(
      `INSERT INTO tasks (
        id, title, content, column_id, \`order\`, 
        priority, status, assignee, due_date, labels, checklist
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId, 
        title, 
        content || null, 
        columnId, 
        nextPosition,
        priority,
        status,
        assignee,
        dueDate,
        labelsJson,
        checklistJson
      ]
    );

    return NextResponse.json({
      id: taskId,
      title,
      content,
      columnId,
      position: nextPosition,
      priority,
      status,
      assignee,
      dueDate,
      labels,
      checklist,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Erro ao criar tarefa' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { 
      taskId,
      title, 
      content, 
      priority,
      status,
      assignee,
      dueDate,
      labels,
      checklist
    } = await request.json();

    if (!taskId || !title) {
      return NextResponse.json({ error: 'ID da tarefa e título são obrigatórios' }, { status: 400 });
    }

    // Verificar se o kanban existe e pertence ao usuário
    const kanbans = await executeQuery<RowDataPacket[]>(
      'SELECT * FROM kanbans WHERE id = ? AND user_id = ?',
      [params.id, userId]
    );

    if (!kanbans || kanbans.length === 0) {
      return NextResponse.json({ error: 'Kanban não encontrado' }, { status: 404 });
    }

    // Verificar se a tarefa existe e pertence a este kanban
    const tasks = await executeQuery<RowDataPacket[]>(
      `SELECT t.* FROM tasks t 
       INNER JOIN columns c ON t.column_id = c.id 
       WHERE t.id = ? AND c.kanban_id = ?`,
      [taskId, params.id]
    );

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    // Serializar arrays como JSON
    const labelsJson = JSON.stringify(labels || []);
    const checklistJson = JSON.stringify(checklist || []);

    // Atualizar a tarefa
    await executeQuery(
      `UPDATE tasks SET 
        title = ?, content = ?, priority = ?, status = ?, 
        assignee = ?, due_date = ?, labels = ?, checklist = ?
       WHERE id = ?`,
      [
        title,
        content || null,
        priority || 'medium',
        status || 'todo',
        assignee || null,
        dueDate || null,
        labelsJson,
        checklistJson,
        taskId
      ]
    );

    return NextResponse.json({
      id: taskId,
      title,
      content,
      priority,
      status,
      assignee,
      dueDate,
      labels,
      checklist,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar tarefa' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'ID da tarefa é obrigatório' }, { status: 400 });
    }

    // Verificar se o kanban existe e pertence ao usuário
    const kanbans = await executeQuery<RowDataPacket[]>(
      'SELECT * FROM kanbans WHERE id = ? AND user_id = ?',
      [params.id, userId]
    );

    if (!kanbans || kanbans.length === 0) {
      return NextResponse.json({ error: 'Kanban não encontrado' }, { status: 404 });
    }

    // Verificar se a tarefa existe e pertence a este kanban
    const tasks = await executeQuery<RowDataPacket[]>(
      `SELECT t.* FROM tasks t 
       INNER JOIN columns c ON t.column_id = c.id 
       WHERE t.id = ? AND c.kanban_id = ?`,
      [taskId, params.id]
    );

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    // Deletar a tarefa
    await executeQuery('DELETE FROM tasks WHERE id = ?', [taskId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar tarefa' },
      { status: 500 }
    );
  }
} 