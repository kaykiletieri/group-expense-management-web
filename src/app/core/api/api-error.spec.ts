import { describe, expect, it } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { getApiErrorMessage } from './api-error';

describe('getApiErrorMessage', () => {
  it('extrai a mensagem do corpo { error } do backend', () => {
    const err = new HttpErrorResponse({ status: 409, error: { error: 'Mensagem do backend' } });
    expect(getApiErrorMessage(err, 'fallback')).toBe('Mensagem do backend');
  });

  it('usa fallback quando o corpo não tem mensagem útil', () => {
    expect(getApiErrorMessage(new HttpErrorResponse({ status: 500 }), 'fallback')).toBe('fallback');
    expect(getApiErrorMessage(new HttpErrorResponse({ status: 0, error: null }), 'fallback')).toBe(
      'fallback',
    );
    expect(getApiErrorMessage(new Error('qualquer'), 'fallback')).toBe('fallback');
  });
});
