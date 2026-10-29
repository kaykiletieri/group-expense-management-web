import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LoginPage } from './login-page';
import { AuthService } from '../../core/auth/auth.service';

@Component({ template: '' })
class DummyGruposPage {}

describe('LoginPage', () => {
  let http: HttpTestingController;
  let router: Router;
  let fixture: ReturnType<typeof createFixture>;

  function createFixture() {
    return TestBed.createComponent(LoginPage);
  }

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'grupos', component: DummyGruposPage }]),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = createFixture();
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('não envia o formulário sem credenciais', () => {
    const component = fixture.componentInstance;
    component.submit();
    expect(component.submitting()).toBe(false);
    http.expectNone('/api/auth/login');
  });

  it('exige 6 caracteres na senha ao cadastrar', () => {
    const component = fixture.componentInstance;
    component.setMode('register');
    component.form.setValue({ email: 'voce@exemplo.com', password: '123' });
    component.submit();

    expect(component.form.invalid).toBe(true);
    expect(component.submitting()).toBe(false);
  });

  it('redireciona para /grupos após login com sucesso', async () => {
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'voce@exemplo.com', password: 'senha123' });
    component.submit();

    const request = http.expectOne('/api/auth/login');
    request.flush({ id: '1', email: 'voce@exemplo.com' });

    await vi.waitFor(() => expect(router.url).toBe('/grupos'));
    expect(TestBed.inject(AuthService).user()?.email).toBe('voce@exemplo.com');
  });

  it('após cadastro, autentica de verdade antes de navegar (registro não cria sessão)', async () => {
    const component = fixture.componentInstance;
    component.setMode('register');
    component.form.setValue({ email: 'novo@exemplo.com', password: 'senha123' });
    component.submit();

    const registerRequest = http.expectOne('/api/auth/register');
    expect(registerRequest.request.method).toBe('POST');
    expect(component.submitting()).toBe(true);
    registerRequest.flush({ id: 'u9', email: 'novo@exemplo.com', name: null });

    // primeira tela autenticada não pode disparar com 401: o login deve
    // ser completado antes da navegação para /grupos
    const loginRequest = http.expectOne('/api/auth/login');
    expect(loginRequest.request.method).toBe('POST');
    expect(loginRequest.request.body).toEqual({ email: 'novo@exemplo.com', password: 'senha123' });
    loginRequest.flush(null);

    await vi.waitFor(() => expect(router.url).toBe('/grupos'));
    expect(component.submitting()).toBe(false);
    expect(TestBed.inject(AuthService).user()?.email).toBe('novo@exemplo.com');
  });

  it('mostra o erro do backend quando o login pós-cadastro falha', async () => {
    const component = fixture.componentInstance;
    component.setMode('register');
    component.form.setValue({ email: 'novo@exemplo.com', password: 'senha123' });
    component.submit();

    http.expectOne('/api/auth/register').flush({
      id: 'u9',
      email: 'novo@exemplo.com',
      name: null,
    });

    const loginRequest = http.expectOne('/api/auth/login');
    loginRequest.flush(
      { error: 'Invalid e-mail or password.' },
      { status: 401, statusText: 'Unauthorized' },
    );

    await vi.waitFor(() => expect(component.submitting()).toBe(false));
    expect(component.errorMessage()).toBe('E-mail ou senha incorretos.');
    expect(router.url).toBe('/');
  });

  it('cadastro com e-mail já usado mostra mensagem pt-BR (não vaza o texto do Identity)', async () => {
    const component = fixture.componentInstance;
    component.setMode('register');
    component.form.setValue({ email: 'duplicado@exemplo.com', password: 'senha123' });
    component.submit();

    http.expectOne('/api/auth/register').flush(
      { errors: ["Email 'duplicado@exemplo.com' is already taken.", 'UserName exists'] },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(component.submitting()).toBe(false);
    expect(component.errorMessage()).toBe('Já existe uma conta com este e-mail. Faça login.');
  });

  it('cadastro com outro erro 400 do Identity usa mensagem neutra', async () => {
    const component = fixture.componentInstance;
    component.setMode('register');
    component.form.setValue({ email: 'novo@exemplo.com', password: 'senha123' });
    component.submit();

    http.expectOne('/api/auth/register').flush(
      { errors: ['PasswordRequiresNonAlphanumeric'] },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(component.submitting()).toBe(false);
    expect(component.errorMessage()).toBe('Verifique os dados informados.');
  });
});
