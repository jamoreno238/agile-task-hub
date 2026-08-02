import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { appConfig } from '../config/app-config';
import { TokenStorageService } from '../services/token-storage.service';

let redirectInProgress = false;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);
  const isLoginRequest = request.url === `${appConfig.apiUrl}/auth/login`;
  const token = tokenStorage.getToken();
  const authorizedRequest = !isLoginRequest && token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error) => {
      if (error.status === 401 && !isLoginRequest) {
        tokenStorage.clear();
        if (!redirectInProgress) {
          redirectInProgress = true;
          void router.navigateByUrl('/login').finally(() => {
            redirectInProgress = false;
          });
        }
      }

      return throwError(() => error);
    })
  );
};
