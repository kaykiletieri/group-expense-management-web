# Documentação — group-expense-management-web

Frontend Angular do Group Expense Management. Consome a API do repositório irmão
`group-expense-management` (dotnet, concluída).

## Índice

| Documento | Conteúdo |
|---|---|
| `../AGENTS.md` | Instruções operacionais para agentes e contribuidores |
| `product.md` | Escopo do produto no frontend, personas, telas |
| `roadmap.md` | Etapas de implementação do frontend |
| `architecture.md` | Stack Angular, organização, auth, proxy, deploy |
| `design-system.md` | Tokens de design, tipografia, componentes, padrões |
| `ui-spec.md` | Mapa de rotas/telas, contratos de API por tela, estados e mensagens |
| `decisions.md` | Registro de decisões (ADRs) |
| `deploy.md` | Build, fontes self-hosted e publicação same-origin |

## Referências visuais (fonte canônica)

Os protótipos aprovados estão em `../design/prototipos/`:

- `meus_grupos_bold_playful_code.html` — lista de grupos + balanço geral;
- `detalhes_do_grupo_viagem_para_ubatuba_code.html` — detalhe do grupo;
- `nova_despesa_bold_playful_code.html` — formulário de nova despesa;
- `editar_despesa_bold_playful_code.html` — formulário de edição de despesa;
- `autentica_o_bold_playful_code.html` — login/cadastro;
- `design-tokens-originais.md` — tokens originais (DESIGN.md do Stitch);
- `design-spec-racha.md` — especificação full de componentes/microcopy.

Estes HTML usam Tailwind CDN apenas como protótipo; a implementação real usa os tokens
de `design-system.md` em SCSS (sem Tailwind). Marca final decidida: **rachaae** (D28).
