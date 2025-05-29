'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { Column } from './Column';
import { TaskModal } from './TaskModal';
import { TaskCard } from './TaskCard';
import { toast } from 'sonner';
import { apiGet, apiPut } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Filter, MoreHorizontal, Search, SortAsc, Grid, List, ArrowLeft } from 'lucide-react';
import { Task, KanbanData } from '@/types/kanban';
import { Loading } from './ui/loading';

interface KanbanBoardProps {
  kanbanId: string;
}

const COLUMN_COLORS: { [key: string]: string } = {
  'A Fazer': 'bg-gradient-to-r from-blue-500 to-blue-600',
  'Em Progresso': 'bg-gradient-to-r from-green-500 to-green-600',
  'Concluído': 'bg-gradient-to-r from-orange-400 to-orange-500'
};

const PRIORITY_COLORS: { [key: string]: string } = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ kanbanId }) => {
  const [data, setData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    if (kanbanId && kanbanId !== 'undefined') {
      fetchKanbanData();
      
      // Configurar atualização automática a cada 30 segundos
      const intervalId = setInterval(fetchKanbanData, 30000);
      
      // Limpar o intervalo quando o componente for desmontado
      return () => clearInterval(intervalId);
    } else {
      console.error('KanbanId inválido:', kanbanId);
    }
  }, [kanbanId]);

  const fetchKanbanData = async () => {
    try {
      if (!kanbanId || kanbanId === 'undefined') {
        throw new Error('ID do kanban inválido');
      }
      
      setLoading(true);
      
      const response = await apiGet(`/api/kanbans/${kanbanId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar kanban');
      }
      
      const kanbanData = await response.json();
      
      // Adicionar cores às colunas baseado no título
      if (kanbanData.columns) {
        Object.keys(kanbanData.columns).forEach((columnId) => {
          const title = kanbanData.columns[columnId].title;
          kanbanData.columns[columnId].color = COLUMN_COLORS[title] || COLUMN_COLORS['A Fazer'];
        });
      }
      
      setData(kanbanData);
    } catch (error) {
      console.error('Erro ao carregar dados do kanban:', error);
      toast.error('Erro ao carregar o kanban');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskSave = async (updatedTask: Task) => {
    if (data) {
      try {
        const response = await fetch(`/api/kanbans/${kanbanId}/tasks`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            taskId: updatedTask.id,
            title: updatedTask.title,
            content: updatedTask.content,
            priority: updatedTask.priority,
            status: updatedTask.status,
            assignee: updatedTask.assignee,
            dueDate: updatedTask.dueDate,
            labels: updatedTask.labels,
            checklist: updatedTask.checklist,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar tarefa');
        }

        const newData = {
          ...data,
          tasks: {
            ...data.tasks,
            [updatedTask.id]: {
              ...data.tasks[updatedTask.id],
              ...updatedTask,
            },
          },
        };
        setData(newData);
        toast.success('Tarefa atualizada com sucesso!');
      } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        toast.error('Erro ao salvar alterações da tarefa');
      }
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (data) {
      try {
        const response = await fetch(`/api/kanbans/${kanbanId}/tasks`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ taskId }),
        });

        if (!response.ok) {
          throw new Error('Erro ao deletar tarefa');
        }

        const newTasks = { ...data.tasks };
        delete newTasks[taskId];
        
        const newColumns = { ...data.columns };
        Object.keys(newColumns).forEach(columnId => {
          newColumns[columnId] = {
            ...newColumns[columnId],
            taskIds: newColumns[columnId].taskIds.filter(id => id !== taskId),
          };
        });

        const newData = {
          ...data,
          tasks: newTasks,
          columns: newColumns,
        };
        
        setData(newData);
        toast.success('Tarefa excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        toast.error('Erro ao excluir a tarefa');
      }
    }
  };

  const addColumn = async () => {
    if (!newColumnTitle.trim()) return;

    try {
      const response = await fetch(`/api/kanbans/${kanbanId}/columns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ title: newColumnTitle.trim() }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar coluna');
      }

      const newColumn = await response.json();
      
      if (data) {
        const newData = {
          ...data,
          columns: {
            ...data.columns,
            [newColumn.id]: {
              id: newColumn.id,
              title: newColumn.title,
              taskIds: [],
              color: COLUMN_COLORS[newColumn.title] || COLUMN_COLORS['A Fazer'],
            },
          },
          columnOrder: [...data.columnOrder, newColumn.id],
        };
        setData(newData);
        toast.success('Nova fase criada com sucesso!');
        setNewColumnTitle('');
        setIsAddingColumn(false);
      }
    } catch (error) {
      console.error('Erro ao criar coluna:', error);
      toast.error('Erro ao criar a nova fase');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    if (data?.tasks[active.id as string]) {
      setActiveTask(data.tasks[active.id as string]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !data) return;

    const activeColumnId = Object.keys(data.columns).find(columnId =>
      data.columns[columnId].taskIds.includes(active.id as string)
    );

    const overColumnId = over.id as string;

    if (!activeColumnId) return;

    if (activeColumnId !== overColumnId) {
      const activeColumn = data.columns[activeColumnId];
      const overColumn = data.columns[overColumnId];

      const activeTaskIds = [...activeColumn.taskIds];
      const overTaskIds = [...overColumn.taskIds];

      const oldIndex = activeTaskIds.indexOf(active.id as string);
      activeTaskIds.splice(oldIndex, 1);

      const newIndex = overTaskIds.length;
      overTaskIds.push(active.id as string);

      const newData = {
        ...data,
        columns: {
          ...data.columns,
          [activeColumnId]: {
            ...activeColumn,
            taskIds: activeTaskIds,
          },
          [overColumnId]: {
            ...overColumn,
            taskIds: overTaskIds,
          },
        },
      };

      setData(newData);
      updateKanbanData(newData);
      toast.success(`Tarefa movida para "${overColumn.title}"`);
    }

    setActiveId(null);
    setActiveTask(null);
  };

  const updateKanbanData = async (newData: KanbanData) => {
    try {
      const response = await apiPut(`/api/kanbans/${kanbanId}`, newData);
      if (!response.ok) {
        throw new Error('Erro ao atualizar kanban');
      }
    } catch (error) {
      console.error('Erro ao atualizar kanban:', error);
      toast.error('Erro ao salvar alterações');
      fetchKanbanData();
    }
  };

  if (loading || !data) {
    return <Loading />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-md backdrop-blur-sm bg-white/90">
        <div className="flex items-center justify-between px-8 py-4">
          <div className="flex items-center">
            <button className="flex items-center text-gray-500 hover:text-blue-500 transition-colors cursor-pointer">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>Voltar</span>
            </button>
            <div className="ml-6 pl-6 border-l border-gray-200">
              <h1 className="text-xl font-semibold text-gray-800">Projeto Kanban</h1>
              <p className="text-sm text-gray-500">Visão</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <i className="fas fa-users mr-2"></i>
              <span>Membros</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <i className="fas fa-history mr-2"></i>
              <span>Atividades</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <i className="fas fa-cog mr-2"></i>
              <span>Configurações</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 px-8 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar tarefas..."
                className="pl-10 pr-4 py-2.5 w-72 bg-gray-50 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <SortAsc className="w-4 h-4" />
              Ordenar
            </Button>
          </div>

          <div className="flex items-center">
            {isAddingColumn ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="Nome da nova fase..."
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && addColumn()}
                />
                <Button
                  onClick={addColumn}
                  disabled={!newColumnTitle.trim()}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Adicionar
                </Button>
                <Button
                  onClick={() => {
                    setIsAddingColumn(false);
                    setNewColumnTitle('');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsAddingColumn(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Nova Fase
              </Button>
            )}

            <div className="flex items-center ml-4 text-sm text-gray-500">
              <span>{data ? Object.keys(data.columns).length : 0} colunas</span>
              <span className="mx-2">•</span>
              <span>{data ? Object.keys(data.tasks).length : 0} Tarefas</span>
            </div>

            <div className="flex ml-4">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Grid className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-[calc(100vh-12rem)] justify-center items-start min-h-[600px]">
            {data?.columnOrder.map((columnId) => {
              const column = data.columns[columnId];
              const columnTasks = column.taskIds.reduce((acc, taskId) => {
                const task = data.tasks[taskId];
                if (task) {
                  if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
                      !(task.content && task.content.toLowerCase().includes(searchTerm.toLowerCase()))) {
                    return acc;
                  }
                  acc[taskId] = task;
                }
                return acc;
              }, {} as { [key: string]: Task });

              return (
                <div key={column.id} className="flex-1 flex flex-col min-w-[300px] max-w-[320px] bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl">
                  <div className={`px-5 py-4 ${column.color} text-white flex items-center justify-between backdrop-blur-lg`}>
                    <div className="flex items-center">
                      <h3 className="font-medium">{column.title}</h3>
                      <span className="ml-2 bg-white bg-opacity-30 text-white text-xs px-2 py-0.5 rounded-full">
                        {Object.keys(columnTasks).length}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 max-h-full">
                    <SortableContext items={column.taskIds}>
                      <Column
                        id={column.id}
                        title={column.title}
                        tasks={Object.values(columnTasks)}
                        onAddTask={() => setIsAddingTask(true)}
                        onEditTask={handleTaskClick}
                        onDeleteTask={handleTaskDelete}
                      />
                    </SortableContext>
                  </div>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeId && activeTask ? (
              <div className="transform-none">
                <TaskCard
                  task={activeTask}
                  index={0}
                  onClick={() => {}}
                  isDragging
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
      />
    </div>
  );
}; 