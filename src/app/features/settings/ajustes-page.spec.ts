import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AjustesPage } from './ajustes-page';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('AjustesPage', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<AjustesPage>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    localStorage.removeItem('gem-theme');
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthService).setAuthenticated({
      id: 'u1',
      email: 'kayki@exemplo.com',
      name: 'Kayki Teste',
    });
    fixture = TestBed.createComponent(AjustesPage);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem('gem-theme');
  });

  it('tema: alterna seleção e persiste "dark" em localStorage', async () => {
    const theme = TestBed.inject(ThemeService);
    const compiled = fixture.nativeElement as HTMLElement;

    const darkButton = [...compiled.querySelectorAll<HTMLButtonElement>('.theme-option')].find(
      (b) => b.textContent?.trim() === 'Escuro',
    );
    darkButton!.click();

    await settle();
    expect(theme.preference()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('gem-theme')).toBe('dark');
  });

  it('só existem as opções Claro e Escuro (sem auto), padrão claro', async () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const options = [...compiled.querySelectorAll<HTMLButtonElement>('.theme-option')].map(
      (b) => b.textContent?.trim() ?? '',
    );
    expect(options).toEqual(['Claro', 'Escuro']);
    expect(TestBed.inject(ThemeService).preference()).toBe('light');
  });

  it('salva o nome de exibição e reflete no usuário em memória', async () => {
    const component = fixture.componentInstance;
    component.displayName.setValue('  Novo Nome  ');
    const saving = component.saveName();

    const putRequest = http.expectOne('api/auth/name');
    expect(putRequest.request.method).toBe('PUT');
    // o frontend já envia o valor aparado; o backend persiste e ecoa no /me
    expect(putRequest.request.body).toEqual({ name: 'Novo Nome' });
    putRequest.flush(null);

    await saving;
    await settle();
    expect(TestBed.inject(AuthService).user()?.name).toBe('Novo Nome');
  });

  it('envia valor em branco para limpar o nome', async () => {
    const component = fixture.componentInstance;
    component.displayName.setValue('   ');
    const saving = component.saveName();

    const putRequest = http.expectOne('api/auth/name');
    expect(putRequest.request.body).toEqual({ name: '' });
    putRequest.flush(null);

    await saving;
    await settle();
    expect(TestBed.inject(AuthService).user()?.name).toBeNull();
  });
});
