import { Injectable } from '@angular/core';
import { AuthenticatedUser } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly tokenKey = 'agile-task-hub.access-token';
  private readonly userKey = 'agile-task-hub.user';

  getToken(): string | null {
    return this.storage()?.getItem(this.tokenKey) ?? null;
  }

  getUser(): AuthenticatedUser | null {
    const rawUser = this.storage()?.getItem(this.userKey);
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthenticatedUser;
    } catch {
      this.clear();
      return null;
    }
  }

  saveSession(token: string, user: AuthenticatedUser): void {
    this.storage()?.setItem(this.tokenKey, token);
    this.storage()?.setItem(this.userKey, JSON.stringify(user));
  }

  clear(): void {
    this.storage()?.removeItem(this.tokenKey);
    this.storage()?.removeItem(this.userKey);
  }

  hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    const expiration = this.readExpiration(token);
    if (expiration === null || expiration <= Math.floor(Date.now() / 1000)) {
      this.clear();
      return false;
    }

    return true;
  }

  private readExpiration(token: string): number | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(normalized)) as { exp?: unknown };
      return typeof decoded.exp === 'number' ? decoded.exp : null;
    } catch {
      this.clear();
      return null;
    }
  }

  private storage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }
}


