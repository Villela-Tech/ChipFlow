import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, getConnection } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Chip extends RowDataPacket {
  id: number;
  number: string;
  status: string;
  operator: string;
  category: string;
  cid: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    const chips = await executeQuery<Chip[]>('SELECT * FROM Chip ORDER BY createdAt DESC', []);
    return NextResponse.json(chips);
  } catch (error) {
    console.error('Error fetching chips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chips', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const connection = await getConnection();
  
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.number || !data.operator || !data.category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate number format
    const numberPattern = /^\d{10,11}$/;
    const cleanNumber = data.number.replace(/\D/g, '');
    if (!numberPattern.test(cleanNumber)) {
      return NextResponse.json(
        { error: 'Número de telefone inválido' },
        { status: 400 }
      );
    }

    // Convert status to database format
    const status = data.status === 'AVAILABLE' ? 'active' : 'inactive';

    // Start transaction
    await connection.beginTransaction();

    try {
      // Check if number already exists
      const [existing] = await connection.execute<Chip[]>(
        'SELECT id FROM Chip WHERE number = ?',
        [cleanNumber]
      );

      if (existing.length > 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'Um chip com este número já existe' },
          { status: 400 }
        );
      }

      // Get next ID
      const [maxResult] = await connection.execute<Chip[]>('SELECT MAX(id) as maxId FROM Chip');
      const nextId = (maxResult[0]?.maxId || 0) + 1;

      // Insert new chip
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO Chip (id, number, status, operator, category, cid, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [nextId, cleanNumber, status, data.operator, data.category, data.cid || '']
      );

      // Get the inserted chip
      const [insertedChips] = await connection.execute<Chip[]>(
        'SELECT * FROM Chip WHERE id = ?',
        [nextId]
      );

      await connection.commit();
      
      return NextResponse.json(insertedChips[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating chip:', error);
    return NextResponse.json(
      { error: 'Failed to create chip', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 