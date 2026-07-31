import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfig, appConfig } from '../config/app-config';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  readonly config: AppConfig = appConfig;

  get health() {
    return this.http.get<{ status: string }>(`${this.config.apiUrl}/health`);
  }
}
