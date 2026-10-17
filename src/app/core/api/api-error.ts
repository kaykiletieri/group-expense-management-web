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
