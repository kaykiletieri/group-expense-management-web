import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

/**
 * Derruba o estado de sessão e redireciona ao login quando o backend responde 401
 * (exceto nas chamadas de própria autenticação, que tratam o 401 localmente).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
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
