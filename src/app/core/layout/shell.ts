import { Component, signal, computed, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly menuOpen = signal(false);
  readonly isDesktopView = signal(false);

  // Header state based on route
  readonly headerTitle = signal('Grupos');
  readonly showBack = signal(false);
  readonly showMenu = signal(false);

  ngOnInit(): void {
    this.checkViewport();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.updateHeaderForRoute());
    this.updateHeaderForRoute();
  }

  ngOnDestroy(): void {
    this.menuOpen.set(false);
  }

  @HostListener('window:resize')
  onResize(): void { this.checkViewport(); }

  private checkViewport(): void {
    this.isDesktopView.set(window.innerWidth >= 768);
    if (this.isDesktopView()) this.menuOpen.set(false);
  }

  isDesktop(): boolean { return this.isDesktopView(); }
  isMobile(): boolean { return !this.isDesktopView(); }

  toggleMenu(): void { this.menuOpen.update(v => !v); }

  private updateHeaderForRoute(): void {
    const url = this.router.url;
    if (url.startsWith('/grupos/') && url.includes('/despesas/')) {
      this.headerTitle.set(url.includes('/editar') ? 'Editar Despesa' : 'Nova Despesa');
      this.showBack.set(true);
      this.showMenu.set(false);
    } else if (url.startsWith('/grupos/')) {
      this.headerTitle.set('Detalhes do Grupo');
      this.showBack.set(true);
      this.showMenu.set(true);
    } else if (url === '/ajustes') {
      this.headerTitle.set('Ajustes');
      this.showBack.set(false);
      this.showMenu.set(false);
    } else if (url === '/atividade') {
      this.headerTitle.set('Atividade');
      this.showBack.set(false);
      this.showMenu.set(false);
    } else {
      this.headerTitle.set('Grupos');
      this.showBack.set(false);
      this.showMenu.set(false);
    }
  }

  onMenuAction(action: 'rename' | 'delete'): void {
    this.menuOpen.set(false);
    // Emit event or navigate - handled by child components via service or output
    // For now, we'll use a custom event
    window.dispatchEvent(new CustomEvent('shell:menu', { detail: { action } }));
  }
}