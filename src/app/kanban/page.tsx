'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, BarChart3, Users } from 'lucide-react';
import { NewKanbanModal } from '@/components/NewKanbanModal';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/api';
import { Loading } from '@/components/ui/loading';

interface Kanban {
  id: string;
  title: string;
  description: string | null;
  columnsCount: number;
  tasksCount: number;
}

export default function KanbanPage() {
  const router = useRouter();
  const [showNewKanbanModal, setShowNewKanbanModal] = useState(false);
  const [kanbans, setKanbans] = useState<Kanban[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    console.log('KanbanPage: useEffect triggered', { authLoading, user: user?.email });
    
    if (!authLoading) {
      if (!user) {
        console.log('KanbanPage: No user found, redirecting to login');
        router.push('/login');
        return;
      }
      console.log('KanbanPage: User authenticated, fetching kanbans');
      fetchKanbans();
    }
  }, [user, authLoading, router]);

  const fetchKanbans = async () => {
    try {
      console.log('KanbanPage: Starting to fetch kanbans...');
      const response = await apiGet('/api/kanbans');
      console.log('KanbanPage: API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('KanbanPage: Received data:', data);
      setKanbans(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('KanbanPage: Error loading kanbans:', error);
      toast.error('Erro ao carregar os kanbans');
      setKanbans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKanban = async (title: string, description: string) => {
    try {
      console.log('KanbanPage: Creating kanban:', { title, description });
      const response = await apiPost('/api/kanbans', { 
        title, 
        description, 
        columns: ['A fazer', 'Em progresso', 'Concluído']
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar kanban');
      }
      
      const newKanban = await response.json() as Kanban;
      console.log('KanbanPage: Kanban created:', newKanban);
      
      setKanbans(prevKanbans => [...prevKanbans, newKanban]);
      toast.success('Kanban criado com sucesso!');
      setShowNewKanbanModal(false);
      
      // Verificar se o ID é válido antes de redirecionar
      if (newKanban.id && newKanban.id !== 'undefined') {
        router.push(`/kanban/${newKanban.id}`);
      } else {
        console.error('KanbanPage: Invalid kanban ID received:', newKanban.id);
        toast.error('Erro: ID do kanban inválido');
      }
    } catch (error) {
      console.error('KanbanPage: Error creating kanban:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar o kanban');
    }
  };

  const handleOpenKanban = (kanbanId: string) => {
    console.log('KanbanPage: Opening kanban:', kanbanId);
    router.push(`/kanban/${kanbanId}`);
  };

  if (authLoading || loading) {
    console.log('KanbanPage: Showing loading state', { authLoading, loading });
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <Loading message="Carregando kanbans..." submessage="Buscando seus projetos" />
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('KanbanPage: No user, returning null');
    return null; // useAuth will handle redirect
  }

  console.log('KanbanPage: Rendering main content with', kanbans.length, 'kanbans');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Meus Kanbans</h1>
              <p className="text-gray-600 mt-2">Gerencie seus projetos de forma visual e eficiente</p>
            </div>
            <Button 
              onClick={() => setShowNewKanbanModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Kanban
            </Button>
          </div>

          {/* Estatísticas rápidas */}
          {kanbans.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Kanbans</p>
                    <p className="text-2xl font-bold text-gray-900">{kanbans.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Tarefas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {kanbans.reduce((total, kanban) => total + kanban.tasksCount, 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Fases Ativas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {kanbans.reduce((total, kanban) => total + kanban.columnsCount, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Kanbans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kanbans.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="max-w-sm mx-auto">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum kanban encontrado</h3>
                  <p className="text-gray-500 mb-6">Crie seu primeiro kanban para começar a organizar suas tarefas</p>
                  <Button 
                    onClick={() => setShowNewKanbanModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Criar Primeiro Kanban
                  </Button>
                </div>
              </div>
            ) : (
              kanbans.map((kanban) => (
                <div 
                  key={kanban.id} 
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => handleOpenKanban(kanban.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {kanban.title}
                    </h3>
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                  
                  {kanban.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{kanban.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        {kanban.columnsCount} fases
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {kanban.tasksCount} tarefas
                      </span>
                    </div>
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenKanban(kanban.id);
                      }}
                    >
                      Abrir
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <NewKanbanModal
            isOpen={showNewKanbanModal}
            onClose={() => setShowNewKanbanModal(false)}
            onCreateKanban={handleCreateKanban}
          />
        </div>
      </div>
    </div>
  );
} 