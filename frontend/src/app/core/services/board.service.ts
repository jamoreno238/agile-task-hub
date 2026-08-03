import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../config/app-config';
import {
  BoardColumn,
  BoardTask,
  ColumnRequest,
  ColumnSummary,
  CreateTaskRequest,
  ProjectBoard,
  TaskMoveRequest,
  UpdateTaskRequest
} from '../models/board.model';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly http = inject(HttpClient);
  private readonly projectsEndpoint = `${appConfig.apiUrl}/projects`;

  getBoard(projectId: string): Observable<ProjectBoard> {
    return this.http.get<ProjectBoard>(`${this.projectsEndpoint}/${projectId}/board`);
  }

  getColumns(projectId: string): Observable<ColumnSummary[]> {
    return this.http.get<ColumnSummary[]>(`${this.projectsEndpoint}/${projectId}/columns`);
  }

  createColumn(projectId: string, request: ColumnRequest): Observable<ColumnSummary> {
    return this.http.post<ColumnSummary>(`${this.projectsEndpoint}/${projectId}/columns`, request);
  }

  updateColumn(projectId: string, columnId: string, request: ColumnRequest): Observable<ColumnSummary> {
    return this.http.put<ColumnSummary>(`${this.projectsEndpoint}/${projectId}/columns/${columnId}`, request);
  }

  deleteColumn(projectId: string, columnId: string): Observable<void> {
    return this.http.delete<void>(`${this.projectsEndpoint}/${projectId}/columns/${columnId}`);
  }

  reorderColumns(projectId: string, columnIds: string[]): Observable<ColumnSummary[]> {
    return this.http.patch<ColumnSummary[]>(`${this.projectsEndpoint}/${projectId}/columns/reorder`, { columnIds });
  }

  createTask(projectId: string, request: CreateTaskRequest): Observable<BoardTask> {
    return this.http.post<BoardTask>(`${this.projectsEndpoint}/${projectId}/tasks`, request);
  }

  updateTask(projectId: string, taskId: string, request: UpdateTaskRequest): Observable<BoardTask> {
    return this.http.put<BoardTask>(`${this.projectsEndpoint}/${projectId}/tasks/${taskId}`, request);
  }

  deleteTask(projectId: string, taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.projectsEndpoint}/${projectId}/tasks/${taskId}`);
  }

  moveTask(projectId: string, taskId: string, request: TaskMoveRequest): Observable<ProjectBoard> {
    return this.http.patch<ProjectBoard>(`${this.projectsEndpoint}/${projectId}/tasks/${taskId}/move`, request);
  }

  sortTasksByPriority(projectId: string, columnId: string): Observable<BoardTask[]> {
    return this.http.patch<BoardTask[]>(
      `${this.projectsEndpoint}/${projectId}/columns/${columnId}/tasks/sort-by-priority`,
      {}
    );
  }
}
