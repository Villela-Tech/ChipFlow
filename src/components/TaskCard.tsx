'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User, Tag, CheckSquare, Clock, AlertCircle, MoreHorizontal } from 'lucide-react';
import { Task } from '@/types/kanban';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: () => void;
  isDragging?: boolean;
}

const PRIORITY_COLORS = {
  low: 'border-l-gray-400 bg-gray-50',
  medium: 'border-l-blue-400 bg-blue-50',
  high: 'border-l-yellow-400 bg-yellow-50',
  urgent: 'border-l-red-400 bg-red-50',
};

const PRIORITY_ICONS = {
  low: 'text-gray-500',
  medium: 'text-blue-500',
  high: 'text-yellow-500',
  urgent: 'text-red-500',
};

const STATUS_COLORS = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  review: 'bg-yellow-100 text-yellow-800',
  done: 'bg-green-100 text-green-800',
};

const STATUS_LABELS = {
  todo: 'A Fazer',
  in_progress: 'Em Progresso',
  review: 'Em Revisão',
  done: 'Concluído',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCurrentlyDragging = isDragging || isSortableDragging;

  const priorityColor = task.priority ? PRIORITY_COLORS[task.priority] : PRIORITY_COLORS.medium;
  const priorityIcon = task.priority ? PRIORITY_ICONS[task.priority] : PRIORITY_ICONS.medium;
  
  const completedItems = task.checklist?.filter(item => item.completed).length || 0;
  const totalItems = task.checklist?.length || 0;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const isDueSoon = task.dueDate && !isOverdue && 
    new Date(task.dueDate).getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white border border-gray-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing ${
        isCurrentlyDragging
          ? 'shadow-xl ring-2 ring-blue-200 rotate-1 scale-105 opacity-90 z-50'
          : 'hover:shadow hover:-translate-y-1 transition-all duration-200'
      }`}
      onClick={onClick}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium px-2 py-0.5 ${
            task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
            task.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
            task.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          } rounded-full`}>
            {task.priority || 'Baixa'}
          </span>
          <span className="text-xs text-gray-500">
            {task.dueDate || 'Sem data'}
          </span>
        </div>
        <h4 className="font-medium mb-2">{task.title}</h4>
        {task.content && (
          <p className="text-sm text-gray-600 mb-3">{task.content}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {task.assignee && (
              <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                {task.assignee.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            {task.checklist && task.checklist.length > 0 && (
              <>
                <i className="fas fa-check-square mr-1"></i>
                <span>{task.checklist.filter(item => item.completed).length}/{task.checklist.length}</span>
              </>
            )}
            {task.labels && task.labels.length > 0 && (
              <>
                <i className="fas fa-tag ml-3 mr-1"></i>
                <span>{task.labels.length}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 