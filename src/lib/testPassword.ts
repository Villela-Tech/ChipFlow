import bcrypt from 'bcryptjs';

const hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

// Lista de senhas comuns para testar
const commonPasswords = [
  'admin',
  'admin123',
  'password',
  '123456',
  'chipflow',
  'admin@123',
  '12345678',
  'administrator'
];

async function testPasswords() {
  console.log('Testando senhas...');
  
  for (const password of commonPasswords) {
    const match = await bcrypt.compare(password, hash);
    if (match) {
      console.log('Senha encontrada:', password);
      return;
    }
  }
  
  console.log('Senha não encontrada na lista de senhas comuns');
}

testPasswords(); 