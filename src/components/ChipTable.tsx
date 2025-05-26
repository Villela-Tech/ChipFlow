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
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChipTableProps {
  chips: ChipData[];
  onDelete?: (id: string) => void;
}

export function ChipTable({ chips, onDelete }: ChipTableProps) {
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este chip?')) {
      return;
    }

    try {
      const response = await fetch(`/api/chips/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir o chip');
      }

      toast.success('Chip excluído com sucesso!');
      if (onDelete) {
        onDelete(id);
      }
    } catch (error) {
      toast.error('Erro ao excluir o chip');
      console.error(error);
    }
  };

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg shadow">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b border-gray-200">
            <TableHead className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Número</TableHead>
            <TableHead className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Status</TableHead>
            <TableHead className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Operadora</TableHead>
            <TableHead className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Categoria</TableHead>
            <TableHead className="py-4 px-6 text-left text-sm font-semibold text-gray-900">CID</TableHead>
            <TableHead className="py-4 px-6 text-left text-sm font-semibold text-gray-900">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chips.map((chip, index) => (
            <TableRow 
              key={chip.number + index}
              className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              }`}
            >
              <TableCell className="py-4 px-6 text-sm font-medium text-gray-900">{chip.number}</TableCell>
              <TableCell className="py-4 px-6">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  chip.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {chip.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </TableCell>
              <TableCell className="py-4 px-6">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  chip.operator === 'CLARO'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {chip.operator}
                </span>
              </TableCell>
              <TableCell className="py-4 px-6">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  chip.category === 'FOR_DELIVERY'
                    ? 'bg-blue-100 text-blue-800'
                    : chip.category === 'BANNED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {chip.category === 'FOR_DELIVERY' ? 'Para Entrega' :
                   chip.category === 'BANNED' ? 'Banido' : 'Acesso Indisponível'}
                </span>
              </TableCell>
              <TableCell className="py-4 px-6 text-sm text-gray-500">{chip.cid || '-'}</TableCell>
              <TableCell className="py-4 px-6">
                <button
                  onClick={() => chip.id && handleDelete(chip.id)}
                  className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                  title="Excluir chip"
                >
                  <Trash2 size={18} />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 