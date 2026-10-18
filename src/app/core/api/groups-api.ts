import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateGroupResponse,
  GroupBalance,
  GroupOverview,
  GroupSummary,
} from './api-models';

@Injectable({ providedIn: 'root' })
export class GroupsApi {
  private readonly http = inject(HttpClient);

  create(name: string): Observable<CreateGroupResponse> {
    return this.http.post<CreateGroupResponse>('api/groups', { name });
  }

  list(): Observable<GroupSummary[]> {
    return this.http.get<GroupSummary[]>('api/groups');
  }

  overviews(): Observable<GroupOverview[]> {
    return this.http.get<GroupOverview[]>('api/groups/overviews');
  }

  balances(groupId: string): Observable<GroupBalance[]> {
    return this.http.get<GroupBalance[]>(`api/groups/${groupId}/balances`);
  }

  rename(groupId: string, name: string): Observable<void> {
    return this.http.put<void>(`api/groups/${groupId}`, { name });
  }

  delete(groupId: string): Observable<void> {
    return this.http.delete<void>(`api/groups/${groupId}`);
  }
}
