'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { parseExcelFile } from '@/lib/excel';
import { toast } from 'sonner';

interface ChipData {
  id?: string;
  number: string;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  operator: 'CLARO' | 'VIVO';
  category: 'UNAVAILABLE_ACCESS' | 'BANNED' | 'FOR_DELIVERY';
  cid?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function ChipsPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [chips, setChips] = useState<ChipData[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [newChip, setNewChip] = useState<ChipData>({
    number: '',
    status: 'AVAILABLE',
    operator: 'CLARO',
    category: 'FOR_DELIVERY'
  });

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Carregar chips
    fetchChips();
  }, []);

  const fetchChips = async () => {
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
      setChips(data);
    } catch (error) {
      console.error(error);
      toast.error('Falha ao carregar chips');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newChip),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) throw new Error('Failed to add chip');

      const savedChip = await response.json();
      setChips(prev => [...prev, savedChip]);
      setShowAddForm(false);
      setNewChip({
        number: '',
        status: 'AVAILABLE',
        operator: 'CLARO',
        category: 'FOR_DELIVERY'
      });
      toast.success('Chip adicionado com sucesso!');
    } catch (error) {
      toast.error('Falha ao adicionar chip');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const chips = await parseExcelFile(file);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chips/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ chips }),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) throw new Error('Failed to import chips');

      const savedChips = await response.json();
      setChips(prev => [...prev, ...savedChips]);
      toast.success('Chips importados com sucesso!');
    } catch (error) {
      toast.error('Falha ao importar chips');
      console.error(error);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Chips</h1>
            <div className="flex gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls"
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-500 hover:bg-green-600"
                disabled={loading}
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar Excel
              </Button>
              <Button 
                onClick={() => setShowAddForm(true)} 
                className="bg-blue-500 hover:bg-blue-600"
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Novo Chip
              </Button>
            </div>
          </div>

          {showAddForm && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
              <h2 className="text-xl font-semibold mb-6">Adicionar Novo Chip</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número
                    </label>
                    <input
                      type="text"
                      value={newChip.number}
                      onChange={(e) => setNewChip({ ...newChip, number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={newChip.status}
                      onChange={(e) => setNewChip({ ...newChip, status: e.target.value as 'AVAILABLE' | 'UNAVAILABLE' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="AVAILABLE">Disponível</option>
                      <option value="UNAVAILABLE">Indisponível</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operadora
                    </label>
                    <select
                      value={newChip.operator}
                      onChange={(e) => setNewChip({ ...newChip, operator: e.target.value as 'CLARO' | 'VIVO' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="CLARO">CLARO</option>
                      <option value="VIVO">VIVO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <select
                      value={newChip.category}
                      onChange={(e) => setNewChip({ ...newChip, category: e.target.value as 'UNAVAILABLE_ACCESS' | 'BANNED' | 'FOR_DELIVERY' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="FOR_DELIVERY">Para entrega</option>
                      <option value="UNAVAILABLE_ACCESS">Acesso indisponível</option>
                      <option value="BANNED">Banido</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CID (opcional)
                    </label>
                    <input
                      type="text"
                      value={newChip.cid || ''}
                      onChange={(e) => setNewChip({ ...newChip, cid: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite o CID"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-blue-500 hover:bg-blue-600"
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Números
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operadora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chips.map((chip) => (
                  <tr key={chip.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {chip.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        chip.status === 'AVAILABLE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {chip.status === 'AVAILABLE' ? 'Disponível' : 'Indisponível'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        chip.operator === 'CLARO'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {chip.operator}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        chip.category === 'FOR_DELIVERY'
                          ? 'bg-green-100 text-green-800'
                          : chip.category === 'BANNED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {chip.category === 'FOR_DELIVERY' 
                          ? 'Para entrega' 
                          : chip.category === 'BANNED'
                          ? 'Banido'
                          : 'Acesso indisponível'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {chip.cid || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
} 