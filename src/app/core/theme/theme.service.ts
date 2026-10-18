import { Injectable, effect, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark';

const STORAGE_KEY = 'gem-theme';

// Tema claro/escuro (D19): o padrão é claro; a escolha fica em localStorage e é
// aplicada como data-theme em <html>. O index.html já aplica o tema antes do
// bootstrap para evitar flash, este serviço mantém em sincronia na navegação.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly preference = signal<ThemePreference>(readStoredPreference());

  constructor() {
    effect(() => {
      const pref = this.preference();
      document.documentElement.setAttribute('data-theme', pref);
      try {
        localStorage.setItem(STORAGE_KEY, pref);
      } catch {
        // Ambiente sem localStorage (ex.: alguns testes) — preferência só vive na sessão.
      }
    });
  }
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}
