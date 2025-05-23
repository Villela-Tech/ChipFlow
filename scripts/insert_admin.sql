-- Inserir usuário administrador (senha: admin123)
-- A senha está hasheada com bcrypt
INSERT INTO `User` (`id`, `email`, `name`, `password`, `role`)
VALUES (
  'admin_id',
  'admin@chipflow.com',
  'Administrador',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'ADMIN'
); 