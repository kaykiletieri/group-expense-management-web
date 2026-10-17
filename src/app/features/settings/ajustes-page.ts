import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-ajustes-page',
  imports: [],
  templateUrl: './ajustes-page.html',
  styleUrl: './ajustes-page.scss',
})
export class AjustesPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly loggingOut = signal(false);
  readonly errorMessage = signal<string | null>(null);

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
