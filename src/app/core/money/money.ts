const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/**
 * Formata um valor em centavos integer como moeda BRL (ex.: 3334 → "R$ 33,34").
 * Único ponto de formatação monetária do app: dinheiro é sempre centavos inteiros.
 */
export function formatBrl(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`Money must be an integer amount of cents: ${cents}`);
  }
  return brlFormatter.format(cents / 100);
}

/**
 * Converte o texto digitado pelo usuário (pt-BR) em centavos inteiros positivos.
 * Regras determinísticas:
 * - vírgula é separador decimal; ponto só é separador de milhar;
 * - com vírgula: todos os pontos são milhares (ex.: "1.380,50");
 * - sem vírgula: aceita inteiro puro ou milhares em grupos de 3 (ex.: "1.380");
 *   outras combinações ("1.2", "12.34") são rejeitadas para não adivinhar intenção;
 * - no máximo 2 casas decimais (terceira casa é rejeitada, nunca arredondada silenciosamente);
 * - aceita prefixo "R$" opcional e espaços;
 * - retorna null quando inválido, vazio, negativo ou zero.
 */
export function parseAmountInputToCents(input: string): number | null {
  const cleaned = input.replace(/R\$/gi, '').replace(/\s/g, '');

  if (cleaned === '' || cleaned === ',') {
    return null;
  }

  let normalized: string;

  if (cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, '');
  } else if (/^\d+$/.test(cleaned)) {
    normalized = cleaned;
  } else {
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const cents = Math.round(Number(normalized) * 100);

  if (cents <= 0) {
    return null;
  }

  return cents;
}
