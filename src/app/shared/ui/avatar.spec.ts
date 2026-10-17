import { describe, expect, it } from 'vitest';
import { avatarClassOf, initialsOf } from './avatar';

describe('initialsOf', () => {
  it('usa primeiras letras de nome e sobrenome', () => {
    expect(initialsOf('Renata Almeida')).toBe('RA');
    expect(initialsOf('ana')).toBe('AN');
    expect(initialsOf('Luiz Gomes Freitas')).toBe('LF');
  });

  it('quando sem nenhum nome, mostra placeholder', () => {
    expect(initialsOf('   ')).toBe('?');
    expect(initialsOf('')).toBe('?');
  });
});

describe('avatarClassOf', () => {
  it('é determinístico e estável', () => {
    expect(avatarClassOf('Renata')).toBe(avatarClassOf('Renata'));
    expect(avatarClassOf('Bruno')).toBe(avatarClassOf('Bruno'));
  });

  it('sempre retorna uma classe conhecida', () => {
    for (const name of ['A', 'B', 'Carla Souza', 'Zé', '123']) {
      expect(avatarClassOf(name)).toMatch(/^av-(co|or|li|ro|te|am)$/);
    }
  });
});
