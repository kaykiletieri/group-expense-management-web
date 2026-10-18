import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

// Efeitos zoneless agendam em microtask/universal scheduler; settle garante flush.
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('ThemeService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.removeItem('gem-theme');
  });

  afterEach(() => {
    localStorage.removeItem('gem-theme');
  });

  it('o padrão é claro', async () => {
    const svc = TestBed.inject(ThemeService);
    await settle();
    expect(svc.preference()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it(' aplica "dark" explicitamente e persiste a preferência em localStorage', async () => {
    const svc = TestBed.inject(ThemeService);
    svc.preference.set('dark');
    await settle();
    expect(svc.preference()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('gem-theme')).toBe('dark');
  });

  it('voltar para "light" reverte o tema do documento', async () => {
    const svc = TestBed.inject(ThemeService);
    svc.preference.set('dark');
    await settle();
    svc.preference.set('light');
    await settle();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
