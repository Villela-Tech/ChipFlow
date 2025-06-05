'use client';

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Upload, Search, Filter, Download, Plus } from 'lucide-react';
import { parseExcelFile, exportToExcel, downloadTemplate } from '@/lib/excel';
import { toast } from 'sonner';
import { ChipTable } from '@/components/ChipTable';
import { Input } from '@/components/ui/input';
import { ChipData, Category } from '@/types/chip';
import { ChipModal } from '@/components/ChipModal';
import { ImportChipsModal } from '@/components/ImportChipsModal';

export default function ChipsPage() {
  const [showModal, setShowModal] = useState(false);
  const [chips, setChips] = useState<ChipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChip, setSelectedChip] = useState<ChipData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    fetchChips();
  }, []);

  const fetchChips = async () => {
    try {
      const response = await fetch('/api/chips');
      if (!response.ok) {
        throw new Error('Falha ao carregar chips');
      }
      const data = await response.json();
      setChips(data);
    } catch (error) {
      toast.error('Erro ao carregar chips');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const updatedChips = chips.filter(chip => chip.id !== id);
    setChips(updatedChips);
  };

  const handleEdit = (chip: ChipData) => {
    setSelectedChip(chip);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setSelectedChip(null);
    setShowModal(true);
  };

  const handleImportClick = () => {
    setShowImportModal(true);
  };

  const handleExportExcel = async () => {
    try {
      await exportToExcel(chips);
      toast.success('Arquivo exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar arquivo');
      console.error(error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const chips = await parseExcelFile(file);
      const response = await fetch('/api/chips/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chips }),
      });

      if (!response.ok) {
        throw new Error('Falha ao importar chips');
      }

      toast.success('Chips importados com sucesso!');
      fetchChips();
    } catch (error) {
      toast.error('Erro ao importar chips');
      console.error(error);
    }
  };

  const filteredChips = chips.filter(chip => {
    const searchLower = searchTerm.toLowerCase();
    return (
      chip.number.toLowerCase().includes(searchLower) ||
      chip.status.toLowerCase().includes(searchLower) ||
      chip.operator.toLowerCase().includes(searchLower) ||
      chip.category.toLowerCase().includes(searchLower) ||
      (chip.cid && chip.cid.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1">
        <div className="container mx-auto py-6 px-4">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Controle de Chips</h1>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={downloadTemplate}
                  className="text-blue-500 border-blue-500 hover:bg-blue-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Modelo
                </Button>
                <Button 
                  onClick={handleAddNew}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Chip
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 w-full sm:max-w-md">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Buscar em todas as colunas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx,.xls"
                  className="hidden"
                />
                <Button variant="outline" className="flex items-center gap-2" onClick={handleImportClick}>
                  <Upload className="w-4 h-4" />
                  Importar
                </Button>
                <Button variant="outline" className="flex items-center gap-2" onClick={handleExportExcel}>
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <ChipTable 
              chips={filteredChips} 
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          </div>
        </div>

        <ChipModal 
          open={showModal} 
          onOpenChange={setShowModal}
          onSuccess={fetchChips}
          chipToEdit={selectedChip}
        />

        <ImportChipsModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImportComplete={fetchChips}
        />
      </main>
    </div>
  );
} 