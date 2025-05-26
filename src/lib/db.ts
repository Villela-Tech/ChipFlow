import mysql from 'mysql2/promise';

// Configuração do banco de dados
const dbConfig = {
  host: '15.235.9.156',
  port: 3306,
  user: 'ville5113_ChipFlow',
  password: 'fs2H&ZFRP4_b',
  database: 'ville5113_ChipFlow',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Criar pool de conexões
const pool = mysql.createPool(dbConfig);

// Helper function to execute queries
export async function executeQuery<T>(query: string, params: any[] = []): Promise<T> {
  try {
    const [rows] = await pool.execute(query, params);
    return rows as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Function to get a connection from the pool
export async function getConnection() {
  return await pool.getConnection();
}

// Test database connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Available tables:', tables);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

export default pool; 