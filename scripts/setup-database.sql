-- Criar banco de dados se não existir
CREATE DATABASE IF NOT EXISTS chipflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar o banco de dados
USE chipflow;

-- Criar tabela User
CREATE TABLE IF NOT EXISTS `User` (
  `id` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(255) NOT NULL DEFAULT 'USER',
  `token` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela kanbans
CREATE TABLE IF NOT EXISTS `kanbans` (
  `id` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela columns
CREATE TABLE IF NOT EXISTS `columns` (
  `id` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `kanban_id` VARCHAR(255) NOT NULL,
  `order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`kanban_id`) REFERENCES `kanbans`(`id`) ON DELETE CASCADE,
  INDEX `idx_kanban_id` (`kanban_id`),
  INDEX `idx_order` (`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela tasks
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `column_id` VARCHAR(255) NOT NULL,
  `order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`column_id`) REFERENCES `columns`(`id`) ON DELETE CASCADE,
  INDEX `idx_column_id` (`column_id`),
  INDEX `idx_order` (`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela Chip (se necessário)
CREATE TABLE IF NOT EXISTS `Chip` (
  `id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir usuário administrador se não existir
INSERT IGNORE INTO `User` (`id`, `email`, `name`, `password`, `role`) 
VALUES (
  'admin1',
  'admin@chipflow.com',
  'Administrador',
  '$2b$10$6l2EVvxRf/RDwc4YwXhseOR/iayFeS/5v6m8mOg8GDAa./FrAmiPu',
  'ADMIN'
);

-- Inserir alguns kanbans de exemplo
INSERT IGNORE INTO `kanbans` (`id`, `title`, `description`, `user_id`) VALUES
('kanban-1', 'Projeto de Desenvolvimento', 'Sistema de gestão completo com funcionalidades avançadas', 'admin1'),
('kanban-2', 'Marketing Digital', 'Campanhas para redes sociais e SEO', 'admin1'),
('kanban-3', 'Suporte ao Cliente', 'Atendimento e resolução de tickets', 'admin1');

-- Inserir colunas para cada kanban
INSERT IGNORE INTO `columns` (`id`, `title`, `kanban_id`, `order`) VALUES
-- Kanban 1
('col-1-1', 'A fazer', 'kanban-1', 0),
('col-1-2', 'Em progresso', 'kanban-1', 1),
('col-1-3', 'Concluído', 'kanban-1', 2),
-- Kanban 2
('col-2-1', 'Ideias', 'kanban-2', 0),
('col-2-2', 'Planejamento', 'kanban-2', 1),
('col-2-3', 'Execução', 'kanban-2', 2),
('col-2-4', 'Finalizado', 'kanban-2', 3),
-- Kanban 3
('col-3-1', 'Novos tickets', 'kanban-3', 0),
('col-3-2', 'Em atendimento', 'kanban-3', 1),
('col-3-3', 'Resolvido', 'kanban-3', 2);

-- Inserir algumas tarefas de exemplo
INSERT IGNORE INTO `tasks` (`id`, `title`, `description`, `column_id`, `order`) VALUES
-- Kanban 1 - Projeto de Desenvolvimento
('task-1-1', 'Configurar ambiente de desenvolvimento', 'Instalar Docker e configurar banco de dados', 'col-1-1', 0),
('task-1-2', 'Criar autenticação de usuários', 'Implementar login/logout com JWT', 'col-1-1', 1),
('task-1-3', 'Desenvolver API REST', 'Endpoints para CRUD básico', 'col-1-2', 0),
('task-1-4', 'Implementar testes unitários', 'Cobertura de 80% do código', 'col-1-3', 0),

-- Kanban 2 - Marketing Digital
('task-2-1', 'Pesquisa de palavras-chave', 'Análise SEO completa', 'col-2-1', 0),
('task-2-2', 'Criar calendário de posts', 'Planejar conteúdo para 3 meses', 'col-2-2', 0),
('task-2-3', 'Produzir conteúdo visual', 'Criar banners e vídeos', 'col-2-3', 0),

-- Kanban 3 - Suporte ao Cliente  
('task-3-1', 'Ticket #001 - Bug no login', 'Usuário não consegue fazer login', 'col-3-2', 0),
('task-3-2', 'Ticket #002 - Performance lenta', 'Sistema demora para carregar', 'col-3-1', 0);

-- Mostrar resultado
SELECT 'Database setup completed successfully!' as message;
SELECT COUNT(*) as total_users FROM User;
SELECT COUNT(*) as total_kanbans FROM kanbans;
SELECT COUNT(*) as total_columns FROM columns;
SELECT COUNT(*) as total_tasks FROM tasks; 