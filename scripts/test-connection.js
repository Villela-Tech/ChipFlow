const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  console.log('🔍 Testando diferentes configurações de banco...\n');
  
  // Configurações para testar
  const configs = [
    // Configuração atual
    { host: 'localhost', port: 3307, user: 'root', password: '', database: 'chipflow' },
    { host: 'localhost', port: 3307, user: 'root', password: '', database: null },
    
    // Portas comuns
    { host: 'localhost', port: 3306, user: 'root', password: '', database: 'chipflow' },
    { host: 'localhost', port: 3306, user: 'root', password: '', database: null },
    
    // Com senha vazia explícita
    { host: 'localhost', port: 3307, user: 'root', password: null, database: 'chipflow' },
    { host: 'localhost', port: 3306, user: 'root', password: null, database: 'chipflow' },
    
    // XAMPP/WAMP comum
    { host: 'localhost', port: 3306, user: 'root', password: '', database: 'chipflow' },
    { host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'chipflow' },
  ];
  
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    console.log(`🔌 Teste ${i + 1}: ${config.host}:${config.port} (user: ${config.user}, db: ${config.database || 'none'})`);
    
    try {
      const connection = await mysql.createConnection(config);
      await connection.ping();
      
      console.log('✅ CONEXÃO BEM-SUCEDIDA!');
      
      // Testar listar bancos
      try {
        const [databases] = await connection.execute('SHOW DATABASES');
        console.log('📁 Bancos disponíveis:', databases.map(db => Object.values(db)[0]).join(', '));
        
        // Se conectou a um banco específico, listar tabelas
        if (config.database) {
          try {
            const [tables] = await connection.execute('SHOW TABLES');
            console.log('📊 Tabelas encontradas:', tables.length);
            
            // Testar consulta na tabela kanbans
            try {
              const [kanbans] = await connection.execute('SELECT COUNT(*) as total FROM kanbans');
              console.log('🎯 Kanbans encontrados:', kanbans[0].total);
              
              // Mostrar alguns registros
              const [sampleKanbans] = await connection.execute('SELECT id, title FROM kanbans LIMIT 3');
              console.log('📋 Exemplos:', sampleKanbans.map(k => `${k.id}: ${k.title}`).join(', '));
            } catch (kanbanError) {
              console.log('⚠️  Erro ao consultar kanbans:', kanbanError.message);
            }
          } catch (tableError) {
            console.log('⚠️  Erro ao listar tabelas:', tableError.message);
          }
        }
        
      } catch (dbError) {
        console.log('⚠️  Erro ao listar bancos:', dbError.message);
      }
      
      await connection.end();
      console.log('🎉 CONFIGURAÇÃO FUNCIONANDO!\n');
      
      // Se funcionou, mostrar como configurar
      console.log('🔧 Configure seu .env com:');
      console.log(`DB_HOST=${config.host}`);
      console.log(`DB_PORT=${config.port}`);
      console.log(`DB_USER=${config.user}`);
      console.log(`DB_PASSWORD=${config.password || ''}`);
      console.log(`DB_NAME=${config.database || 'chipflow'}`);
      
      break; // Parar no primeiro que funcionar
      
    } catch (error) {
      console.log(`❌ Falhou: ${error.code || error.message}`);
    }
    
    console.log('');
  }
}

testDatabaseConnection().catch(console.error); 