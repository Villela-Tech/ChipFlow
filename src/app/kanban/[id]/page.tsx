'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { KanbanBoard } from '@/components/KanbanBoard';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Users, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { apiGet } from '@/lib/api';
import { Loading } from '@/components/ui/loading';

interface KanbanInfo {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function KanbanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [kanbanInfo, setKanbanInfo] = useState<KanbanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Verificar se o ID existe antes de buscar dados
      if (id && typeof id === 'string') {
        fetchKanbanInfo();
      } else {
        console.error('ID do kanban não encontrado:', id);
        toast.error('ID do kanban inválido');
        router.push('/kanban');
      }
    }
  }, [user, authLoading, id, router]);

  const fetchKanbanInfo = async () => {
    try {
      setLoading(true);
      
      // Verificação adicional do ID
      if (!id || typeof id !== 'string') {
        throw new Error('ID do kanban inválido');
      }
      
      // Tentar buscar informações específicas do kanban
      const response = await apiGet(`/api/kanbans/${id}/info`);
      
      if (response.ok) {
        const data = await response.json();
        setKanbanInfo(data);
        return;
      }
      
      // Se falhar, tentar buscar do endpoint principal
      const mainResponse = await apiGet(`/api/kanbans/${id}`);
      
      if (mainResponse.ok) {
        const kanbanData = await mainResponse.json();
        if (kanbanData.kanbanInfo) {
          setKanbanInfo(kanbanData.kanbanInfo);
          return;
        }
      }
      
      // Se tudo falhar, mostrar erro
      throw new Error('Kanban não encontrado');
      
    } catch (error) {
      console.error('Erro ao carregar informações do kanban:', error);
      toast.error('Erro ao carregar o kanban');
      router.push('/kanban');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <Loading />
        </div>
      </div>
    );
  }

  if (!user || !kanbanInfo) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header do Kanban */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/kanban')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{kanbanInfo.title}</h1>
                {kanbanInfo.description && (
                  <p className="text-gray-600 mt-1">{kanbanInfo.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Membros
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Atividades
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-hidden">
          <KanbanBoard kanbanId={id as string} />
        </div>
      </div>
    </div>
  );
} 