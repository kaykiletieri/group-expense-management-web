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
    http.expectOne('api/groups/g1/participants').flush([
      { id: 'p1', name: 'Renata', createdAtUtc: '' },
      { id: 'p2', name: 'Lucas', createdAtUtc: '' },
    ]);
    await settle();
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('inclui o pagador automaticamente no rateio', () => {
    const component = fixture.componentInstance;
    expect([...component.splitIds()]).toEqual([]);

    component.setPayer('p1');

    expect(component.payerId()).toBe('p1');
    expect([...component.splitIds()]).toEqual(['p1']);
  });

  it('permite desmarcar o pagador do rateio depois', () => {
    const component = fixture.componentInstance;

    component.setPayer('p1');
    component.toggleSplit('p1');

    expect(component.payerId()).toBe('p1');
    expect([...component.splitIds()]).toEqual([]);
  });
});
