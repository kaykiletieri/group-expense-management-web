import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ExpenseFormPage } from './expense-form-page';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

@Component({ template: '' })
class DummyPage {}

describe('ExpenseFormPage: pagador entra no rateio', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<ExpenseFormPage>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', component: DummyPage }]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (k: string) => (k === 'id' ? 'g1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ExpenseFormPage);
    fixture.detectChanges();
    http.expectOne('/api/groups').flush([
      { id: 'g1', name: 'Viagem para Ubatuba', createdAtUtc: '' },
    ]);
    http.expectOne('/api/groups/g1/participants').flush([
      { id: 'p1', name: 'Renata', createdAtUtc: '' },
      { id: 'p2', name: 'Lucas', createdAtUtc: '' },
    ]);
    await settle();
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('pré-seleciona todos os participantes no rateio e define o primeiro como pagador', () => {
    const component = fixture.componentInstance;
    expect(component.payerId()).toBe('p1');
    expect([...component.splitIds()]).toEqual(['p1', 'p2']);
  });

  it('inclui o pagador automaticamente no rateio ao trocar o pagador', () => {
    const component = fixture.componentInstance;

    component.toggleSplit('p2');
    expect([...component.splitIds()]).toEqual(['p1']);

    component.setPayer('p2');

    expect(component.payerId()).toBe('p2');
    expect([...component.splitIds()]).toEqual(['p1', 'p2']);
  });

  it('permite desmarcar o pagador do rateio depois', () => {
    const component = fixture.componentInstance;

    component.toggleSplit('p1');
    component.toggleSplit('p2');

    expect(component.payerId()).toBe('p1');
    expect([...component.splitIds()]).toEqual([]);
  });
});
