import React from 'react';
import { ChipTable } from '@/components/ChipTable';
import { ChipData } from '@/types/chip';

// Sample data - this should be replaced with actual data from your backend
const sampleChips: ChipData[] = [
  {
    number: "(11) 99218-9865",
    status: "Indisponível",
    operator: "CLARO",
    category: "Acesso indisponível",
    cid: "89550531110023360000"
  },
  {
    number: "(51) 98035-5972",
    status: "Indisponível",
    operator: "VIVO",
    category: "Banido",
    cid: "89551097271072720000"
  },
  {
    number: "(51) 98059-2643",
    status: "Disponível",
    operator: "VIVO",
    category: "Para entrega"
  }
];

export default function ChipsPage() {
  const handleAddNew = () => {
    // Implement the add new functionality
    console.log('Add new chip clicked');
  };

  return (
    <div className="container mx-auto py-8">
      <ChipTable chips={sampleChips} onAddNew={handleAddNew} />
    </div>
  );
} 