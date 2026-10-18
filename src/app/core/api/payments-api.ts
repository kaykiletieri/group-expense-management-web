import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatePaymentResponse, Payment, PaymentPayload, SettlementTransfer } from './api-models';

@Injectable({ providedIn: 'root' })
export class PaymentsApi {
  private readonly http = inject(HttpClient);

  create(groupId: string, payload: PaymentPayload): Observable<CreatePaymentResponse> {
    return this.http.post<CreatePaymentResponse>(`api/groups/${groupId}/payments`, payload);
  }

  list(groupId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`api/groups/${groupId}/payments`);
  }

  delete(groupId: string, paymentId: string): Observable<void> {
    return this.http.delete<void>(`api/groups/${groupId}/payments/${paymentId}`);
  }

  settlementPlan(groupId: string): Observable<SettlementTransfer[]> {
    return this.http.get<SettlementTransfer[]>(`api/groups/${groupId}/settlement-plan`);
  }
}
