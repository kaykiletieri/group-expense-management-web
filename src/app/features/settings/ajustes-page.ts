import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { AuthApi } from '../../core/api/auth-api';
import { getApiErrorMessage } from '../../core/api/api-error';

const GENERIC_ERROR = 'Não foi possível conectar. Verifique sua internet.';

@Component({
  selector: 'app-ajustes-page',
  imports: [ReactiveFormsModule],
  templateUrl: './ajustes-page.html',
  styleUrl: './ajustes-page.scss',
})
export class AjustesPage {
  private readonly auth = inject(AuthService);
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  readonly theme = inject(ThemeService);

  readonly user = this.auth.user;
  readonly loggingOut = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly displayName = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(60)],
  });
  readonly savingName = signal(false);
  readonly nameError = signal<string | null>(null);

  ngOnInit() {
    this.displayName.reset(this.user()?.name ?? '');
  }

  async saveName(): Promise<void> {
    if (this.savingName()) {
      return;
    }
    const name = this.displayName.value.trim();

    this.savingName.set(true);
    this.nameError.set(null);
    try {
      await firstValueFrom(this.authApi.updateName(name));
      const current = this.user();
      if (current) {
        this.auth.setAuthenticated({ ...current, name: name || null });
      }
    } catch (err) {
      this.nameError.set(getApiErrorMessage(err, GENERIC_ERROR));
    } finally {
      this.savingName.set(false);
    }
  }

  logout() {
    this.loggingOut.set(true);
    this.auth.logout().subscribe({
      next: () => this.auth.clearLocal(),
      error: () => this.auth.clearLocal(),
      complete: () => {
        this.loggingOut.set(false);
        void this.router.navigateByUrl('/login', { replaceUrl: true });
      },
    });
  }
}
