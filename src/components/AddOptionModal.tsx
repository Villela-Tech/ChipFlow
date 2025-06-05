import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AddOptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (value: string) => void;
  title: string;
  type: 'operator' | 'category';
}

export function AddOptionModal({ open, onOpenChange, onSuccess, title, type }: AddOptionModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [value, setValue] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Aqui você pode adicionar a lógica para salvar no banco de dados
      // Por enquanto, vamos apenas simular um sucesso
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success(`${type === 'operator' ? 'Operadora' : 'Categoria'} adicionada com sucesso!`);
      onSuccess?.(value.toUpperCase());
      onOpenChange(false);
      setValue('');
    } catch (error) {
      toast.error(`Erro ao adicionar ${type === 'operator' ? 'operadora' : 'categoria'}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 bg-white">
        <DialogHeader className="px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-bold text-gray-900">
            {title}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="value" className="text-sm font-medium text-gray-700">
                Nome
              </Label>
              <Input
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Digite o nome da ${type === 'operator' ? 'operadora' : 'categoria'}`}
                className="h-10 text-base bg-white border-gray-200"
                required
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
  );
} 