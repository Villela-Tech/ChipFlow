import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Debug Kanbans API - Iniciando...');
    
    // Verificar variáveis de ambiente
    const envVars = {
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT_SET',
      DB_NAME: process.env.DB_NAME
    };
    
    console.log('Variáveis de ambiente:', envVars);
    
    if (!process.env.DB_HOST) {
      console.log('❌ Variáveis de ambiente não carregadas!');
      return NextResponse.json({
        error: 'Variáveis de ambiente não carregadas',
        env_vars: envVars
      }, { status: 500 });
    }
    
    // Tentar conexão simples
    const mysql = require('mysql2/promise');
    
    const config = {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    };
    
    console.log('Tentando conexão com:', { ...config, password: 'HIDDEN' });
    
    const connection = await mysql.createConnection(config);
    console.log('✅ Conexão estabelecida!');
    
    // Buscar kanbans
    const [kanbans] = await connection.execute('SELECT * FROM kanbans ORDER BY created_at DESC');
    console.log('📊 Kanbans encontrados:', kanbans.length);
    
    await connection.end();
    
    return NextResponse.json({
      success: true,
      env_vars: envVars,
      kanbans_count: kanbans.length,
      kanbans: kanbans
    });
    
  } catch (error) {
    console.error('❌ Erro na API:', error);
    return NextResponse.json({
      error: (error as Error).message,
      env_vars: {
        DB_HOST: process.env.DB_HOST || 'NOT_SET',
        DB_PORT: process.env.DB_PORT || 'NOT_SET',
        DB_USER: process.env.DB_USER || 'NOT_SET',
        DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT_SET',
        DB_NAME: process.env.DB_NAME || 'NOT_SET'
      }
    }, { status: 500 });
  }
} 