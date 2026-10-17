import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../api/auth-api';
import { AuthPayload, AuthUser } from '../api/api-models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApi);

  private readonly userSignal = signal<AuthUser | null>(null);

  /** Usuário autenticado; null quando desconhecido/deslogado. */
  readonly user = this.userSignal.asReadonly();

  login(payload: AuthPayload) {
    return this.authApi.login(payload);
  }

  register(payload: AuthPayload) {
    return this.authApi.register(payload);
  }

  logout() {
    return this.authApi.logout();
  }

  /** Define o usuário atualmente autenticado em memória. */
  setAuthenticated(user: AuthUser) {
    this.userSignal.set(user);
  }

  /** Limpa o usuário em memória (a sessão é um cookie httpOnly gerenciado pelo backend). */
  clearLocal() {
    this.userSignal.set(null);
  }

  /**
   * Valida a sessão consultando o backend uma vez por navegação em memória.
   * Resolve o usuário ou null (não autenticado).
   */
  async ensureSessionValidated(): Promise<AuthUser | null> {
    if (this.userSignal() !== null) {
      return this.userSignal();
    }
    const user = await firstValueFrom(this.authApi.me());
    this.userSignal.set(user);
    return user;
  }
}
