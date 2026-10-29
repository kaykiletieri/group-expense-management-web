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

  ngOnInit(): void {
    this.title.setTitle('Entrar - Rachaae');
  }

  readonly mode = signal<'login' | 'register'>('login');
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly passwordStrength = signal(0);

  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  setMode(mode: 'login' | 'register') {
    this.mode.set(mode);
    this.errorMessage.set(null);
    this.showPassword.set(false);
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

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  onPasswordInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    this.updatePasswordStrength(value);
  }

  private updatePasswordStrength(password: string) {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    this.passwordStrength.set(Math.min(strength, 4));
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

        // Cadastro NÃO estabelece sessão (sem cookie): autenticar de verdade
        // antes de navegar, senão a primeira tela autenticada falha com 401.
        if (this.mode() === 'register') {
          this.auth.login(payload).subscribe({
            next: () => this.navigateAfterAuth(),
            error: (err: unknown) => {
              this.submitting.set(false);
              this.errorMessage.set(this.humanizeError(err));
            },
          });
          return;
        }

        this.navigateAfterAuth();
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(this.humanizeError(err));
      },
    });
  }

  private navigateAfterAuth() {
    this.submitting.set(false);
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/grupos';
    void this.router.navigateByUrl(returnUrl);
  }

  private humanizeError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 403) {
        return LOCKOUT_MESSAGE;
      }
      if (err.status === 400) {
        if (this.mode() === 'register') {
          // Corpo do cadastro (Identity) usa { errors: [...] }, com descrições
          // em inglês. Elas não podem aparecer cruas: mapeamos para pt-BR.
          const errors = getApiErrorList(err);
          const duplicateEmail = errors?.some((message) =>
            /is already taken/i.test(message),
          );
          if (duplicateEmail) {
            return 'Já existe uma conta com este e-mail. Faça login.';
          }
          return 'Verifique os dados informados.';
        }
        return getApiErrorMessage(err, 'Verifique os dados informados.');
      }
      if (err.status === 401) {
        return 'E-mail ou senha incorretos.';
      }
    }
    return NETWORK_ERROR;
  }

  getPasswordStrengthBars() {
    const strength = this.passwordStrength();
    return Array.from({ length: 4 }, (_, i) => i < strength);
  }

  getPasswordStrengthLabel() {
    const strength = this.passwordStrength();
    if (strength === 0) return { label: 'Muito fraca', color: 'error' };
    if (strength === 1) return { label: 'Fraca', color: 'error' };
    if (strength === 2) return { label: 'Regular', color: 'warning' };
    if (strength === 3) return { label: 'Boa', color: 'tertiary' };
    return { label: 'Forte & protegida', color: 'tertiary' };
  }
}