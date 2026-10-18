import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GrupoDetailPage } from './grupo-detail-page';
import { AuthService } from '../../core/auth/auth.service';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

@Component({ template: '' })
class DummyPage {}

describe('GrupoDetailPage', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<GrupoDetailPage>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', component: DummyPage }]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (k: string) => (k === 'id' ? 'g1' : null) } } },
        },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(GrupoDetailPage);
    fixture.detectChanges();
    http.expectOne('api/groups').flush([{ id: 'g1', name: 'Viagem a Ubatuba', createdAtUtc: '' }]);
    http.expectOne('api/groups/g1/participants').flush([
      { id: 'p1', name: 'Renata', createdAtUtc: '' },
      { id: 'p2', name: 'Lucas', createdAtUtc: '' },
    ]);
    http.expectOne('api/groups/g1/expenses').flush([]);
    http.expectOne('api/groups/g1/balances').flush([
      { participantId: 'p1', totalPaidInCents: 12000, totalOwedInCents: 4000, balanceInCents: 8000 },
      { participantId: 'p2', totalPaidInCents: 0, totalOwedInCents: 4000, balanceInCents: -8000 },
    ]);

    await settle();
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('carrega nome, saldos e chips corretos', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Viagem a Ubatuba');
    expect(compiled.textContent).toContain('Pagou R$\u00a0120,00');
    expect(compiled.textContent).toContain('Recebe R$\u00a080,00');
    expect(compiled.textContent).toContain('Deve R$\u00a080,00');
  });

  it('envia nome em branco ao adicionar participante (backend gera "Pessoa N")', async () => {
    const component = fixture.componentInstance;

    component.addParticipant();

    const addRequest = http.expectOne('api/groups/g1/participants');
    expect(addRequest.request.method).toBe('POST');
    expect(addRequest.request.body).toEqual({ name: '' });
    addRequest.flush({ id: 'p3' });

    // refresh silencioso re-carrega os mesmos quatro endpoints
    http.expectOne('api/groups').flush([{ id: 'g1', name: 'Viagem a Ubatuba', createdAtUtc: '' }]);
    http.expectOne('api/groups/g1/participants').flush([
      { id: 'p1', name: 'Renata', createdAtUtc: '' },
      { id: 'p2', name: 'Lucas', createdAtUtc: '' },
    ]);
    http.expectOne('api/groups/g1/expenses').flush([]);
    http.expectOne('api/groups/g1/balances').flush([
      { participantId: 'p1', totalPaidInCents: 12000, totalOwedInCents: 4000, balanceInCents: 8000 },
      { participantId: 'p2', totalPaidInCents: 0, totalOwedInCents: 4000, balanceInCents: -8000 },
    ]);
    await settle();
  });

  it('botão "Você" adiciona a própria pessoa derivando o nome do e-mail', async () => {
    const auth = TestBed.inject(AuthService);
    auth.setAuthenticated({ id: 'u1', email: 'Kayki@exemplo.com', name: null });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const youButton = compiled.querySelector<HTMLButtonElement>('[aria-label="Adicionar você como participante"]');
    expect(youButton).toBeTruthy();
    youButton!.click();

    const addRequest = http.expectOne('api/groups/g1/participants');
    expect(addRequest.request.method).toBe('POST');
    expect(addRequest.request.body).toEqual({ name: 'Kayki' });
    addRequest.flush({ id: 'p3' });

    http.expectOne('api/groups').flush([{ id: 'g1', name: 'Viagem a Ubatuba', createdAtUtc: '' }]);
    http.expectOne('api/groups/g1/participants').flush([
      { id: 'p1', name: 'Renata', createdAtUtc: '' },
      { id: 'p2', name: 'Lucas', createdAtUtc: '' },
      { id: 'p3', name: 'Kayki', createdAtUtc: '' },
    ]);
    http.expectOne('api/groups/g1/expenses').flush([]);
    http.expectOne('api/groups/g1/balances').flush([
      { participantId: 'p1', totalPaidInCents: 12000, totalOwedInCents: 4000, balanceInCents: 8000 },
      { participantId: 'p2', totalPaidInCents: 0, totalOwedInCents: 4000, balanceInCents: -8000 },
    ]);
    await settle();
    fixture.detectChanges();

    // já presente no grupo: botão some
    const youAfter = (fixture.nativeElement as HTMLElement).querySelector(
      '[aria-label="Adicionar você como participante"]',
    );
    expect(youAfter).toBeNull();
  });

  it('botão "Você" usa o nome salvo da conta quando existir', async () => {
    TestBed.inject(AuthService).setAuthenticated({
      id: 'u1',
      email: 'Kayki@exemplo.com',
      name: 'Kayki Teste',
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const youButton = compiled.querySelector<HTMLButtonElement>(
      '[aria-label="Adicionar você como participante"]',
    );
    youButton!.click();

    const addRequest = http.expectOne('api/groups/g1/participants');
    expect(addRequest.request.body).toEqual({ name: 'Kayki Teste' });
    addRequest.flush({ id: 'p3' });

    http.expectOne('api/groups').flush([{ id: 'g1', name: 'Viagem a Ubatuba', createdAtUtc: '' }]);
    http.expectOne('api/groups/g1/participants').flush([
      { id: 'p1', name: 'Renata', createdAtUtc: '' },
      { id: 'p2', name: 'Lucas', createdAtUtc: '' },
      { id: 'p3', name: 'Kayki Teste', createdAtUtc: '' },
    ]);
    http.expectOne('api/groups/g1/expenses').flush([]);
    http.expectOne('api/groups/g1/balances').flush([
      { participantId: 'p1', totalPaidInCents: 12000, totalOwedInCents: 4000, balanceInCents: 8000 },
      { participantId: 'p2', totalPaidInCents: 0, totalOwedInCents: 4000, balanceInCents: -8000 },
    ]);
    await settle();
  });

  it('remove participante sem despesas com mensagem simples', async () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const removeButtons = compiled.querySelectorAll<HTMLButtonElement>(
      'button[aria-label="Remover participante"]',
    );
    removeButtons[1].click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Remover Lucas do grupo?');

    const confirmButton = [...compiled.querySelectorAll<HTMLButtonElement>('.modal-actions button')]
      .find((b) => b.textContent?.trim() === 'Remover');
    expect(confirmButton).toBeTruthy();
    confirmButton!.click();

    const deleteRequest = http.expectOne('api/groups/g1/participants/p2');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);

    await settle();

    // refresh silencioso re-carrega os mesmos quatro endpoints
    http.expectOne('api/groups').flush([{ id: 'g1', name: 'Viagem a Ubatuba', createdAtUtc: '' }]);
    await settle();
    http.expectOne('api/groups/g1/participants').flush([
      { id: 'p1', name: 'Renata', createdAtUtc: '' },
    ]);
    http.expectOne('api/groups/g1/expenses').flush([]);
    http.expectOne('api/groups/g1/balances').flush([
      { participantId: 'p1', totalPaidInCents: 12000, totalOwedInCents: 0, balanceInCents: 12000 },
    ]);
    await settle();
    fixture.detectChanges();

    expect((fixture.nativeElement.textContent)).not.toContain('Remover participante');
  });

  it('avisa que despesas pagas serão excluídas ao remover participante referenciado', async () => {
    const second: ComponentFixture<GrupoDetailPage> = TestBed.createComponent(GrupoDetailPage);
    second.detectChanges();
    http.expectOne('api/groups').flush([{ id: 'g1', name: 'Viagem a Ubatuba', createdAtUtc: '' }]);
    http.expectOne('api/groups/g1/participants').flush([
      { id: 'p1', name: 'Renata', createdAtUtc: '' },
      { id: 'p2', name: 'Lucas', createdAtUtc: '' },
    ]);
    http.expectOne('api/groups/g1/expenses').flush([
      {
        id: 'e1',
        description: 'Almoço',
        totalAmountInCents: 12000,
        payerParticipantId: 'p2',
        shares: [{ participantId: 'p2', amountInCents: 12000 }],
        createdAtUtc: '2026-10-01T12:00:00Z',
      },
    ]);
    http.expectOne('api/groups/g1/balances').flush([
      { participantId: 'p2', totalPaidInCents: 12000, totalOwedInCents: 12000, balanceInCents: 0 },
    ]);
    await settle();
    second.detectChanges();

    const secondCompiled = second.nativeElement as HTMLElement;
    const removeButtons = secondCompiled.querySelectorAll<HTMLButtonElement>(
      'button[aria-label="Remover participante"]',
    );
    removeButtons[1].click();
    second.detectChanges();

    expect(secondCompiled.textContent).toContain(
      'Despesas pagas por Lucas serão excluídas',
    );

    const cancelButton = [...secondCompiled.querySelectorAll<HTMLButtonElement>(
      '.modal-actions button',
    )].find((b) => b.textContent?.trim() === 'Cancelar');
    cancelButton!.click();
    await settle();
  });
});
