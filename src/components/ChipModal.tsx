'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChipData, ChipStatus, Category, Operator } from '@/types/chip';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AddOptionModal } from './AddOptionModal';

interface ChipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  chipToEdit?: ChipData | null;
}

export function ChipModal({ open, onOpenChange, onSuccess, chipToEdit }: ChipModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [showAddOperator, setShowAddOperator] = React.useState(false);
  const [showAddCategory, setShowAddCategory] = React.useState(false);
  const [operators, setOperators] = React.useState<Operator[]>(['CLARO', 'VIVO']);
  const [categories, setCategories] = React.useState<Category[]>(['FOR_DELIVERY', 'BANNED', 'UNAVAILABLE_ACCESS']);
  const [formData, setFormData] = React.useState<Partial<ChipData>>({
    number: '',
    status: 'active',
    operator: 'CLARO',
    category: 'FOR_DELIVERY',
    cid: ''
  });

  React.useEffect(() => {
    if (chipToEdit) {
      setFormData(chipToEdit);
    } else {
      setFormData({
        number: '',
        status: 'active',
        operator: 'CLARO',
        category: 'FOR_DELIVERY',
        cid: ''
      });
    }
  }, [chipToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = chipToEdit ? `/api/chips/${chipToEdit.id}` : '/api/chips';
      const method = chipToEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(chipToEdit ? 'Falha ao atualizar chip' : 'Falha ao adicionar chip');
      }

      toast.success(chipToEdit ? 'Chip atualizado com sucesso!' : 'Chip adicionado com sucesso!');
      onSuccess?.();
      onOpenChange(false);
      if (!chipToEdit) {
        setFormData({
          number: '',
          status: 'active',
          operator: 'CLARO',
          category: 'FOR_DELIVERY',
          cid: ''
        });
      }
    } catch (error) {
      toast.error(chipToEdit ? 'Erro ao atualizar chip' : 'Erro ao adicionar chip');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOperator = (newOperator: string) => {
    const operator = newOperator as Operator;
    setOperators(prev => [...prev, operator]);
    setFormData(prev => ({ ...prev, operator }));
  };

  const handleAddCategory = (newCategory: string) => {
    const category = newCategory as Category;
    setCategories(prev => [...prev, category]);
    setFormData(prev => ({ ...prev, category }));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] p-0 bg-white">
          <DialogHeader className="px-6 py-4 border-b border-gray-100">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {chipToEdit ? 'Editar Chip' : 'Adicionar Novo Chip'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="grid gap-6">
              {/* Número do Chip */}
              <div className="space-y-2">
                <Label htmlFor="number" className="text-sm font-medium text-gray-700">
                  Número do Chip
                </Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="Digite o número do chip"
                  className="h-10 text-base bg-white border-gray-200"
                  required
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ChipStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="h-10 text-base bg-white border-gray-200">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="active">
                      <span className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        Ativo
                      </span>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <span className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                        Inativo
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Operadora */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="operator" className="text-sm font-medium text-gray-700">
                    Operadora
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddOperator(true)}
                    className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Operadora
                  </Button>
                </div>
                <Select
                  value={formData.operator}
                  onValueChange={(value: Operator) => setFormData({ ...formData, operator: value })}
                >
                  <SelectTrigger className="h-10 text-base bg-white border-gray-200">
                    <SelectValue placeholder="Selecione a operadora" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {operators.map((op) => (
                      <SelectItem key={op} value={op}>
                        <span className="font-medium text-gray-700">{op}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Categoria
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddCategory(true)}
                    className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Categoria
                  </Button>
                </div>
                <Select
                  value={formData.category}
                  onValueChange={(value: Category) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="h-10 text-base bg-white border-gray-200">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        <span className="flex items-center">
                          <span className={`h-2 w-2 rounded-full mr-2 ${
                            cat === 'FOR_DELIVERY'
                              ? 'bg-blue-500'
                              : cat === 'BANNED'
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
                          }`}></span>
                          {cat === 'FOR_DELIVERY'
                            ? 'Para entrega'
                            : cat === 'BANNED'
                            ? 'Banido'
                            : cat === 'UNAVAILABLE_ACCESS'
                            ? 'Acesso indisponível'
                            : cat}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* CID */}
              <div className="space-y-2">
                <Label htmlFor="cid" className="text-sm font-medium text-gray-700">
                  CID
                </Label>
                <Input
                  id="cid"
                  value={formData.cid}
                  onChange={(e) => setFormData({ ...formData, cid: e.target.value })}
                  placeholder="Digite o CID"
                  className="h-10 text-base bg-white border-gray-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="min-w-[100px] bg-white hover:bg-gray-50 border-gray-200"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AddOptionModal
        open={showAddOperator}
        onOpenChange={setShowAddOperator}
        onSuccess={handleAddOperator}
        title="Nova Operadora"
        type="operator"
      />

      <AddOptionModal
        open={showAddCategory}
        onOpenChange={setShowAddCategory}
        onSuccess={handleAddCategory}
        title="Nova Categoria"
        type="category"
      />
    </>
  );
} 