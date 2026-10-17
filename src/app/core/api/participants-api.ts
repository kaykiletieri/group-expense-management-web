import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AddParticipantResponse, Participant } from './api-models';

@Injectable({ providedIn: 'root' })
export class ParticipantsApi {
  private readonly http = inject(HttpClient);

  add(groupId: string, name: string): Observable<AddParticipantResponse> {
    return this.http.post<AddParticipantResponse>(`api/groups/${groupId}/participants`, {
      name,
    });
  }

  list(groupId: string): Observable<Participant[]> {
    return this.http.get<Participant[]>(`api/groups/${groupId}/participants`);
  }

  delete(groupId: string, participantId: string): Observable<void> {
    return this.http.delete<void>(`api/groups/${groupId}/participants/${participantId}`);
  }
}
