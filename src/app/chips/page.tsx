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
import { AddChipModal } from '@/components/AddChipModal';
import { ImportChipsModal } from '@/components/ImportChipsModal';

export default function ChipsPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [chips, setChips] = useState<ChipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchChips = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chips', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch chips');
      
      const data = await response.json();
      
      const formattedChips: ChipData[] = data.map((chip: ChipData) => ({
        id: chip.id,
        number: chip.number,
        status: chip.status === 'active' ? 'active' as const : 'inactive' as const,
        operator: chip.operator,
        category: chip.category as Category,
        cid: chip.cid,
        createdAt: chip.createdAt ? new Date(chip.createdAt) : undefined,
        updatedAt: chip.updatedAt ? new Date(chip.updatedAt) : undefined
      }));
      
      setChips(formattedChips);
    } catch (error) {
      console.error('Error fetching chips:', error);
      toast.error('Falha ao carregar chips');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
    fetchChips();
  }, [fetchChips, router]);

  const handleExportExcel = () => {
    exportToExcel(chips);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedChips = await parseExcelFile(file);
      
      // Send to API
      const response = await fetch('/api/chips/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chips: importedChips }),
      });

      if (!response.ok) {
        throw new Error('Failed to import chips');
      }

      // Refresh the chips list
      await fetchChips();
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success('Chips importados com sucesso!');
    } catch (error) {
      toast.error('Falha ao importar chips');
      console.error(error);
    }
  };

  const handleDelete = (id: string) => {
    setChips(prevChips => prevChips.filter(chip => chip.id !== id));
  };

  const filteredChips = chips.filter(chip => 
    Object.values(chip).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

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
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
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
            <ChipTable chips={filteredChips} onDelete={handleDelete} />
          </div>
        </div>

        <AddChipModal 
          open={showAddForm} 
          onOpenChange={setShowAddForm}
          onSuccess={fetchChips}
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