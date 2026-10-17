import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { getApiErrorMessage } from '../../core/api/api-error';

const NETWORK_ERROR = 'Não foi possível conectar. Verifique sua internet.';
const LOCKOUT_MESSAGE = 'Muitas tentativas. Tente novamente em alguns minutos.';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly mode = signal<'login' | 'register'>('login');
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  setMode(mode: 'login' | 'register') {
    this.mode.set(mode);
    this.errorMessage.set(null);
    // Em cadastro a senha exige no mínimo 6 caracteres.
    this.form.controls.password.setValidators(
      mode === 'register' ? [Validators.required, Validators.minLength(6)] : [Validators.required],
    );
    this.form.controls.password.updateValueAndValidity();
  }

  showFieldError(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  submit() {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const payload = { email: this.form.value.email!, password: this.form.value.password! };
    const request$ = this.mode() === 'login' ? this.auth.login(payload) : this.auth.register(payload);

    request$.subscribe({
      next: (user) => {
        this.auth.setAuthenticated(user);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/grupos';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(this.humanizeError(err));
      },
    });
  }

  private humanizeError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 403) {
        return LOCKOUT_MESSAGE;
      }
      if (err.status === 400) {
        const message = getApiErrorMessage(err, 'Verifique os dados informados.');
        return message;
      }
    }
    return NETWORK_ERROR;
  }
}
