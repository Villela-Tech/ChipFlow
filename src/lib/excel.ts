import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ChipData } from '@/types/chip';

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
        const chips = jsonData.map((row: any) => ({
          number: row.number?.toString() || '',
          status: row.status === 'active' ? 'active' : 'inactive',
          operator: row.operator === 'CLARO' ? 'CLARO' : 'VIVO',
          category: row.category || 'FOR_DELIVERY',
          cid: row.cid?.toString() || ''
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