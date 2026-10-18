import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GruposPage } from './grupos-page';

@Component({ template: '' })
class DummyDetailPage {}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('GruposPage', () => {
  let http: HttpTestingController;
  let router: Router;
  let fixture: ComponentFixture<GruposPage>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'grupos/:id', component: DummyDetailPage }]),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(GruposPage);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('renderiza os grupos com total pago por grupo', async () => {
    http
      .expectOne('api/groups/overviews')
      .flush([
        {
          id: 'g1',
          name: 'Viagem a Ubatuba',
          createdAtUtc: '2026-10-01',
          participantCount: 2,
          totalPaidInCents: 10000,
        },
        {
          id: 'g2',
          name: 'Contas da casa',
          createdAtUtc: '2026-10-02',
          participantCount: 0,
          totalPaidInCents: 0,
        },
      ]);
    await settle();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const names = [...compiled.querySelectorAll('.group-card-name')].map((e) => e.textContent);
    expect(names).toEqual(['Viagem a Ubatuba', 'Contas da casa']);
    expect(compiled.textContent).toContain('2 pessoa(s)');
    // Intl usa U+00A0 entre o símbolo e o valor
    expect(compiled.textContent).toContain('R$\u00a0100,00');
    expect(compiled.textContent).toContain('Sem despesas');
  });

  it('cria grupo e navega para o detalhe', async () => {
    http.expectOne('api/groups/overviews').flush([]);
    await settle();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.openCreation();
    fixture.detectChanges();

    component.creationName.setValue('Novo racha');
    component.submitCreation();

    const createRequest = http.expectOne('api/groups');
    expect(createRequest.request.body).toEqual({ name: 'Novo racha' });
    createRequest.flush({ id: 'novo' });

    await vi.waitFor(() => expect(router.url).toBe('/grupos/novo'));
  });

  it('cria grupo mesmo sem nome (backend gera "Grupo N")', async () => {
    http.expectOne('api/groups/overviews').flush([]);
    await settle();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.openCreation();
    fixture.detectChanges();

    component.submitCreation();

    const createRequest = http.expectOne('api/groups');
    expect(createRequest.request.body).toEqual({ name: '' });
    createRequest.flush({ id: 'novo' });

    await vi.waitFor(() => expect(router.url).toBe('/grupos/novo'));
  });

  it('mostra estado vazio quando não há grupos', async () => {
    http.expectOne('api/groups/overviews').flush([]);
    await settle();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Nenhum grupo ainda');
  });

  it('desabilita "Novo grupo" quando o usuário já tem 10 grupos', async () => {
    const tenGroups = Array.from({ length: 10 }, (_, i) => ({
      id: `g${i + 1}`,
      name: `Grupo ${i + 1}`,
      createdAtUtc: '2026-10-01',
      participantCount: 0,
      totalPaidInCents: 0,
    }));
    http.expectOne('api/groups/overviews').flush(tenGroups);
    await settle();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const newButton = compiled.querySelector<HTMLButtonElement>('.list-head .btn-chip');
    expect(newButton).toBeTruthy();
    expect(newButton!.disabled).toBe(true);
    expect(fixture.componentInstance.groupLimitReached()).toBe(true);
  });

  it('traduz o erro de limite atingido para pt-BR no modal', async () => {
    const tenGroups = Array.from({ length: 10 }, (_, i) => ({
      id: `g${i + 1}`,
      name: `Grupo ${i + 1}`,
      createdAtUtc: '2026-10-01',
      participantCount: 0,
      totalPaidInCents: 0,
    }));
    http.expectOne('api/groups/overviews').flush(tenGroups);
    await settle();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.openCreation();
    fixture.detectChanges();

    component.submitCreation();

    const failedRequest = http.expectOne('api/groups');
    failedRequest.flush(
      { error: 'A user can have at most 10 groups.' },
      { status: 400, statusText: 'Bad Request' },
    );

    await settle();
    fixture.detectChanges();

    expect(component.createError()).toBe('Você pode ter no máximo 10 grupos.');
  });
});
