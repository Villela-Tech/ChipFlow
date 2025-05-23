import * as XLSX from 'xlsx';
import { Chip } from '@prisma/client';

export const parseExcelFile = (file: File): Promise<Partial<Chip>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Map Excel data to Chip model structure
        const chips = jsonData.map((row: any) => ({
          number: row.number || row.Number || row.NUMERO || row.Número,
          status: row.status || row.Status || 'AVAILABLE',
          operator: row.operator || row.Operator || row.OPERADORA || row.Operadora,
          category: row.category || row.Category || row.CATEGORIA || row.Categoria,
          cid: row.cid || row.CID || row.Cid,
        }));

        resolve(chips);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}; 