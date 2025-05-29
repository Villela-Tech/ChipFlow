const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function testConnection(config) {
  const connection = await mysql.createConnection(config);
  await connection.ping();
  return connection;
}

async function setupDatabase() {
  console.log('🚀 Iniciando setup do banco de dados...');
  
  // Portas para testar
  const ports = [3307, 3306, 3308];
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  
  let connection = null;
  let workingPort = null;
  
  // Tentar conectar em diferentes portas
  for (const port of ports) {
    console.log(`🔌 Tentando conectar em ${host}:${port}...`);
    
    try {
      const config = {
        host,
        port,
        user,
        password,
        multipleStatements: true
      };
      
      connection = await testConnection(config);
      workingPort = port;
      console.log(`✅ Conectado com sucesso na porta ${port}!`);
      break;
      
    } catch (error) {
      console.log(`❌ Falha na porta ${port}: ${error.code || error.message}`);
    }
  }
  
  if (!connection) {
    console.error('❌ Não foi possível conectar ao MySQL em nenhuma porta');
    console.log('💡 Verifique se o MySQL está rodando e as credenciais estão corretas');
    process.exit(1);
  }
  
  try {
    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, 'setup-database.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Executar o script SQL
    console.log('📋 Executando script SQL...');
    const [results] = await connection.execute(sql);
    
    console.log('✅ Script SQL executado com sucesso!');
    console.log(`🎉 Banco configurado na porta ${workingPort}`);
    
    // Verificar o resultado
    if (Array.isArray(results)) {
      const lastResults = results.slice(-4); // Últimos 4 resultados (contagens)
      lastResults.forEach((result, index) => {
        if (result && Array.isArray(result) && result.length > 0) {
          console.log(`📊 ${Object.keys(result[0])[0]}: ${Object.values(result[0])[0]}`);
        }
      });
    }
    
    console.log(`\n🔧 Para usar essa porta, configure DB_PORT=${workingPort} no seu .env`);
    
  } catch (error) {
    console.error('❌ Erro durante o setup:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase }; 