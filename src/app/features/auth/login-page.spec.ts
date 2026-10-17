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
    http.expectNone('api/auth/login');
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

    const request = http.expectOne('api/auth/login');
    request.flush({ id: '1', email: 'voce@exemplo.com' });

    await vi.waitFor(() => expect(router.url).toBe('/grupos'));
    expect(TestBed.inject(AuthService).user()?.email).toBe('voce@exemplo.com');
  });
});
