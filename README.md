# group-expense-management-web

Interface web do **Group Expense Management** — organização de despesas compartilhadas em grupos.
Backend (API C#/.NET) vive no repositório irmão `group-expense-management`.

## Stack

- Angular (standalone components + signals), SCSS com design tokens próprios, sem kit de UI.
- Autenticação via cookie de sessão (`gem_session`) do backend; em dev, proxy `/api` para
  `https://localhost:3000` (ver `proxy.conf.json`).

## Documentação

- `AGENTS.md` — instruções para agentes/contribuidores.
- `docs/` — produto, arquitetura, design system, spec de telas, roadmap e decisões.
- `design/prototipos/` — protótipos aprovados (referência visual).

## Desenvolvimento

```bash
npm install
npm start        # ng serve com https + proxy para a API
npm test         # unit tests
npm run build    # build de produção
```

A API precisa estar rodando (`dotnet run` no repo do backend) para as telas autenticadas.
