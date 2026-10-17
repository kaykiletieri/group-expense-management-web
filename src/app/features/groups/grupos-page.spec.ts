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
      .expectOne('api/groups')
      .flush([
        { id: 'g1', name: 'Viagem a Ubatuba', createdAtUtc: '2026-10-01' },
        { id: 'g2', name: 'Contas da casa', createdAtUtc: '2026-10-02' },
      ]);
    await settle();

    http.expectOne('api/groups/g1/balances').flush([
      { participantId: 'p1', totalPaidInCents: 10000, totalOwedInCents: 5000, balanceInCents: 5000 },
      { participantId: 'p2', totalPaidInCents: 0, totalOwedInCents: 5000, balanceInCents: -5000 },
    ]);
    http.expectOne('api/groups/g2/balances').flush([]);

    await settle();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const names = [...compiled.querySelectorAll('.group-card-name')].map((e) => e.textContent);
    expect(names).toEqual(['Viagem a Ubatuba', 'Contas da casa']);
    // Intl usa U+00A0 entre o símbolo e o valor
    expect(compiled.textContent).toContain('R$\u00a0100,00');
  });

  it('cria grupo e navega para o detalhe', async () => {
    http.expectOne('api/groups').flush([]);
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

  it('mostra estado vazio quando não há grupos', async () => {
    http.expectOne('api/groups').flush([]);
    await settle();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Nenhum grupo ainda');
  });
});
