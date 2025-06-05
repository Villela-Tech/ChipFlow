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
  closestCenter,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Column } from './Column';
import { TaskModal } from './TaskModal';
import { TaskCard } from './TaskCard';
import { toast } from 'sonner';
import { apiGet, apiPut } from '@/lib/api';
import { Button } from './ui/button';
import { Plus, Filter, MoreHorizontal, Search, SortAsc, Grid, List, ArrowLeft, Clock, Settings } from 'lucide-react';
import { Task, KanbanData } from '@/types/kanban';
import { Loading } from './ui/loading';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
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
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showActivities, setShowActivities] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
      fetchKanbanData(true);
      
      // Configurar atualização automática a cada 30 segundos
      const intervalId = setInterval(() => fetchKanbanData(false), 30000);
      
      // Limpar o intervalo quando o componente for desmontado
      return () => clearInterval(intervalId);
    } else {
      console.error('KanbanId inválido:', kanbanId);
    }
  }, [kanbanId]);

  const fetchKanbanData = async (isInitialFetch: boolean) => {
    try {
      if (!kanbanId || kanbanId === 'undefined') {
        throw new Error('ID do kanban inválido');
      }
      
      if (isInitialFetch) {
        setInitialLoading(true);
      } else {
        setIsUpdating(true);
      }
      
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
      if (isInitialFetch) {
        toast.error('Erro ao carregar o kanban');
      }
    } finally {
      if (isInitialFetch) {
        setInitialLoading(false);
      } else {
        setIsUpdating(false);
      }
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

    // Handle column reordering
    if (active.id in data.columns && over.id in data.columns) {
      const oldIndex = data.columnOrder.indexOf(active.id as string);
      const newIndex = data.columnOrder.indexOf(over.id as string);

      if (oldIndex !== newIndex) {
        const newColumnOrder = arrayMove(data.columnOrder, oldIndex, newIndex);
        const newData = {
          ...data,
          columnOrder: newColumnOrder,
        };
        setData(newData);
        updateKanbanData(newData);
        return;
      }
    }

    // Handle task movement between columns
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
      fetchKanbanData(true);
    }
  };

  const filterTasks = (tasks: { [key: string]: Task }) => {
    return Object.entries(tasks).reduce((filtered, [taskId, task]) => {
      let matchesSearch = true;
      let matchesPriority = true;
      let matchesStatus = true;

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(searchLower);
        const contentMatch = task.content?.toLowerCase().includes(searchLower) || false;
        matchesSearch = titleMatch || contentMatch;
      }

      // Priority filter
      if (filterPriority !== 'all') {
        matchesPriority = task.priority === filterPriority;
      }

      // Status filter
      if (filterStatus !== 'all') {
        matchesStatus = task.status === filterStatus;
      }

      if (matchesSearch && matchesPriority && matchesStatus) {
        filtered[taskId] = task;
      }

      return filtered;
    }, {} as { [key: string]: Task });
  };

  const filteredTasks = data ? filterTasks(data.tasks) : {};

  if (initialLoading || !data) {
    return <Loading />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-md backdrop-blur-sm bg-white/90 relative">
        {isUpdating && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500/20">
            <div className="h-full w-1/3 bg-blue-500 animate-[slide-right_1s_ease-in-out_infinite]" />
          </div>
        )}
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
            {/* Atividades Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Atividades</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Atividades do Kanban</SheetTitle>
                  <SheetDescription>
                    Histórico de atividades e alterações
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Nova tarefa adicionada</p>
                        <p className="text-xs text-gray-500">Há 5 minutos</p>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Configurações Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>Configurações</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Configurações do Kanban</SheetTitle>
                  <SheetDescription>
                    Ajuste as configurações do seu quadro
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Limite de Tarefas por Coluna</h3>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Número máximo de tarefas"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-2">Visualização</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Grid className="w-4 h-4" />
                        Grade
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <List className="w-4 h-4" />
                        Lista
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
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

            {/* Filtros Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                  <SheetDescription>
                    Filtre as tarefas por diferentes critérios
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Prioridade</h3>
                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Status</h3>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="todo">A Fazer</SelectItem>
                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                        <SelectItem value="done">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

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
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          collisionDetection={closestCenter}
        >
          <div className="flex gap-6 h-[calc(100vh-12rem)] justify-center items-start min-h-[600px]">
            <SortableContext items={data.columnOrder} strategy={horizontalListSortingStrategy}>
              {data?.columnOrder.map((columnId) => {
                const column = data.columns[columnId];
                const columnTasks = column.taskIds.reduce((acc, taskId) => {
                  const task = filteredTasks[taskId];
                  if (task) {
                    acc[taskId] = task;
                  }
                  return acc;
                }, {} as { [key: string]: Task });

                return (
                  <Column
                    key={column.id}
                    id={column.id}
                    title={column.title}
                    tasks={Object.values(columnTasks)}
                    onAddTask={() => setIsAddingTask(true)}
                    onEditTask={handleTaskClick}
                    onDeleteTask={handleTaskDelete}
                    color={column.color}
                    tasksCount={Object.keys(columnTasks).length}
                  />
                );
              })}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeId && activeTask ? (
              <div className="transform-none">
                <TaskCard
                  task={activeTask}
                  index={0}
                  onClick={() => {}}
                  isDragging={true}
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