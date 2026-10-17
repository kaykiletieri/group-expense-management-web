import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GrupoDetailPage } from './grupo-detail-page';

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

  it('exibe a mensagem de 409 ao remover participante com despesas', async () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const removeButtons = compiled.querySelectorAll<HTMLButtonElement>(
      'button[aria-label="Remover participante"]',
    );
    removeButtons[1].click();
    fixture.detectChanges();

    const confirmButton = [...compiled.querySelectorAll<HTMLButtonElement>('.modal-actions button')]
      .find((b) => b.textContent?.trim() === 'Remover');
    expect(confirmButton).toBeTruthy();
    confirmButton!.click();

    const deleteRequest = http.expectOne('api/groups/g1/participants/p2');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(
      { error: 'Este participante tem despesas associadas e não pode ser removido.' },
      { status: 409, statusText: 'Conflict' },
    );

    await settle();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Este participante tem despesas associadas e não pode ser removido.',
    );
  });
});
