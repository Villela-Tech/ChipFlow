import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';
import { Task } from '@/types/kanban';

interface ColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  children?: React.ReactNode;
}

export const Column: React.FC<ColumnProps> = ({
  id,
  title,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  children
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div className="h-full">
      <div
        ref={setNodeRef}
        className={`min-h-[200px] space-y-3 transition-all duration-200 rounded-lg p-2 ${
          isOver
            ? 'bg-blue-50/90 ring-2 ring-blue-200 shadow-inner scale-[1.02]'
            : 'bg-transparent'
        }`}
      >
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