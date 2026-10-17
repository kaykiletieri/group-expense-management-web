# Deploy

Direção aceita (D17): o frontend deve servir na **mesma origem da API** para o cookie
httpOnly `gem_session` continuar same-origin. Sem CDN de domínio cruzado nesta fase.

## Build

```bash
npm run build
# saída: dist/racha-web/browser
```

## Fontes self-hosted

As fontes (Space Grotesk, Manrope, Material Symbols) vivem em `public/fonts/` e são
referenciadas por `public/fonts/fonts.css` (incluído no `index.html`). Nenhuma requisição
externa para hosting de fontes.

Para regenerar (ex.: atualizar pesos):

```powershell
powershell -ExecutionPolicy Bypass -File tools/download-fonts.ps1
```

O script converte as URLs do Google Fonts em nomes determinísticos (hash da URL) —
regenerações produzem os mesmos nomes de arquivo.

## Opção A — Servir pela própria API (ASP.NET Core)

Publicar o conteúdo de `dist/racha-web/browser` como estáticos do backend:

1. Copiar os arquivos para `GroupExpenseManagement.Api/wwwroot/`.
2. No backend: usar `UseDefaultFiles` + `UseStaticFiles` e fallback SPA para `index.html`
   (rotas de front como `/grupos` devem cair no app, não em 404).
3. Requer alteração no `Program.cs` do backend — solicitar aprovação ao usuário antes de
   implementar (o backend está concluído).

CORS permanece desnecessário (same-origin).

## Opção B — Reverse proxy

Nginx/Caddy na frente: `/api/*` → API; demais caminhos → estáticos do front.
Útil se o deploy não for na própria máquina do backend.

## Checklist de publicação

- [ ] `npm run build` sem erros nem warnings
- [ ] `npm test` passando
- [ ] Sem segredos no bundle (revisar `dist/` antes de publicar)
- [ ] Deep links (`/grupos/x`, `/login`) resolvidos pelo fallback SPA
- [ ] Sessão: login → recarregar página (F5) → continua autenticado (cookie same-origin)
- [ ] Revisão de privacidade pendente antes do lançamento (não afirma-se compliance -
      ver AGENTS.md §7 no repo backend)
