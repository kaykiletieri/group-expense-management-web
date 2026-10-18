// O backend retorna erros com corpo { "error": "mensagem" }. Este helper extrai a
// mensagem para exibição, com fallback neutro quando indisponível (incl. falha de rede).

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === 'object' &&
    'error' in err &&
    err.error &&
    typeof err.error === 'object' &&
    'error' in err.error &&
    typeof err.error.error === 'string' &&
    err.error.error.length > 0
  ) {
    return err.error.error;
  }
  return fallback;
}

// O cadastro (Identity) usa outro corpo: { "errors": ["descrição", …] }.
// Devolve a lista de mensagens ou null quando o corpo não tem esse formato.
export function getApiErrorList(err: unknown): string[] | null {
  if (
    err &&
    typeof err === 'object' &&
    'error' in err &&
    err.error &&
    typeof err.error === 'object' &&
    'errors' in err.error &&
    Array.isArray(err.error.errors) &&
    err.error.errors.every((message) => typeof message === 'string')
  ) {
    return err.error.errors;
  }
  return null;
}
