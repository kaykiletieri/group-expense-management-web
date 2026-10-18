import { describe, expect, it } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { getApiErrorList, getApiErrorMessage } from './api-error';

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

describe('getApiErrorList', () => {
  it('extrai a lista do corpo { errors: [...] } do cadastro (Identity)', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: { errors: ["Email 'a@b.c' is already taken.", 'PasswordTooShort'] },
    });
    expect(getApiErrorList(err)).toEqual(["Email 'a@b.c' is already taken.", 'PasswordTooShort']);
  });

  it('devolve null quando o corpo não tem lista de strings', () => {
    expect(getApiErrorList(new HttpErrorResponse({ status: 400, error: { error: 'msg' } }))).toBeNull();
    expect(
      getApiErrorList(new HttpErrorResponse({ status: 400, error: { errors: ['ok', 42] } })),
    ).toBeNull();
    expect(getApiErrorList(new HttpErrorResponse({ status: 400 }))).toBeNull();
    expect(getApiErrorList(new Error('x'))).toBeNull();
  });
});
