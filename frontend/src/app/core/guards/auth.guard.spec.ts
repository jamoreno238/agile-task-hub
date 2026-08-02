import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { TokenStorageService } from '../services/token-storage.service';

describe('authGuard', () => {
  beforeEach(() => localStorage.clear());
  it('returns the login UrlTree without a valid token', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toEqual(TestBed.inject(Router).parseUrl('/login'));
  });

  it('allows navigation with a valid token', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const storage = TestBed.inject(TokenStorageService);
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 300 }));
    storage.saveSession(`header.${payload}.signature`, { id: '1', name: 'Admin', email: 'admin@example.com' });

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBeTrue();
  });
});

