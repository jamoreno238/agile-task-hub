export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface BoardTask {
  id: string;
  title: string;
  priority: TaskPriority;
  assignee: string;
}
