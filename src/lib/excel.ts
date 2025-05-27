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
  const lowerValue = typeof value === 'string' ? value.toLowerCase().trim() : '';
  if (lowerValue === 'active') return 'active';
  if (lowerValue === 'inactive') return 'inactive';
  // Consider how to handle invalid status values from Excel.
  // For now, defaulting to inactive, but you might want to throw an error or mark as undefined.
  return 'inactive'; 
};

const mapToOperator = (value: any): Operator => {
  const upperValue = typeof value === 'string' ? value.toUpperCase().trim() : '';
  if (upperValue === 'CLARO') return 'CLARO';
  if (upperValue === 'VIVO') return 'VIVO';
  // Defaulting to CLARO for invalid operator values.
  return 'CLARO'; 
};

const mapToCategory = (value: any): Category => {
  const upperValue = typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '_').trim() : '';
  if (upperValue === 'FOR_DELIVERY') return 'FOR_DELIVERY';
  if (upperValue === 'BANNED') return 'BANNED';
  if (upperValue === 'UNAVAILABLE_ACCESS') return 'UNAVAILABLE_ACCESS';
  // Defaulting for invalid category values.
  return 'FOR_DELIVERY'; 
};

export const parseExcelFile = (file: File): Promise<Partial<ChipData>[]> => {
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
        const chips: Partial<ChipData>[] = jsonData.map((row: any) => {
          const mappedChip: Partial<ChipData> = {};
          if (row.number !== undefined && row.number !== null) mappedChip.number = row.number.toString();
          if (row.status !== undefined && row.status !== null) mappedChip.status = mapToChipStatus(row.status);
          if (row.operator !== undefined && row.operator !== null) mappedChip.operator = mapToOperator(row.operator);
          if (row.category !== undefined && row.category !== null) mappedChip.category = mapToCategory(row.category);
          if (row.cid !== undefined && row.cid !== null) mappedChip.cid = row.cid.toString();
          return mappedChip;
        });

        resolve(chips);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}; 