import pool from '../lib/db';

async function alterTable() {
  try {
    console.log('Removendo índice único do token...');
    await pool.execute('ALTER TABLE User DROP INDEX token_unique');
    
    console.log('Alterando a coluna token...');
    await pool.execute('ALTER TABLE User MODIFY COLUMN token TEXT NULL');
    
    console.log('Coluna token alterada com sucesso!');
  } catch (error) {
    console.error('Erro ao alterar a coluna:', error);
  } finally {
    await pool.end();
  }
}

alterTable(); 