// Script para verificar variáveis de ambiente
console.log('🔍 Verificando variáveis de ambiente...\n');

console.log('Variáveis encontradas:');
console.log('DB_HOST:', process.env.DB_HOST || 'NÃO DEFINIDO');
console.log('DB_PORT:', process.env.DB_PORT || 'NÃO DEFINIDO');
console.log('DB_USER:', process.env.DB_USER || 'NÃO DEFINIDO');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? `SET (${process.env.DB_PASSWORD.length} chars)` : 'NÃO DEFINIDO');
console.log('DB_NAME:', process.env.DB_NAME || 'NÃO DEFINIDO');

console.log('\n📁 Arquivos .env encontrados:');
const fs = require('fs');
const path = require('path');

const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file} existe`);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    lines.forEach(line => {
      if (line.includes('DB_')) {
        console.log(`  ${line}`);
      }
    });
  } else {
    console.log(`✗ ${file} não existe`);
  }
});

console.log('\n💡 Para resolver:');
console.log('1. Verifique se o MySQL está rodando');
console.log('2. Confirme a porta (3306 é padrão)');  
console.log('3. Teste a senha do root');
console.log('4. Verifique se o banco "chipflow" existe'); 