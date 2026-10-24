import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateGroupResponse,
  GroupBalance,
  GroupOverview,
  GroupSummary,
} from './api-models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GroupsApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  create(name: string): Observable<CreateGroupResponse> {
    return this.http.post<CreateGroupResponse>(`${this.apiUrl}/groups`, { name });
  }

  list(): Observable<GroupSummary[]> {
    return this.http.get<GroupSummary[]>(`${this.apiUrl}/groups`);
  }

  overviews(): Observable<GroupOverview[]> {
    return this.http.get<GroupOverview[]>(`${this.apiUrl}/groups/overviews`);
  }

  balances(groupId: string): Observable<GroupBalance[]> {
    return this.http.get<GroupBalance[]>(`${this.apiUrl}/groups/${groupId}/balances`);
  }

  rename(groupId: string, name: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/groups/${groupId}`, { name });
  }

  delete(groupId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/groups/${groupId}`);
  }
}
