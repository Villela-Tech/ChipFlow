import pool from './db';
import { RowDataPacket } from 'mysql2';

export interface User extends RowDataPacket {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
  token?: string;
  created_at: Date;
  updated_at: Date;
}

// Buscar usuário por email
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const [rows] = await pool.execute<User[]>(
      'SELECT * FROM User WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw error;
  }
}

// Criar novo usuário
export async function createUser(userData: {
  email: string;
  name: string;
  password: string;
  role?: string;
}) {
  try {
    const [result] = await pool.execute(
      'INSERT INTO User (email, name, password, role) VALUES (?, ?, ?, ?)',
      [
        userData.email.toLowerCase().trim(),
        userData.name,
        userData.password,
        userData.role || 'USER'
      ]
    );
    return result;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
}

// Atualizar token do usuário
export async function updateUserToken(userId: string, token: string | null) {
  try {
    const [result] = await pool.execute(
      'UPDATE User SET token = ? WHERE id = ?',
      [token, userId]
    );
    return result;
  } catch (error) {
    console.error('Erro ao atualizar token:', error);
    throw error;
  }
}

// Buscar usuário por token
export async function findUserByToken(token: string): Promise<User | null> {
  try {
    const [rows] = await pool.execute<User[]>(
      'SELECT * FROM User WHERE token = ?',
      [token]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Erro ao buscar usuário por token:', error);
    throw error;
  }
} 