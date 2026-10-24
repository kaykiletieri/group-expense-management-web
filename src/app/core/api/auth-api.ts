import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthPayload, AuthUser } from './api-models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  register(payload: AuthPayload): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.apiUrl}/auth/register`, payload);
  }

  login(payload: AuthPayload): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.apiUrl}/auth/login`, payload);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/auth/logout`, {});
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.apiUrl}/auth/me`);
  }

  /** Salva ou remove (valor em branco) o nome de exibição da conta. */
  updateName(name: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/auth/name`, { name });
  }
}
