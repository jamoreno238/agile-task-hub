import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { TokenStorageService } from '../services/token-storage.service';
import { appConfig } from '../config/app-config';
import { HttpClient } from '@angular/common/http';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let storage: TokenStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(TokenStorageService);
    storage.saveSession('test-token', { id: '1', name: 'Admin', email: 'admin@example.com' });
  });

  afterEach(() => controller.verify());

  it('adds the bearer token to protected requests', () => {
    http.get(`${appConfig.apiUrl}/projects`).subscribe();
    const request = controller.expectOne(`${appConfig.apiUrl}/projects`);

    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush({});
  });

  it('does not add a token to login and clears the session after 401', () => {
    http.post(`${appConfig.apiUrl}/auth/login`, {}).subscribe({ error: () => undefined });
    const request = controller.expectOne(`${appConfig.apiUrl}/auth/login`);
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush(null, { status: 401, statusText: 'Unauthorized' });

    http.get(`${appConfig.apiUrl}/projects`).subscribe({ error: () => undefined });
    const protectedRequest = controller.expectOne(`${appConfig.apiUrl}/projects`);
    protectedRequest.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(storage.getToken()).toBeNull();
  });
});





