import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

/**
 * Adiciona credentials em todas as requisições e trata o 401 redirecionando ao login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. CLONA a requisição injetando o withCredentials para o cookie transitar entre domínios
  const authenticatedReq = req.clone({
    withCredentials: true
  });

  // 2. Passa a requisição modificada adiante
  return next(authenticatedReq).pipe(
    catchError((err: unknown) => {
      const unauthenticated = err instanceof HttpErrorResponse && err.status === 401;
      const isAuthCall =
        req.url.includes('api/auth/me') ||
        req.url.includes('api/auth/login') ||
        req.url.includes('api/auth/register');

      if (unauthenticated && !isAuthCall) {
        const auth = inject(AuthService);
        const router = inject(Router);
        auth.clearLocal();
        router.navigate(['/login'], { queryParams: { returnUrl: router.url }, replaceUrl: true });
      }

      return throwError(() => err);
    }),
  );
};