import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthPayload, AuthUser } from './api-models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);

  register(payload: AuthPayload): Observable<AuthUser> {
    return this.http.post<AuthUser>('api/auth/register', payload);
  }

  login(payload: AuthPayload): Observable<AuthUser> {
    return this.http.post<AuthUser>('api/auth/login', payload);
  }

  logout(): Observable<void> {
    return this.http.post<void>('api/auth/logout', {});
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>('api/auth/me');
  }
}
