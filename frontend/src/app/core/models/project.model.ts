export type ProjectStatus = 'Planned' | 'Active' | 'Completed' | 'Cancelled';

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  dueDate: string;
  members: number;
}
