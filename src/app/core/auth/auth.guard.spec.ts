import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

const routeSnapshot = {
  params: {},
  queryParamMap: {
    get: () => null,
    has: () => false,
  },
} as unknown as ActivatedRouteSnapshot;

function stateFor(url: string): RouterStateSnapshot {
  return { url } as unknown as RouterStateSnapshot;
}

describe('authGuard', () => {
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    TestBed.inject(AuthService).clearLocal();
  });

  afterEach(() => http.verify());

  it('redireciona para /login com returnUrl quando não há sessão', async () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(routeSnapshot, stateFor('/grupos')),
    );

    const request = http.expectOne('api/auth/me');
    expect(request.request.method).toBe('GET');
    request.error(new ErrorEvent('unauthorized'), { status: 401 });

    const url = await result;
    expect(url instanceof UrlTree).toBe(true);
    expect((url as UrlTree).toString()).toBe('/login?returnUrl=%2Fgrupos');
  });

  it('libera a rota quando a sessão é válida', async () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(routeSnapshot, stateFor('/grupos')),
    );

    const request = http.expectOne('api/auth/me');
    request.flush({ id: '1', email: 'user@example.com' });

    const outcome = await result;
    expect(outcome).toBe(true);
    expect(TestBed.inject(AuthService).user()?.email).toBe('user@example.com');
  });

  it('não consulta o backend quando já há usuário em memória', async () => {
    TestBed.inject(AuthService).setAuthenticated({ id: '1', email: 'user@example.com' });

    const outcome = await TestBed.runInInjectionContext(() =>
      authGuard(routeSnapshot, stateFor('/grupos')),
    );
    expect(outcome).toBe(true);
    http.expectNone('api/auth/me');
    expect(router.url).toBe('/');
  });
});
