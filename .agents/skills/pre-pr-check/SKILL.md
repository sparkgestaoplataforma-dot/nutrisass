---
name: pre-pr-check
description: >-
  Use this skill before committing, opening a Pull Request, or finishing a feature
  to verify code standards, Clean Architecture compliance, TypeScript types, unit
  tests, and production build across the NutriSaaS monorepo.
---

# Skill: Auditoria Pré-PR e Gate de Qualidade (`pre-pr-check`)

Execute todos os passos abaixo antes de concluir uma entrega ou abrir um Pull Request para a `main`.

## 1. Auditoria Arquitetural Rápida
1. Verifique se nenhum controller importa o `prisma` diretamente:
   `grep -rn "shared/providers/prisma" apps/api/src/modules/*/*/*.controller.ts`
   *(Resultado esperado: nenhuma ocorrência)*.
2. Verifique se nenhum componente React importa `services/api` diretamente nas abas padronizadas:
   `grep -rn "@/services/api" apps/web/src/pages/Pacientes/Prontuario/`
   *(Resultado esperado: nenhuma ocorrência)*.

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

