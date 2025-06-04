import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/mysql';
import { verifyToken } from '@/lib/auth';
import { headers } from 'next/headers';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import Papa from 'papaparse';

interface JWTPayload {
  userId: string;
  email: string;
  name: string | null;
}

interface ChipRow {
  name?: string;
  nome?: string;
  description?: string;
  descricao?: string;
  type?: string;
  tipo?: string;
  status?: string;
}

export async function POST(request: Request) {
  try {
    let userId = 'admin1'; // Usuário padrão para bypass

    // Verificar autenticação
    const headersList = await headers();
    const token = headersList.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar o token
    const decoded = verifyToken(token) as JWTPayload;
    userId = decoded.userId;

    // Receber o arquivo
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo fornecido' }, { status: 400 });
    }

    // Ler o arquivo
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Processar o arquivo baseado na extensão
    const fileName = file.name.toLowerCase();
    let data: ChipRow[] = [];

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Processar Excel
      const workbook = XLSX.read(buffer);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      data = XLSX.utils.sheet_to_json(worksheet) as ChipRow[];
    } else if (fileName.endsWith('.csv')) {
      // Processar CSV usando PapaParse
      const csvContent = buffer.toString();
      const parseResult = Papa.parse<ChipRow>(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase(),
        transform: (value: string) => value.trim(),
      });

      // Validar se há erros de parsing
      const parsingErrors = parseResult.errors
        .filter(err => err.code !== 'TooFewFields' && err.code !== 'TooManyFields')
        .map(err => `Linha ${(err.row || 0) + 2}: ${err.message}`);

      if (parsingErrors.length > 0) {
        return NextResponse.json({
          error: 'Erro ao processar CSV',
          details: parsingErrors
        }, { status: 400 });
      }

      // Validar se há dados
      if (parseResult.data.length === 0) {
        return NextResponse.json({
          error: 'Arquivo CSV vazio ou sem dados válidos',
        }, { status: 400 });
      }

      // Validar cabeçalhos
      const requiredHeaders = ['name', 'nome'];
      const hasValidHeader = requiredHeaders.some(header => 
        parseResult.meta.fields?.includes(header)
      );

      if (!hasValidHeader) {
        return NextResponse.json({
          error: 'Formato de arquivo inválido',
          details: ['O arquivo deve ter uma coluna chamada "name" ou "nome"']
        }, { status: 400 });
      }

      data = parseResult.data;
    } else {
      return NextResponse.json(
        { error: 'Formato de arquivo não suportado' },
        { status: 400 }
      );
    }

    // Validar e processar os dados
    const processedChips = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 porque a primeira linha é cabeçalho e arrays começam em 0

      // Validar campos obrigatórios
      if (!row.name && !row.nome) { // Aceitar tanto 'name' quanto 'nome'
        errors.push(`Linha ${rowNumber}: Nome é obrigatório`);
        continue;
      }

      // Criar objeto do chip com campos obrigatórios e opcionais
      const chip = {
        id: uuidv4(),
        name: row.name || row.nome || '', // Aceitar ambos os campos
        description: row.description || row.descricao || null, // Aceitar em português também
        type: row.type || row.tipo || 'default',
        status: row.status || 'active',
        created_by: userId
      };

      processedChips.push(chip);
    }

    // Se houver erros, retornar sem inserir nada
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Erros de validação', details: errors },
        { status: 400 }
      );
    }

    // Inserir chips no banco de dados
    for (const chip of processedChips) {
      await executeQuery(
        'INSERT INTO Chip (id, name, description, type, status, created_by) VALUES (?, ?, ?, ?, ?, ?)',
        [chip.id, chip.name, chip.description, chip.type, chip.status, chip.created_by]
      );
    }

    return NextResponse.json({
      message: 'Importação concluída com sucesso',
      imported: processedChips.length
    });
  } catch (error) {
    console.error('Erro na importação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar importação' },
      { status: 500 }
    );
  }
} 