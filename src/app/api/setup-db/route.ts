import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';

export async function POST() {
  try {
    // Criar tabela de usuários
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS User (
        id VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL DEFAULT 'USER',
        token TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY email_unique (email),
        UNIQUE KEY token_unique (token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Criar tabela de kanbans
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS kanbans (
        id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_user_id (user_id),
        FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Criar tabela de colunas
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS columns (
        id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        kanban_id VARCHAR(255) NOT NULL,
        \`order\` INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_kanban_id (kanban_id),
        INDEX idx_order (\`order\`),
        FOREIGN KEY (kanban_id) REFERENCES kanbans(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Criar tabela de tarefas
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NULL,
        column_id VARCHAR(255) NOT NULL,
        \`order\` INT NOT NULL DEFAULT 0,
        priority VARCHAR(50) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'todo',
        assignee VARCHAR(255) NULL,
        due_date DATE NULL,
        labels JSON NULL,
        checklist JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_column_id (column_id),
        INDEX idx_order (\`order\`),
        FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Inserir usuário administrador
    await executeQuery(`
      INSERT INTO User (id, email, name, password, role) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        password = VALUES(password),
        role = VALUES(role)
    `, [
      'admin1',
      'admin@chipflow.com',
      'Administrador',
      '$2b$10$6l2EVvxRf/RDwc4YwXhseOR/iayFeS/5v6m8mOg8GDAa./FrAmiPu',
      'ADMIN'
    ]);

    // Inserir kanban de exemplo
    await executeQuery(`
      INSERT INTO kanbans (id, title, description, user_id)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        description = VALUES(description)
    `, [
      'kanban-exemplo-1',
      'Projeto Exemplo',
      'Este é um kanban de exemplo para demonstração',
      'admin1'
    ]);

    // Inserir colunas de exemplo
    const columns = [
      ['col-1', 'A fazer', 'kanban-exemplo-1', 0],
      ['col-2', 'Em progresso', 'kanban-exemplo-1', 1],
      ['col-3', 'Concluído', 'kanban-exemplo-1', 2]
    ];

    for (const [id, title, kanban_id, order] of columns) {
      await executeQuery(`
        INSERT INTO columns (id, title, kanban_id, \`order\`)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          \`order\` = VALUES(\`order\`)
      `, [id, title, kanban_id, order]);
    }

    // Inserir tarefas de exemplo
    const tasks = [
      ['task-1', 'Configurar ambiente', 'Configurar o ambiente de desenvolvimento', 'col-1', 0],
      ['task-2', 'Criar interface', 'Desenvolver a interface do usuário', 'col-2', 0],
      ['task-3', 'Fazer testes', 'Realizar testes da aplicação', 'col-3', 0]
    ];

    for (const [id, title, content, column_id, order] of tasks) {
      await executeQuery(`
        INSERT INTO tasks (id, title, content, column_id, \`order\`)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          content = VALUES(content),
          \`order\` = VALUES(\`order\`)
      `, [id, title, content, column_id, order]);
    }

    return NextResponse.json({
      success: true,
      message: 'Banco de dados configurado com sucesso!'
    });

  } catch (error) {
    console.error('Setup database error:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro ao configurar banco de dados',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 