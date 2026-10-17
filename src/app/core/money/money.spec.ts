import { describe, expect, it } from 'vitest';
import { formatBrl, parseAmountInputToCents } from './money';

describe('formatBrl', () => {
  // Intl pt-BR usa espaço não-separável (U+00A0) entre o símbolo e o número.
  const brl = (n: string) => n.replace(' ', '\u00a0');

  it('formata centavos exatos como BRL', () => {
    expect(formatBrl(3334)).toBe(brl('R$ 33,34'));
    expect(formatBrl(3333)).toBe(brl('R$ 33,33'));
    expect(formatBrl(10000)).toBe(brl('R$ 100,00'));
    expect(formatBrl(1)).toBe(brl('R$ 0,01'));
    expect(formatBrl(0)).toBe(brl('R$ 0,00'));
  });

  it('formata valores negativos (saldo devedor) com sinal', () => {
    expect(formatBrl(-3334)).toBe(brl('-R$ 33,34'));
  });

  it('rejeita não-inteiros (dinheiro nunca é float)', () => {
    expect(() => formatBrl(33.34)).toThrow();
    expect(() => formatBrl(1.5)).toThrow();
  });
});

describe('parseAmountInputToCents', () => {
  it('interpreta vírgula como decimal', () => {
    expect(parseAmountInputToCents('33,34')).toBe(3334);
    expect(parseAmountInputToCents('0,01')).toBe(1);
    expect(parseAmountInputToCents('1200,5')).toBe(120050);
  });

  it('ignora pontos de milhar e espaços/prefixo R$', () => {
    expect(parseAmountInputToCents('1.380,00')).toBe(138000);
    expect(parseAmountInputToCents(' 1.380 ')).toBe(138000);
    expect(parseAmountInputToCents('R$ 25,90')).toBe(2590);
  });

  it('interpreta inteiro sem separador', () => {
    expect(parseAmountInputToCents('380')).toBe(38000);
    expect(parseAmountInputToCents('100')).toBe(10000);
  });

  it('interpreta milhar em grupos de 3 sem vírgula', () => {
    expect(parseAmountInputToCents('3.800')).toBe(380000);
    expect(parseAmountInputToCents('1.380.000')).toBe(138000000);
  });

  it('rejeita inválidos, negativos, zero e três casas', () => {
    expect(parseAmountInputToCents('')).toBeNull();
    expect(parseAmountInputToCents('abc')).toBeNull();
    expect(parseAmountInputToCents('0')).toBeNull();
    expect(parseAmountInputToCents('0,00')).toBeNull();
    expect(parseAmountInputToCents('-5,00')).toBeNull();
    expect(parseAmountInputToCents('1,005')).toBeNull();
    expect(parseAmountInputToCents('1,2,3')).toBeNull();
    // ponto ambíguo sem padrão de milhar: rejeita em vez de adivinhar
    expect(parseAmountInputToCents('1.2')).toBeNull();
    expect(parseAmountInputToCents('12.34')).toBeNull();
  });
});
