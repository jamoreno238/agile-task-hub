import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { appConfig } from '../config/app-config';
import { PagedResult, Project, ProjectRequest } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${appConfig.apiUrl}/projects`;

  list(page: number, pageSize: number, search = ''): Observable<PagedResult<Project>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<PagedResult<Project>>(this.endpoint, { params });
  }

  getById(projectId: string): Observable<Project> {
    return this.http.get<Project>(`${this.endpoint}/${projectId}`);
  }

  create(request: ProjectRequest): Observable<Project> {
    return this.http.post<Project>(this.endpoint, request);
  }

  update(projectId: string, request: ProjectRequest): Observable<Project> {
    return this.http.put<Project>(`${this.endpoint}/${projectId}`, request);
  }

  delete(projectId: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${projectId}`);
  }
}
