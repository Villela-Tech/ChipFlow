import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    console.log('Debug API: Checking environment variables...');
    
    const envVars = {
      DB_HOST: process.env.DB_HOST || 'NOT_SET',
      DB_PORT: process.env.DB_PORT || 'NOT_SET',
      DB_USER: process.env.DB_USER || 'NOT_SET',
      DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT_SET',
      DB_NAME: process.env.DB_NAME || 'NOT_SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT_SET',
    };
    
    console.log('Debug API: Environment variables:', envVars);
    
    let dbStatus = 'NOT_TESTED';
    let tables: string[] = [];
    let error: string | null = null;
    let errorDetails: any = null;
    
    try {
      console.log('Debug API: Testing database connection...');
      const testQuery = await executeQuery<RowDataPacket[]>('SELECT 1 as test');
      console.log('Debug API: Database connection successful');
      dbStatus = 'CONNECTED';
      
      // Listar tabelas
      const tablesResult = await executeQuery<RowDataPacket[]>('SHOW TABLES');
      tables = tablesResult.map((row: RowDataPacket) => Object.values(row)[0] as string);
      console.log('Debug API: Tables found:', tables);
      
    } catch (dbError: any) {
      console.error('Debug API: Database error details:', dbError);
      dbStatus = 'ERROR';
      error = dbError.message || 'Unknown error';
      errorDetails = {
        code: dbError.code,
        errno: dbError.errno,
        sqlState: dbError.sqlState,
        sqlMessage: dbError.sqlMessage,
        name: dbError.name,
        stack: dbError.stack?.split('\n').slice(0, 5).join('\n'), // Primeiras 5 linhas do stack
      };
    }
    
    return NextResponse.json({
      environment: envVars,
      database: {
        status: dbStatus,
        tables,
        error,
        errorDetails
      }
    });
    
  } catch (generalError) {
    console.error('Debug API: General error:', generalError);
    return NextResponse.json(
      { error: (generalError as Error).message },
      { status: 500 }
    );
  }
} 