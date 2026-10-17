import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Protege rotas que exigem sessão. Sem sessão válida, redireciona para /login
 * preservando a URL solicitada (returnUrl).
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.user()) {
    return true;
  }

  try {
    const user = await auth.ensureSessionValidated();
    return user !== null ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  } catch {
    auth.clearLocal();
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
};
