import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { vi } from 'vitest';
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
    http.expectOne('/api/groups').flush([{ id: 'g1', name: 'Viagem a Ubatuba', createdAtUtc: '' }]);
    http.expectOne('/api/groups/g1/participants').flush([
      { id: 'p1', name: 'Renata', createdAtUtc: '' },
      { id: 'p2', name: 'Lucas', createdAtUtc: '' },
    ]);
    http.expectOne('/api/groups/g1/expenses').flush([]);
    http.expectOne('/api/groups/g1/balances').flush([
      { participantId: 'p1', totalPaidInCents: 12000, totalOwedInCents: 4000, balanceInCents: 8000 },
      { participantId: 'p2', totalPaidInCents: 0, totalOwedInCents: 4000, balanceInCents: -8000 },
    ]);
    http.expectOne('/api/groups/g1/payments').flush([]);
    http.expectOne('/api/groups/g1/settlement-plan').flush([]);

    await settle();
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  /** Consumes the six loads of the silent refresh, flushing the given data. */
  function flushRefresh(options?: {
    participants?: unknown[];
    payments?: unknown[];
    settlementPlan?: unknown[];
  }): void {
    http.expectOne('/api/groups').flush([{ id: 'g1', name: 'Viagem a Ubatuba', createdAtUtc: '' }]);
    http
      .expectOne('/api/groups/g1/participants')
      .flush(
        options?.participants ?? [
          { id: 'p1', name: 'Renata', createdAtUtc: '' },
          { id: 'p2', name: 'Lucas', createdAtUtc: '' },
        ],
      );
    http.expectOne('/api/groups/g1/expenses').flush([]);
    http.expectOne('/api/groups/g1/balances').flush([
      { participantId: 'p1', totalPaidInCents: 12000, totalOwedInCents: 4000, balanceInCents: 8000 },
      { participantId: 'p2', totalPaidInCents: 0, totalOwedInCents: 4000, balanceInCents: -8000 },
    ]);
    http.expectOne('/api/groups/g1/payments').flush(options?.payments ?? []);
    http.expectOne('/api/groups/g1/settlement-plan').flush(options?.settlementPlan ?? []);
  }

  it('carrega nome, saldos e chips corretos', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Viagem a Ubatuba');
    expect(compiled.textContent).toContain('Pagou R$\u00a0120,00');
    expect(compiled.textContent).toContain('R$\u00a080,00 a receber');
    expect(compiled.textContent).toContain('R$\u00a080,00 a pagar');
  });

  it('envia nome em branco ao adicionar participante (backend gera "Pessoa N")', async () => {
    const component = fixture.componentInstance;

    component.addParticipant();

    const addRequest = http.expectOne('/api/groups/g1/participants');
    expect(addRequest.request.method).toBe('POST');
    expect(addRequest.request.body).toEqual({ name: '' });
    addRequest.flush({ id: 'p3' });

    // refresh silencioso re-carrega os mesmos seis endpoints
    flushRefresh();
    await settle();
  });

  it('botão "Você" adiciona a própria pessoa derivando o nome do e-mail', async () => {
    const auth = TestBed.inject(AuthService);
    auth.setAuthenticated({ id: 'u1', email: 'Kayki@exemplo.com', name: null });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const youButton = [...compiled.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.includes('Você'));
    expect(youButton).toBeTruthy();
    youButton!.click();

    const addRequest = http.expectOne('/api/groups/g1/participants');
    expect(addRequest.request.method).toBe('POST');
    expect(addRequest.request.body).toEqual({ name: 'Kayki' });
    addRequest.flush({ id: 'p3' });

    flushRefresh({
      participants: [
        { id: 'p1', name: 'Renata', createdAtUtc: '' },
        { id: 'p2', name: 'Lucas', createdAtUtc: '' },
        { id: 'p3', name: 'Kayki', createdAtUtc: '' },
      ],
    });
    await settle();
    fixture.detectChanges();

    const youAfter = [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')]
      .some((b) => b.textContent?.includes('Você'));
    expect(youAfter).toBe(false);
  });

  it('botão "Você" usa o nome salvo da conta quando existir', async () => {
    TestBed.inject(AuthService).setAuthenticated({
      id: 'u1',
      email: 'Kayki@exemplo.com',
      name: 'Kayki Teste',
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const youButton = [...compiled.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.includes('Você'));
    youButton!.click();

    const addRequest = http.expectOne('/api/groups/g1/participants');
    expect(addRequest.request.body).toEqual({ name: 'Kayki Teste' });
    addRequest.flush({ id: 'p3' });

    flushRefresh({
      participants: [
        { id: 'p1', name: 'Renata', createdAtUtc: '' },
        { id: 'p2', name: 'Lucas', createdAtUtc: '' },
        { id: 'p3', name: 'Kayki Teste', createdAtUtc: '' },
      ],
    });
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

    const deleteRequest = http.expectOne('/api/groups/g1/participants/p2');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);

    await settle();

    // refresh silencioso re-carrega os mesmos seis endpoints
    flushRefresh({
      participants: [{ id: 'p1', name: 'Renata', createdAtUtc: '' }],
    });
    await settle();
    fixture.detectChanges();

    expect((fixture.nativeElement.textContent)).not.toContain('Remover participante');
  });

  it('avisa que despesas pagas serão excluídas ao remover participante referenciado', async () => {
    const second: ComponentFixture<GrupoDetailPage> = TestBed.createComponent(GrupoDetailPage);
    second.detectChanges();
    http.expectOne('/api/groups').flush([{ id: 'g1', name: 'Viagem a Ubatuba', createdAtUtc: '' }]);
    http.expectOne('/api/groups/g1/participants').flush([
      { id: 'p1', name: 'Renata', createdAtUtc: '' },
      { id: 'p2', name: 'Lucas', createdAtUtc: '' },
    ]);
    http.expectOne('/api/groups/g1/expenses').flush([
      {
        id: 'e1',
        description: 'Almoço',
        totalAmountInCents: 12000,
        payerParticipantId: 'p2',
        shares: [{ participantId: 'p2', amountInCents: 12000 }],
        createdAtUtc: '2026-10-01T12:00:00Z',
      },
    ]);
    http.expectOne('/api/groups/g1/balances').flush([
      { participantId: 'p2', totalPaidInCents: 12000, totalOwedInCents: 12000, balanceInCents: 0 },
    ]);
    http.expectOne('/api/groups/g1/payments').flush([]);
    http.expectOne('/api/groups/g1/settlement-plan').flush([]);
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

  it('exibe pagamentos registrados e plano "Como acertar" com modal pré-preenchido', async () => {
    const second: ComponentFixture<GrupoDetailPage> = TestBed.createComponent(GrupoDetailPage);
    second.detectChanges();
    http.expectOne('/api/groups').flush([{ id: 'g1', name: 'Viagem a Ubatuba', createdAtUtc: '' }]);
    http.expectOne('/api/groups/g1/participants').flush([
      { id: 'p1', name: 'Renata', createdAtUtc: '' },
      { id: 'p2', name: 'Lucas', createdAtUtc: '' },
    ]);
    http.expectOne('/api/groups/g1/expenses').flush([]);
    http.expectOne('/api/groups/g1/balances').flush([
      {
        participantId: 'p1',
        totalPaidInCents: 12000,
        totalOwedInCents: 4000,
        totalReceivedInCents: 3000,
        totalSentInCents: 0,
        balanceInCents: 11000,
      },
      {
        participantId: 'p2',
        totalPaidInCents: 0,
        totalOwedInCents: 4000,
        totalReceivedInCents: 0,
        totalSentInCents: 3000,
        balanceInCents: -11000,
      },
    ]);
    http.expectOne('/api/groups/g1/payments').flush([
      {
        id: 'pay1',
        payerParticipantId: 'p2',
        receiverParticipantId: 'p1',
        amountInCents: 3000,
        createdAtUtc: '2026-10-02T12:00:00Z',
      },
    ]);
    http.expectOne('/api/groups/g1/settlement-plan').flush([
      { fromParticipantId: 'p2', toParticipantId: 'p1', amountInCents: 8000 },
    ]);
    await settle();
    second.detectChanges();

    const compiled = second.nativeElement as HTMLElement;

    // Card de pagamentos lista o acerto registrado
    expect(compiled.textContent).toContain('Lucas → Renata');
    expect(compiled.textContent).toContain('R$\u00a030,00');

    // Seção "Como acertar" sugere a transferência restante
    expect(compiled.textContent).toContain('Como Acertar');
    expect(compiled.textContent).toContain('R$\u00a080,00');

    const registerButtons = [...compiled.querySelectorAll<HTMLButtonElement>('.settle-row button')]
      .filter((b) => b.textContent?.trim() === 'Registrar');
    registerButtons[0].click();
    second.detectChanges();

    expect((second.componentInstance as GrupoDetailPage).paymentOpen()).toBe(true);
    expect((second.componentInstance as GrupoDetailPage).payerControl.value).toBe('p2');
    expect((second.componentInstance as GrupoDetailPage).receiverControl.value).toBe('p1');
    expect((second.componentInstance as GrupoDetailPage).amountControl.value).toBe('80,00');

    (second.componentInstance as GrupoDetailPage).closePayment();
    await settle();
  });

  it('envia pagamento com valor convertido para centavos e recarrega', async () => {
    const component = fixture.componentInstance;
    component.openPayment({ payerId: 'p2', receiverId: 'p1', amountInCents: 5000 });
    component.amountControl.setValue('33,34');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const submitButton = [...compiled.querySelectorAll<HTMLButtonElement>('.modal-actions button')]
      .find((b) => b.textContent?.trim() === 'Registrar');
    submitButton!.click();

    const paymentRequest = http.expectOne('/api/groups/g1/payments');
    expect(paymentRequest.request.method).toBe('POST');
    expect(paymentRequest.request.body).toEqual({
      payerParticipantId: 'p2',
      receiverParticipantId: 'p1',
      amountInCents: 3334,
    });
    paymentRequest.flush({ id: 'pay1' });

    flushRefresh({
      payments: [
        {
          id: 'pay1',
          payerParticipantId: 'p2',
          receiverParticipantId: 'p1',
          amountInCents: 3334,
          createdAtUtc: '2026-10-03T12:00:00Z',
        },
      ],
    });
    await settle();
    fixture.detectChanges();

    // modal fechado após sucesso
    expect(component.paymentOpen()).toBe(false);

    const compiledAfter = fixture.nativeElement as HTMLElement;
    expect(compiledAfter.textContent).toContain('Lucas → Renata');
  });

  it('bloqueia pagamento com mesma pessoa pagando e recebendo', () => {
    const component = fixture.componentInstance;
    component.openPayment({ payerId: 'p1', receiverId: 'p1', amountInCents: 5000 });
    component.amountControl.setValue('50,00');

    component.submitPayment();

    expect(component.paymentOpen()).toBe(true);
    expect(component.paymentError()).toBe(
      'Quem paga e quem recebe devem ser pessoas diferentes.',
    );
  });

  it('monta o texto de saldos para compartilhar e mostra confirmação ao copiar', async () => {
    const component = fixture.componentInstance;

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    vi.stubGlobal('isSecureContext', true);

    component.copyBalances();

    await settle();

    expect(component.copied()).toBe('balances');
    expect(writeText).toHaveBeenCalledWith(
      'Saldos — Viagem a Ubatuba\nRenata: Recebe R$\u00a080,00\nLucas: Deve R$\u00a080,00',
    );
  });
});


