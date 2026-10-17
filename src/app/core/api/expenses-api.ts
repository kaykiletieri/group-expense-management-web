import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateExpenseResponse, Expense, ExpensePayload } from './api-models';

@Injectable({ providedIn: 'root' })
export class ExpensesApi {
  private readonly http = inject(HttpClient);

  create(groupId: string, payload: ExpensePayload): Observable<CreateExpenseResponse> {
    return this.http.post<CreateExpenseResponse>(`api/groups/${groupId}/expenses`, payload);
  }

  list(groupId: string): Observable<Expense[]> {
    return this.http.get<Expense[]>(`api/groups/${groupId}/expenses`);
  }

  update(groupId: string, expenseId: string, payload: ExpensePayload): Observable<void> {
    return this.http.put<void>(`api/groups/${groupId}/expenses/${expenseId}`, payload);
  }

  delete(groupId: string, expenseId: string): Observable<void> {
    return this.http.delete<void>(`api/groups/${groupId}/expenses/${expenseId}`);
  }
}
