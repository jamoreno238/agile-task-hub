import { TestBed } from '@angular/core/testing';
import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    service = TestBed.inject(TokenStorageService);
  });

  it('stores a session and recognizes a non-expired JWT', () => {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 300 }));
    service.saveSession(`header.${payload}.signature`, { id: '1', name: 'Admin', email: 'admin@example.com' });

    expect(service.hasValidToken()).toBeTrue();
    expect(service.getUser()?.email).toBe('admin@example.com');
  });

  it('clears an expired JWT', () => {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 1 }));
    service.saveSession(`header.${payload}.signature`, { id: '1', name: 'Admin', email: 'admin@example.com' });

    expect(service.hasValidToken()).toBeFalse();
    expect(service.getToken()).toBeNull();
  });
});
