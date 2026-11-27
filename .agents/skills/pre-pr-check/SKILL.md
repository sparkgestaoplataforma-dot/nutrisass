---
name: pre-pr-check
description: >-
  Use this skill before committing, opening a Pull Request, or finishing a feature
  to verify code standards, Clean Architecture compliance, RBAC/Zod/Multi-tenant
  security, TypeScript types, unit tests, and production build across NutriSaaS.
---

# Skill: Auditoria Pré-PR e Gate de Qualidade (`pre-pr-check`)

Execute todos os passos abaixo antes de concluir uma entrega ou abrir um Pull Request para a `develop` (ou `main` em hotfix/release).

## 1. Auditoria Arquitetural e de Segurança Rápida
1. **Zero `prisma` em controllers**:
   ```bash
   grep -rn "shared/providers/prisma" apps/api/src/modules/*/*/*.controller.ts
   ```
   *(Resultado esperado: nenhuma ocorrência)*.
2. **Zero chamadas HTTP diretas fora de `apps/web/src/services/` nos arquivos alterados**:
   ```bash
   grep -rn "@/services/api" apps/web/src/pages/ apps/web/src/components/
   ```
   *(Resultado esperado: nenhuma nova ocorrência nos componentes/páginas tocados pela branch)*.
3. **Zero checagem hardcoded de nome de plano**:
   ```bash
   grep -rnE "plano\s*===|plano\s*!==" apps/
   ```
   *(Resultado esperado: nenhuma ocorrência; usar apenas `featureGuard`, `assertQuota` e `useEntitlements`)*.
4. **Revisão das rotas alteradas na branch**:
   Inspecione `git diff origin/develop...HEAD -- "apps/api/src/modules/"`:
   - Toda rota `POST`, `PUT` ou `PATCH` com payload possui `validate(schema)`?
   - Possui o guard adequado (`clinicalGuard`, `roleGuard`, `featureGuard` ou `superAdminMiddleware`)?
   - Todas as FKs recebidas no `body` validam pertença à `clinicaId` no Service?
   - Se tocou em `/api/backoffice/*`, garante que nenhum dado clínico nominal de paciente é retornado (LGPD)?

## 2. Verificação de Tipos (TypeScript Lint)
Execute na raiz do monorepo:
```bash
npm run lint
```
*(Deve finalizar com código `0` em `@nutricao/shared`, `@nutricao/api` e `@nutricao/web`)*.

## 3. Execução de Todos os Testes Unitários
Execute na raiz do monorepo:
```bash
npm test
```
*(Todas as suítes do Vitest na API e no Web devem passar sem erros)*.

## 4. Build de Produção
Execute na raiz do monorepo:
```bash
npm run build
```
*(Garante que `tsc`, `tsc-alias` e `vite build` geram os artefatos de produção sem falhas)*.

## 5. Descrição do Pull Request (GitFlow)
Após o commit e `git push` da branch, execute a skill `.agents/skills/gerar-descricao-pr/SKILL.md` para gerar o Markdown preenchido com base em `.github/pull_request_template.md`, pronto para colar no GitHub.
