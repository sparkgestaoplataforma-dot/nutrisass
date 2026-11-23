---
name: gerar-descricao-pr
description: >-
  Use this skill at the end of a feature/fix/refactor branch (after git push and
  pre-pr-check) to generate a complete, copy-paste-ready Markdown PR description
  following .github/pull_request_template.md for code review in NutriSaaS.
---

# Skill: Gerar Descrição de Pull Request (Markdown)

Ao finalizar o fluxo GitFlow (após `pre-pr-check` passar e realizar o `git push` da branch para `develop` ou `main`), gere obrigatoriamente a descrição do PR em **bloco Markdown pronto para copiar e colar** no GitHub, seguindo exatamente a estrutura de `.github/pull_request_template.md`.

## Passo 1 — Coletar Fatos Reais da Branch
1. Verifique os commits e arquivos alterados contra a branch base (`develop` ou `main`):
   - `git log origin/develop..HEAD --oneline` (ou `origin/main..HEAD`)
   - `git diff --stat origin/develop..HEAD`
2. Identifique:
   - Se houve alteração em `apps/api/prisma/schema.prisma` ou novas pastas em `apps/api/prisma/migrations/`.
   - Os resultados reais da última execução de `npm run lint`, `npm test` e `npm run build`.
   - Caminhos e linhas exatas dos principais arquivos alterados para comprovar cada critério de aceite.

## Passo 2 — Preencher o Template com Rigor Factual
Regras ao preencher cada seção:
- **`## O que mudou`**: 1 a 3 frases curtas focadas no valor para o usuário final (ex.: nutricionista, secretária, paciente) e na motivação clínica/arquitetural.
- **`## Como testei`**: Marque `[x]` apenas nos itens realmente executados após a última edição. Se algo não foi testado no navegador pelo agente, deixe `[ ]` para o revisor marcar ou indique explicitamente *"Testado manualmente pelo usuário"*.
- **`## Critérios de aceite e validações`**: Liste cada entrega em formato objetivo com evidência verificável:
  - Ex.: `- [x] **PASS** — Cálculo de bioimpedância e limites clínicos (`nutricaoCalculos.ts:738`, `nutricaoCalculos.spec.ts:554`)`
- **`## Banco de dados / Variáveis de ambiente`**: Marque se há migration Prisma pendente (`npx prisma migrate deploy`) ou se não houve alterações.
- **`## Fora do escopo / dúvidas`**: Informe o que foi propositalmente deixado para etapas futuras, débitos conhecidos ou decisões de design que o revisor deve observar.

## Passo 3 — Entregar ao Usuário
Apresente o texto completo dentro de um bloco ````markdown ... ```` (usando quatro crases se houver blocos internos) junto com o link do PR para que o usuário apenas copie, cole no GitHub e revise.
