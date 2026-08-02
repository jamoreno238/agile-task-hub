import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { appConfig } from '../config/app-config';
import { AuthenticatedUser, LoginRequest, LoginResponse } from '../models/auth.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${appConfig.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => this.tokenStorage.saveSession(response.accessToken, response.user))
    );
  }

  logout(): void {
    this.tokenStorage.clear();
  }

  isAuthenticated(): boolean {
    return this.tokenStorage.hasValidToken();
  }

  currentUser(): AuthenticatedUser | null {
    return this.tokenStorage.getUser();
  }
}
