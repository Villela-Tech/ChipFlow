import React from 'react';
import { ChipData } from '../types/chip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';

interface ChipTableProps {
  chips: ChipData[];
  onAddNew: () => void;
}

export function ChipTable({ chips, onAddNew }: ChipTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lista de Chips</h2>
        <Button onClick={onAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Novo
        </Button>
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Números</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Operadora</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>CID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chips.map((chip) => (
              <TableRow key={chip.number}>
                <TableCell>{chip.number}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    chip.status === 'Disponível' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {chip.status}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    chip.operator === 'CLARO'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {chip.operator}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    chip.category === 'Para entrega'
                      ? 'bg-green-100 text-green-800'
                      : chip.category === 'Banido'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {chip.category}
                  </span>
                </TableCell>
                <TableCell>{chip.cid || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 