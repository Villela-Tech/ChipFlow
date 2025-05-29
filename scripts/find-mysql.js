const mysql = require('mysql2/promise');
const { execSync } = require('child_process');
require('dotenv').config();

async function findMySQL() {
  console.log('🔍 Procurando MySQL ativo...\n');
  
  // 1. Verificar portas em uso
  console.log('📡 Portas MySQL comuns em uso:');
  const commonPorts = [3306, 3307, 3308, 3309];
  
  for (const port of commonPorts) {
    try {
      const result = execSync(`netstat -an | findstr :${port}`, { encoding: 'utf8' });
      if (result.trim()) {
        console.log(`✓ Porta ${port}: ATIVA`);
        console.log(`  ${result.trim()}`);
      }
    } catch (error) {
      console.log(`✗ Porta ${port}: não ativa`);
    }
  }
  
  console.log('\n🔌 Testando conexões MySQL...\n');
  
  // 2. Testar com configurações do .env (Next.js carrega automaticamente)
  const envConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER ,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  };
  
  console.log('📋 Configuração do .env:');
  console.log(`  Host: ${envConfig.host}`);
  console.log(`  Port: ${envConfig.port}`);
  console.log(`  User: ${envConfig.user}`);
  console.log(`  Password: ${envConfig.password ? 'SET' : 'EMPTY'}`);
  console.log(`  Database: ${envConfig.database}`);
  
  // Testar conexão com .env
  try {
    console.log('\n🔧 Testando com configuração do .env...');
    const connection = await mysql.createConnection(envConfig);
    await connection.ping();
    
    // Testar acesso ao banco chipflow
    try {
      const [databases] = await connection.execute('SHOW DATABASES');
      const dbNames = databases.map(db => Object.values(db)[0]);
      console.log('✅ CONEXÃO FUNCIONOU!');
      console.log('📁 Bancos disponíveis:', dbNames.join(', '));
      
      if (dbNames.includes('chipflow')) {
        console.log('✅ Banco "chipflow" encontrado!');
        
        // Testar tabela kanbans
        try {
          const [tables] = await connection.execute('SHOW TABLES FROM chipflow');
          const tableNames = tables.map(t => Object.values(t)[0]);
          console.log('📊 Tabelas no chipflow:', tableNames.join(', '));
          
          if (tableNames.includes('kanbans')) {
            const [kanbans] = await connection.execute('SELECT COUNT(*) as total FROM chipflow.kanbans');
            console.log(`🎯 Kanbans no banco: ${kanbans[0].total}`);
            
            if (kanbans[0].total > 0) {
              const [sample] = await connection.execute('SELECT id, title FROM chipflow.kanbans LIMIT 3');
              console.log('📋 Exemplos de kanbans:');
              sample.forEach(k => console.log(`  - ${k.id}: ${k.title}`));
            }
          }
        } catch (tableError) {
          console.log('⚠️  Erro ao acessar tabelas:', tableError.message);
        }
      } else {
        console.log('⚠️  Banco "chipflow" não encontrado!');
        console.log('💡 Você precisa criar o banco "chipflow"');
      }
      
      // Verificar banco real ville5113_ChipFlow
      if (dbNames.includes('ville5113_ChipFlow')) {
        console.log('✅ Banco "ville5113_ChipFlow" encontrado!');
        
        try {
          const [tables] = await connection.execute('SHOW TABLES FROM ville5113_ChipFlow');
          const tableNames = tables.map(t => Object.values(t)[0]);
          console.log('📊 Tabelas no ville5113_ChipFlow:', tableNames.join(', '));
          
          if (tableNames.includes('kanbans')) {
            const [kanbans] = await connection.execute('SELECT COUNT(*) as total FROM ville5113_ChipFlow.kanbans');
            console.log(`🎯 Kanbans no banco: ${kanbans[0].total}`);
            
            if (kanbans[0].total > 0) {
              const [sample] = await connection.execute('SELECT id, title FROM ville5113_ChipFlow.kanbans LIMIT 3');
              console.log('📋 Exemplos de kanbans:');
              sample.forEach(k => console.log(`  - ${k.id}: ${k.title}`));
            }
          }
        } catch (tableError) {
          console.log('⚠️  Erro ao acessar tabelas:', tableError.message);
        }
      }
      
    } catch (dbError) {
      console.log('⚠️  Erro ao listar bancos:', dbError.message);
    }
    
    await connection.end();
    console.log('\n🎉 CONFIGURAÇÃO FUNCIONANDO! Reinicie o servidor Next.js');
    return;
    
  } catch (error) {
    console.log(`❌ Falhou: ${error.code || error.message}`);
  }
  
  // 3. Se .env não funcionou, testar outras configurações
  console.log('\n🔄 Testando configurações alternativas...');
  
  const backupConfigs = [
    { host: 'localhost', port: 3306, user: 'root', password: '', database: 'chipflow' },
    { host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'chipflow' },
    { host: 'localhost', port: 3306, user: 'root', password: 'root', database: 'chipflow' },
    { host: 'localhost', port: 3307, user: 'root', password: '', database: 'chipflow' },
  ];
  
  for (let i = 0; i < backupConfigs.length; i++) {
    const config = backupConfigs[i];
    try {
      console.log(`\n🔧 Teste ${i + 1}: ${config.host}:${config.port} (pass: ${config.password || 'empty'})`);
      const connection = await mysql.createConnection(config);
      await connection.ping();
      
      console.log('✅ CONEXÃO ALTERNATIVA FUNCIONOU!');
      console.log('🔧 Use essas configurações no seu .env:');
      console.log(`DB_HOST=${config.host}`);
      console.log(`DB_PORT=${config.port}`);
      console.log(`DB_USER=${config.user}`);
      console.log(`DB_PASSWORD=${config.password}`);
      console.log(`DB_NAME=${config.database}`);
      
      await connection.end();
      break;
      
    } catch (error) {
      console.log(`❌ Falhou: ${error.code || error.message}`);
    }
  }
}

findMySQL().catch(console.error); 