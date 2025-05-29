export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  content: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  assignee?: string;
  dueDate?: string;
  labels?: string[];
  checklist?: ChecklistItem[];
  columnId?: string;
}

export interface ColumnData {
  id: string;
  title: string;
  taskIds: string[];
  color?: string;
  limit?: number;
}

export interface KanbanData {
  tasks: {
    [key: string]: Task;
  };
  columns: {
    [key: string]: ColumnData;
  };
  columnOrder: string[];
} 