import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AddParticipantResponse, Participant } from './api-models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ParticipantsApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  add(groupId: string, name: string): Observable<AddParticipantResponse> {
    return this.http.post<AddParticipantResponse>(`${this.apiUrl}/groups/${groupId}/participants`, {
      name,
    });
  }

  list(groupId: string): Observable<Participant[]> {
    return this.http.get<Participant[]>(`${this.apiUrl}/groups/${groupId}/participants`);
  }

  delete(groupId: string, participantId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/groups/${groupId}/participants/${participantId}`);
  }
}
