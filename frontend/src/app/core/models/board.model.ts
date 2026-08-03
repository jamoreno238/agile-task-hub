export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface ResponsibleUser {
  id: string;
  name: string;
  email: string;
}

export interface BoardTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  responsibleUserId: string | null;
  responsibleUser: ResponsibleUser | null;
  columnId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoardColumn {
  id: string;
  name: string;
  position: number;
  projectId: string;
  createdAt: string;
  tasks: BoardTask[];
}

export interface ProjectBoard {
  id: string;
  name: string;
  description: string;
  startDate: string;
  expectedEndDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  columns: BoardColumn[];
}

export interface ColumnSummary {
  id: string;
  name: string;
  position: number;
  projectId: string;
  createdAt: string;
}

export interface ColumnRequest {
  name: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  priority: TaskPriority;
  responsibleUserId: string | null;
  columnId: string;
}

export interface UpdateTaskRequest {
  title: string;
  description: string;
  priority: TaskPriority;
  responsibleUserId: string | null;
}

export interface TaskMoveRequest {
  columnId: string;
  targetIndex: number;
}
