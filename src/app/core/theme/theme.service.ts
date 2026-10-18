import { Injectable, effect, signal } from '@angular/core';

export type ThemePreference = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'gem-theme';

// Tema opcional (D19): "auto" segue o sistema; a escolha fica em localStorage e
// é aplicada como data-theme em <html>. O index.html já aplica o tema antes do
// bootstrap para evitar flash, este serviço mantém em sincronia na navegação.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly preference = signal<ThemePreference>(readStoredPreference());
  private readonly systemDark = signal<boolean>(prefersDark());

  constructor() {
    effect(() => {
      const pref = this.preference();
      const effective = pref === 'auto' ? (this.systemDark() ? 'dark' : 'light') : pref;
      document.documentElement.setAttribute('data-theme', effective);
      try {
        localStorage.setItem(STORAGE_KEY, pref);
      } catch {
        // Ambiente sem localStorage (ex.: alguns testes) — preferência só vive na sessão.
      }
    });

    if (typeof window.matchMedia === 'function') {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (event) => this.systemDark.set(event.matches));
    }
  }
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' || stored === 'auto' ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

function prefersDark(): boolean {
  if (typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
