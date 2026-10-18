import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { copyToClipboard } from './copy-text';

describe('copyToClipboard', () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
  });

  it('usando a Clipboard API, copia e retorna true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    vi.stubGlobal('isSecureContext', true);

    const ok = await copyToClipboard('racha!');

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('racha!');
  });

  it('sem Clipboard API disponível, cai no execCommand', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    vi.stubGlobal('isSecureContext', false);

    const execCommand = vi.fn().mockReturnValue(true);
    document.execCommand = execCommand as unknown as typeof document.execCommand;

    const ok = await copyToClipboard('racha!');

    expect(ok).toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
  });
});

