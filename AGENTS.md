# AGENTS.md — Instruções para agentes de IA (frontend)

Este arquivo orienta agentes de IA que trabalhem no repositório `group-expense-management-web`.
O projeto é o frontend Angular do **Group Expense Management**, consumindo a API do repositório
irmão `group-expense-management` (C#/.NET, já concluída e estável).

## 1. Antes de começar

1. Leia `docs/README.md` para o índice de documentos.
2. Leia, conforme a tarefa:
   - `docs/product.md` — escopo do produto no frontend;
   - `docs/roadmap.md` — ordem sugerida de implementação;
   - `docs/architecture.md` — stack e diretrizes técnicas;
   - `docs/design-system.md` — tokens visuais e componentes;
   - `docs/ui-spec.md` — telas, rotas, estados e mensagens;
   - `docs/decisions.md` — decisões (ADRs) já tomadas; não reabra decisões fechadas sem aprovação do usuário.
3. As referências visuais canônicas estão em `design/prototipos/` (HTML Tailwind + notes MD gerados via Stitch).
   Aplique-os como fonte de layout, microcopy e estilo.
4. Inspecione o código existente antes de propor mudanças. Não presuma que um componente, serviço
   ou padrão já existe.

## 2. Contexto

- O usuário cria conta, realiza login e administra grupos com participantes, despesas e saldos.
- O frontend é **mobile-first**, em **pt-BR**, com valores monetários em BRL.
- O usuário não tem proficiência em frontend: prefira soluções simples, explícitas e padrão do
  Angular CLI; evite abstrações e dependências desnecessárias; explique mudanças em termos de
  comportamento visível, não de jargão.

## 3. Regras de negócio que a UI deve respeitar (espelham o backend)

- Preços são sempre **centavos inteiros** (`TotalAmountInCents` etc.). Nunca use `float`/`double`
  para dinheiro; toda formatação BRL parte de centavos via função centralizada.
- A divisão do rateio é sempre **igualitária** e feita pelo backend; o restante de centavos é
  distribuído de forma determinística. O cliente apenas exibe; não recalcule saldos.
- Pagador pode ficar fora do rateio; nenhum participante se repete na divisão.
- A soma dos saldos de um grupo é sempre zero; o balanço geral entre grupos é calculado no cliente
  (ver `docs/decisions.md`, D10).
- Somente o criador administra o grupo. O backend devolve **404** (não 403) para quem não tem
  acesso — não vaze a existência do grupo na UI.

## 4. Contratos e erros

- Os contratos exatos estão em `docs/ui-spec.md` (mapa de endpoints) e no código em
  `../group-expense-management/src/GroupExpenseManagement.Api/Contracts/` — consulte os
  contratos no repositório do backend antes de alterar tipos no frontend.
- JSON é `camelCase`. Respostas de criação retornam apenas `{ id }`.
- Estatuto de erros padronizado: `400` = validação, `401` = não autenticado, `403` = bloqueio por
  tentativas de login, `404` = recurso inexistente ou sem acesso, `409` = ponta conflituosa
  (ex.: participante com despesas associadas).

## 5. Autenticação e rede

- Auth é via cookie httpOnly (`gem_session`, Secure/SameSite Lax). **Nenhum token em JS.**
- Em desenvolvimento, use o proxy do Angular dev server para manter a sessão same-origin
  (ver `docs/architecture.md` seção Dev/Proxy).
- Nunca logue segredos, senhas ou cookies.

## 6. Implementação

- Componentes **standalone** com **signals**; sem NgRx/stores externos.
- Sem kit de UI (Angular Material etc.): componentes próprios com os tokens de `docs/design-system.md`.
- Fontes: Space Grotesk + Manrope + Material Symbols (ver decisões D3).
- Formulários reativos; validação estrutural no cliente, regras de domínio sempre no backend.
- Rotas lazy por feature; guards de autenticação.
- Nomes em inglês no código (identificadores), textos de exibição em pt-BR.
- Commits pequenos, em conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`).

## 7. Testes e validação

- Use o runner padrão da versão do Angular CLI instalada (`ng test`); testes de componente
  para as partes críticas: formatação de dinheiro, guard de auth, formulário de despesa.
- `ng build` deve compilar sem erros nem warnings antes de encerrar uma tarefa.
- Execute o que for possível (build/testes) e informe claramente o que foi executado;
  nunca afirme que testes passaram sem tê-los executado.

## 8. Mudanças na documentação

- Ao mudar uma decisão (design, arquitetura, escopo de tela), atualize o documento afetado em
  `docs/` e registre a mudança em `docs/decisions.md`.
- Não documente como implementado algo que ainda não existe.
- Ao final da tarefa, resuma: arquivos alterados, decisão(s) tomada(s), comandos executados,
  testes executados e o que ficou pendente.

## 9. Escopo do MVP (não adicionar sem aprovação)

Sem aprovação explícita: divisões por peso/porcentagem/itens, liquidação de dívidas e pagamentos,
notificações, contas para participantes, colaboração multiusuário, categorias de grupo, upload de
foto/avatares, e2e pesado, SSR/hibridação com Node no deploy.
