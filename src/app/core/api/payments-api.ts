import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatePaymentResponse, Payment, PaymentPayload, SettlementTransfer } from './api-models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentsApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  create(groupId: string, payload: PaymentPayload): Observable<CreatePaymentResponse> {
    return this.http.post<CreatePaymentResponse>(`${this.apiUrl}/groups/${groupId}/payments`, payload);
  }

  list(groupId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.apiUrl}/groups/${groupId}/payments`);
  }

  delete(groupId: string, paymentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/groups/${groupId}/payments/${paymentId}`);
  }

  settlementPlan(groupId: string): Observable<SettlementTransfer[]> {
    return this.http.get<SettlementTransfer[]>(`${this.apiUrl}/groups/${groupId}/settlement-plan`);
  }
}
