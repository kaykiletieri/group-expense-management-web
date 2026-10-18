import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

const originalMatchMedia = window.matchMedia;

// Efeitos zoneless agendam em microtask/universal scheduler; settle garante flush.
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('ThemeService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();

    // jsdom não emula prefers-color-scheme; stub força "sistema escuro".
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: () => undefined,
      }),
    });

    localStorage.removeItem('gem-theme');
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    });
    localStorage.removeItem('gem-theme');
  });

  it('no padrão "auto", aplica data-theme conforme o sistema (escuro no stub)', async () => {
    const svc = TestBed.inject(ThemeService);
    await settle();
    expect(svc.preference()).toBe('auto');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('aplica "light" explicitamente', async () => {
    const svc = TestBed.inject(ThemeService);
    svc.preference.set('light');
    await settle();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('aplica "dark" explicitamente e persiste a preferência em localStorage', async () => {
    const svc = TestBed.inject(ThemeService);
    svc.preference.set('dark');
    await settle();
    expect(svc.preference()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('gem-theme')).toBe('dark');
  });
});
