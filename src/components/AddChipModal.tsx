import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChipData, ChipStatus, Category, Operator } from '@/types/chip';
import { toast } from 'sonner';

interface AddChipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddChipModal({ open, onOpenChange, onSuccess }: AddChipModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<ChipData>>({
    number: '',
    status: 'active',
    operator: 'CLARO',
    category: 'FOR_DELIVERY',
    cid: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/chips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Falha ao adicionar chip');
      }

      toast.success('Chip adicionado com sucesso!');
      onSuccess?.();
      onOpenChange(false);
      setFormData({
        number: '',
        status: 'active',
        operator: 'CLARO',
        category: 'FOR_DELIVERY',
        cid: ''
      });
    } catch (error) {
      toast.error('Erro ao adicionar chip');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Adicionar Novo Chip</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="number">Número</Label>
            <Input
              id="number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="Digite o número do chip"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: ChipStatus) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="operator">Operadora</Label>
            <Select
              value={formData.operator}
              onValueChange={(value: Operator) => setFormData({ ...formData, operator: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a operadora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLARO">CLARO</SelectItem>
                <SelectItem value="VIVO">VIVO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value: Category) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FOR_DELIVERY">Para entrega</SelectItem>
                <SelectItem value="BANNED">Banido</SelectItem>
                <SelectItem value="UNAVAILABLE_ACCESS">Acesso indisponível</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cid">CID</Label>
            <Input
              id="cid"
              value={formData.cid}
              onChange={(e) => setFormData({ ...formData, cid: e.target.value })}
              placeholder="Digite o CID"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 