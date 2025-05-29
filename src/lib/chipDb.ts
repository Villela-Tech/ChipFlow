import { pool } from './mysql';
import { RowDataPacket } from 'mysql2';

export interface Chip extends RowDataPacket {
  id: string;
  number: string;
  status: string;
  operator: string;
  category: string;
  cid?: string;
  created_at: Date;
  updated_at: Date;
}

// Buscar chip por número
export async function findChipByNumber(number: string): Promise<Chip | null> {
  try {
    const [rows] = await pool.execute<Chip[]>(
      'SELECT * FROM Chip WHERE number = ?',
      [number]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Erro ao buscar chip:', error);
    throw error;
  }
}

// Listar todos os chips
export async function listChips(
  page: number = 1,
  limit: number = 10,
  status?: string
): Promise<{ chips: Chip[]; total: number }> {
  try {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM Chip';
    let countQuery = 'SELECT COUNT(*) as total FROM Chip';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?';
      countQuery += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [chips] = await pool.execute<Chip[]>(query, params);
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, status ? [status] : []);
    
    return {
      chips,
      total: countRows[0].total
    };
  } catch (error) {
    console.error('Erro ao listar chips:', error);
    throw error;
  }
}

// Criar novo chip
export async function createChip(chipData: {
  number: string;
  operator: string;
  category: string;
  cid?: string;
  status?: string;
}) {
  try {
    const [result] = await pool.execute(
      'INSERT INTO Chip (number, operator, category, cid, status) VALUES (?, ?, ?, ?, ?)',
      [
        chipData.number,
        chipData.operator,
        chipData.category,
        chipData.cid || null,
        chipData.status || 'AVAILABLE'
      ]
    );
    return result;
  } catch (error) {
    console.error('Erro ao criar chip:', error);
    throw error;
  }
}

// Atualizar status do chip
export async function updateChipStatus(chipId: string, status: string) {
  try {
    const [result] = await pool.execute(
      'UPDATE Chip SET status = ? WHERE id = ?',
      [status, chipId]
    );
    return result;
  } catch (error) {
    console.error('Erro ao atualizar status do chip:', error);
    throw error;
  }
} 