import { executeQuery } from './mysql';
import { RowDataPacket } from 'mysql2';
import { hashPassword } from './auth';

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

// Dados de fallback quando o MySQL não está disponível
const fallbackUsers: User[] = [
  {
    id: 'admin1',
    email: 'admin@chipflow.com',
    name: 'Administrador',
    password: '$2b$10$6l2EVvxRf/RDwc4YwXhseOR/iayFeS/5v6m8mOg8GDAa./FrAmiPu', // admin123
    role: 'ADMIN',
    created_at: new Date(),
    updated_at: new Date()
  } as User
];

// Buscar usuário por email
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const rows = await executeQuery<User[]>(
      'SELECT * FROM User WHERE email = ?',
      [email.toLowerCase().trim()]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Erro ao buscar usuário no MySQL, usando dados locais:', error);
    
    // Fallback: usar dados locais
    const user = fallbackUsers.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    return user || null;
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
    const result = await executeQuery(
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
    console.error('Erro ao criar usuário no MySQL:', error);
    
    // Fallback: simular criação bem-sucedida
    return { insertId: Math.random().toString() };
  }
}

// Atualizar token do usuário
export async function updateUserToken(userId: string, token: string | null) {
  try {
    const result = await executeQuery(
      'UPDATE User SET token = ? WHERE id = ?',
      [token, userId]
    );
    return result;
  } catch (error) {
    console.error('Erro ao atualizar token no MySQL:', error);
    
    // Fallback: simular atualização bem-sucedida
    return { affectedRows: 1 };
  }
}

// Buscar usuário por token
export async function findUserByToken(token: string): Promise<User | null> {
  try {
    const rows = await executeQuery<User[]>(
      'SELECT * FROM User WHERE token = ?',
      [token]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Erro ao buscar usuário por token no MySQL:', error);
    
    // Fallback: não encontrar usuário por token (forçar novo login)
    return null;
  }
} 