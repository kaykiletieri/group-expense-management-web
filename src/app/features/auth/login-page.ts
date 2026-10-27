import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { AuthService } from '../../core/auth/auth.service';
import { getApiErrorList, getApiErrorMessage } from '../../core/api/api-error';

const NETWORK_ERROR = 'Não foi possível conectar. Verifique sua internet.';
const LOCKOUT_MESSAGE = 'Muitas tentativas. Tente novamente em alguns minutos.';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);

  ngOnInit(): void { this.title.setTitle('Entrar - Rachaae'); }

  readonly mode = signal<'login' | 'register'>('login');
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly passwordVisible = signal(false);

  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  setMode(mode: 'login' | 'register') {
    this.mode.set(mode); this.errorMessage.set(null); this.passwordVisible.set(false);
    this.form.controls.password.setValidators(mode === 'register' ? [Validators.required, Validators.minLength(6)] : [Validators.required]);
    this.form.controls.password.updateValueAndValidity();
  }

  togglePasswordVisibility() { this.passwordVisible.update(v => !v); }

  showFieldError(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  submit() {
    this.errorMessage.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const payload = { email: this.form.value.email!, password: this.form.value.password! };
    const request$ = this.mode() === 'login' ? this.auth.login(payload) : this.auth.register(payload);
    request$.subscribe({
      next: (user) => {
        this.auth.setAuthenticated(user);
        if (this.mode() === 'register') {
          this.auth.login(payload).subscribe({
            next: () => this.navigateAfterAuth(),
            error: (err: unknown) => { this.submitting.set(false); this.errorMessage.set(this.humanizeError(err)); },
          });
          return;
        }
        this.navigateAfterAuth();
      },
      error: (err: unknown) => { this.submitting.set(false); this.errorMessage.set(this.humanizeError(err)); },
    });
  }

  private navigateAfterAuth() {
    this.submitting.set(false);
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/grupos';
    void this.router.navigateByUrl(returnUrl);
  }

  private humanizeError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 403) return LOCKOUT_MESSAGE;
      if (err.status === 400) {
        if (this.mode() === 'register') {
          const errors = getApiErrorList(err);
          const duplicateEmail = errors?.some(m => /is already taken/i.test(m));
          if (duplicateEmail) return 'Já existe uma conta com este e-mail. Faça login.';
          return 'Verifique os dados informados.';
        }
        return getApiErrorMessage(err, 'Verifique os dados informados.');
      }
      if (err.status === 401) return 'E-mail ou senha incorretos.';
    }
    return NETWORK_ERROR;
  }
}