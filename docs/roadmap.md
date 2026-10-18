# Roadmap — Frontend

Etapa 4 do produto (o backend — etapas 1–3 — está concluído). Cada etapa termina com
`ng build` limpo e, onde aplicável, testes.

## E1 — Scaffold e fundação
- `ng new` no root do repo (SCSS, sem SSR), proxy dev, interceptor/guard básicos,
  tokens SCSS do design system, fontes (Google Fonts), rotas lazy vazias,
  header + bottom-nav shell.
- Build limpo; README do app atualizado.

## E2 — Dinheiro e modelos
- `formatBrl(cents)`, conversão de input para centavos (+ testes),
  API clients tipados por domínio (auth/groups/participants/expenses/balances).

## E3 — Auth
- Tela login/cadastro (tabs), validações, erros de API, lockout message, guard,
  `/ajustes` com e-mail + sair.

## E4 — Grupos
- Lista "Meus grupos" (via `GET /api/groups/overviews`, D10), criar grupo,
  detalhe completo (saldos, despesas, participantes com remoção recalculada
  (D22), renomear/excluir).

## E5 — Despesas
- Nova/editar despesa completa, exclusão, preview de rateio estimado,
  estados de loading/empty/erro por seção.

## E6 — Polimento de acessibilidade e UX
- Foco visível, toque 44px, tabular-nums conferidos, skeletons,
  pós-deleção de despesa recalculando saldos, revisão de contraste.

## E7 — Publicação preparatória (fora do escopo inicial)
- Self-host das fontes, same-origin serving, revisão de privacidade
  (ver `AGENTS.md` §7 no repo backend — não afirmar compliance sem revisão).
