import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Task } from '@/types/kanban';
import { Button } from './ui/button';

interface ColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  color?: string;
  tasksCount: number;
  children?: React.ReactNode;
}

export const Column: React.FC<ColumnProps> = ({
  id,
  title,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  color,
  tasksCount,
  children
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex-1 flex flex-col min-w-[300px] max-w-[320px] bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className={`px-5 py-4 ${color} text-white flex items-center justify-between backdrop-blur-lg`}>
        <div className="flex items-center">
          <h3 className="font-medium">{title}</h3>
          <span className="ml-2 bg-white bg-opacity-30 text-white text-xs px-2 py-0.5 rounded-full">
            {tasksCount}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 max-h-full">
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {children || tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              onClick={() => onEditTask(task)}
            />
          ))}
        </SortableContext>
      </div>

      <button
        onClick={() => onAddTask()}
        className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Adicionar tarefa
      </button>
    </div>
  );
}; 