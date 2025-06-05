import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ChipData, ChipStatus, Operator, Category } from '@/types/chip';

// Sample data for template
const sampleData = [
  {
    number: '51986510125',
    status: 'active',
    operator: 'CLARO',
    category: 'FOR_DELIVERY',
    cid: '12321415421'
  },
  {
    number: '11999887766',
    status: 'inactive',
    operator: 'VIVO',
    category: 'BANNED',
    cid: 'CID123'
  }
];

export const downloadTemplate = () => {
  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Chips');
  
  // Generate buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Save file
  saveAs(data, 'chips_template.xlsx');
};

export const exportToExcel = (chips: ChipData[]) => {
  const exportData = chips.map(chip => ({
    number: chip.number,
    status: chip.status,
    operator: chip.operator,
    category: chip.category,
    cid: chip.cid || ''
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Chips');
  
  // Generate buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Save file
  saveAs(data, `chips_export_${new Date().toISOString().split('T')[0]}.xlsx`);
};

const mapToChipStatus = (value: any): ChipStatus => {
  if (!value) return 'inactive';
  const lowerValue = String(value).toLowerCase().trim();
  if (lowerValue === 'active' || lowerValue === 'ativo' || lowerValue === 'ativa' || lowerValue === 'disponivel') return 'active';
  if (lowerValue === 'inactive' || lowerValue === 'inativo' || lowerValue === 'inativa' || lowerValue === 'indisponível' || lowerValue === 'indisponivel') return 'inactive';
  return 'inactive';
};

const mapToOperator = (value: any): Operator => {
  if (!value) return 'CLARO';
  const upperValue = String(value).toUpperCase().trim();
  if (upperValue === 'CLARO' || upperValue.includes('CLARO')) return 'CLARO';
  if (upperValue === 'VIVO' || upperValue.includes('VIVO')) return 'VIVO';
  return 'CLARO';
};

const mapToCategory = (value: any): Category => {
  if (!value) return 'FOR_DELIVERY';
  const upperValue = String(value).toUpperCase().replace(/\s+/g, '_').trim();
  if (upperValue === 'FOR_DELIVERY' || upperValue === 'DELIVERY' || upperValue === 'PARA_ENTREGA') return 'FOR_DELIVERY';
  if (upperValue === 'BANNED' || upperValue === 'BANIDO') return 'BANNED';
  if (upperValue === 'UNAVAILABLE_ACCESS' || upperValue === 'ACESSO_INDISPONIVEL' || upperValue === 'SMS_INDISPONIVEL') return 'UNAVAILABLE_ACCESS';
  return 'FOR_DELIVERY';
};

const normalizeHeader = (header: string): string => {
  return header.replace(':', '').trim();
};

export const parseExcelFile = (file: File): Promise<Partial<ChipData>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // Configure XLSX to read all numbers as text
        const workbook = XLSX.read(data, { 
          type: 'binary',
          cellText: true,
          cellDates: true,
          cellNF: false
        });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Ensure all columns are wide enough
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        if (!worksheet['!cols']) {
          worksheet['!cols'] = [];
        }
        for (let C = range.s.c; C <= range.e.c; ++C) {
          worksheet['!cols'][C] = { wch: 20 }; // Set column width to 20 characters
        }
        
        console.log('Original worksheet:', worksheet);
        
        // Convert headers to normalized format
        const headers: { [key: string]: string } = {};
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
          if (cell && cell.v) {
            const originalHeader = cell.v.toString();
            const header = normalizeHeader(originalHeader);
            headers[XLSX.utils.encode_col(C)] = header;
            worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })] = { 
              ...cell, 
              v: header,
              w: header, // Ensure the formatted text is also updated
              t: 's'    // Force cell type to be string
            };
          }
        }
        
        console.log('Normalized headers:', headers);

        // Force all cells to be read as text
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = worksheet[cellRef];
            if (cell) {
              // Convert cell to text format
              if (typeof cell.v === 'number') {
                cell.t = 's';
                cell.w = cell.v.toString();
                cell.v = cell.v.toString();
              }
            }
          }
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,      // Return formatted text
          defval: ''       // Default value for empty cells
        });
        
        console.log('Raw Excel data:', jsonData);

        // Map Excel data to Chip model structure
        const chips: Partial<ChipData>[] = jsonData.map((row: any, index: number) => {
          console.log(`\nProcessing row ${index + 1}:`, row);
          
          // Get values using both original and normalized headers
          const number = row.Numero || row.numero || row.Number || row.number || row['Numero'] || row['Number'];
          const status = row.Status || row.status || row['Status'];
          const operator = row.Operadora || row.operadora || row.Operator || row.operator || row['Operadora'] || row['Operator'];
          const category = row.Categoria || row.categoria || row.Category || row.category || row['Categoria'] || row['Category'];
          const cid = row.CID || row.cid || row['CID'];

          console.log('Extracted raw values:', { number, status, operator, category, cid });

          // Clean phone number by removing formatting and ensuring it's a string
          const cleanNumber = number ? String(number).replace(/[^\d]/g, '') : undefined;
          // Clean CID by ensuring it's a string and removing any formatting
          const cleanCid = cid ? String(cid).replace(/[^\d]/g, '') : undefined;
          
          console.log('Cleaned values:', { number: cleanNumber, cid: cleanCid });

          const mappedChip: Partial<ChipData> = {
            number: cleanNumber,
            status: status ? mapToChipStatus(status) : 'inactive',
            operator: operator ? mapToOperator(operator) : 'CLARO',
            category: category ? mapToCategory(category) : 'FOR_DELIVERY',
            cid: cleanCid
          };

          console.log('Mapped chip:', mappedChip);
          return mappedChip;
        }).filter(chip => {
          const isValid = chip.number && chip.cid;
          if (!isValid) {
            console.log('Invalid chip (missing number or CID):', chip);
          }
          return isValid;
        });

        console.log('\nFinal mapped chips:', chips);
        console.log('Number of valid chips:', chips.length);

        if (chips.length === 0) {
          console.log('No valid chips found. Headers:', Object.keys(jsonData[0] || {}));
          throw new Error('Nenhum dado válido encontrado no arquivo Excel. Verifique se os cabeçalhos estão corretos e se os chips possuem número e CID.');
        }

        resolve(chips);
      } catch (error) {
        console.error('Error parsing Excel:', error);
        reject(error);
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(error);
    };
    
    reader.readAsBinaryString(file);
  });
}; 