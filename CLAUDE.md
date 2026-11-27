# Claude Code & AI Agent Instructions — NutriSaaS

Leia e siga rigorosamente as diretrizes centrais definidas em:
- `AGENTS.md` (Arquitetura Geral, Clean Code, Multi-Tenancy, Segurança Clínica, Planos e TDD)
- `.agents/rules/01-arquitetura-clean-code.md`
- `.agents/rules/02-regras-negocio-seguranca.md`
- `.agents/rules/03-tdd-e-testes.md`
- `.agents/rules/04-git-branches-ci.md`
- `.agents/rules/05-saas-planos-e-backoffice.md`
- `plan/ordem-de-guerra-nutrisaas.md` (Plano Mestre SaaS, Cotas, Backoffice e Esteira DockNotes)

## Comandos Essenciais do Monorepo
- **Rodar todos os testes unitários**: `npm test`
- **Rodar testes apenas da API**: `npm test --workspace=@nutricao/api`
- **Rodar testes apenas do Web**: `npm test --workspace=@nutricao/web`
- **Verificar tipos (TypeScript Lint)**: `npm run lint`
- **Build de produção**: `npm run build`

## Regras Rápidas Obrigatórias
1. **Nunca use `prisma` direto em `*.controller.ts`**. Toda lógica de banco e negócio fica em `*.service.ts` (ou `*.usecase.ts`).
2. **Nunca chame `api.get/post/put/delete` direto em componentes `.tsx`**. Use sempre funções tipadas em `apps/web/src/services/*.ts`.
3. **Isolamento Multi-Tenant**: Toda query no banco deve filtrar por `clinicaId`.
4. **TDD**: Toda regra de cálculo ou novo método de service deve ter cobertura em `*.spec.ts`, e todo endpoint clínico novo deve ser incluído em `apps/api/src/test/clinical-authorization.spec.ts`.

