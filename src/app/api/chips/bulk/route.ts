import { NextResponse } from 'next/server';
import { executeQuery, pool } from '@/lib/mysql';
import { verifyToken } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

interface ChipData {
  number: string;
  status: string;
  operator: string;
  category: string;
  cid: string;
}

interface ChipRow extends RowDataPacket {
  maxId: number;
  id: number;
  number: string;
}

export async function POST(request: Request) {
  const connection = await pool.getConnection();
  
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    console.log('Received data:', body);

    if (!body.chips || !Array.isArray(body.chips) || body.chips.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Validar e preparar os dados
    const validChips = body.chips.filter((chip: Partial<ChipData>) => {
      return chip.number && chip.status && chip.operator && chip.category && chip.cid;
    });

    if (validChips.length === 0) {
      return NextResponse.json({ error: 'Nenhum chip válido encontrado' }, { status: 400 });
    }

    console.log('Valid chips:', validChips);

    // Iniciar transação
    await connection.beginTransaction();

    try {
      // Coletar todos os números de chip para verificar duplicatas
      const numbers = validChips.map((chip: ChipData) => chip.number);
      console.log('Numbers to check:', numbers);

      // Criar placeholders para a query IN
      const placeholders = numbers.map(() => '?').join(',');
      const query = `SELECT id, number FROM Chip WHERE number IN (${placeholders})`;
      console.log('Checking duplicates query:', query);
      
      const [existingChips] = await connection.execute<ChipRow[]>(query, numbers);
      console.log('Existing chips found:', existingChips);

      // Separar chips em novos e existentes
      const existingNumbers = new Set(existingChips.map((chip: ChipRow) => chip.number));
      console.log('Existing numbers:', Array.from(existingNumbers));

      const newChips = validChips.filter((chip: ChipData) => !existingNumbers.has(chip.number));
      const chipsToUpdate = validChips.filter((chip: ChipData) => existingNumbers.has(chip.number));

      console.log(`Found ${existingChips.length} existing chips to update`);
      console.log(`Found ${newChips.length} new chips to insert`);
      console.log('New chips:', newChips);
      console.log('Chips to update:', chipsToUpdate);

      // Atualizar chips existentes
      if (chipsToUpdate.length > 0) {
        for (const chip of chipsToUpdate) {
          const updateQuery = `
            UPDATE Chip 
            SET status = ?, 
                operator = ?, 
                category = ?, 
                cid = ?, 
                updatedAt = NOW()
            WHERE number = ?
          `;
          const updateValues = [chip.status, chip.operator, chip.category, chip.cid, chip.number];
          console.log('Update query:', updateQuery);
          console.log('Update values:', updateValues);
          
          await connection.execute(updateQuery, updateValues);
        }
      }

      // Inserir novos chips
      if (newChips.length > 0) {
        // Obter o maior ID atual
        const [maxResult] = await connection.execute<ChipRow[]>('SELECT MAX(id) as maxId FROM Chip');
        let nextId = (maxResult[0]?.maxId || 0) + 1;
        console.log('Next ID to use:', nextId);

        // Preparar query para inserção em lote
        const values = newChips.map((chip: ChipData) => {
          const chipValues = [
            nextId++,
            chip.number,
            chip.status,
            chip.operator,
            chip.category,
            chip.cid,
            new Date(), // createdAt
            new Date()  // updatedAt
          ];
          return chipValues;
        });

        const insertPlaceholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const flatValues = values.flat();

        const insertQuery = `
          INSERT INTO Chip (id, number, status, operator, category, cid, createdAt, updatedAt)
          VALUES ${insertPlaceholders}
        `;

        console.log('Insert query:', insertQuery);
        console.log('Insert values:', flatValues);

        await connection.execute(insertQuery, flatValues);
      }

      await connection.commit();

      return NextResponse.json({ 
        message: 'Chips processados com sucesso',
        inserted: newChips.length,
        updated: chipsToUpdate.length,
        total: validChips.length
      });
    } catch (error) {
      console.error('Error in transaction:', error);
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Erro detalhado ao importar chips:', error);
    return NextResponse.json(
      { error: 'Erro ao importar chips', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 