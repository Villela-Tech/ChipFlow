-- Criar tabela de usuários se não existir
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
  UNIQUE KEY `email_unique` (`email`),
  UNIQUE KEY `token_unique` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alterar a coluna token se a tabela já existir
ALTER TABLE `User` MODIFY COLUMN `token` TEXT NULL;

-- Inserir usuário administrador
-- Senha: admin123
-- Hash gerado com bcrypt (10 rounds)
INSERT INTO `User` (`id`, `email`, `name`, `password`, `role`) 
VALUES (
  'admin1', -- id
  'admin@chipflow.com', -- email
  'Administrador', -- name
  '$2b$10$6l2EVvxRf/RDwc4YwXhseOR/iayFeS/5v6m8mOg8GDAa./FrAmiPu', -- senha: admin123
  'ADMIN' -- role
)
ON DUPLICATE KEY UPDATE
  `password` = VALUES(`password`),
  `role` = VALUES(`role`); 