---
name: executar-task
description: >-
  Use this skill when implementing a SAASN-XX issue from DockNotes end-to-end in
  NutriSaaS: reading the card drawer, verifying assignee ownership, moving status to
  Fazendo, creating the GitFlow branch from develop, executing TDD Red-Green-Refactor,
  running pre-pr-check, and generating the PR description.
---

# Skill: Executar Task Ponta a Ponta (`executar-task`)

Siga este fluxo padronizado sempre que o usuário pedir para implementar uma issue `SAASN-XX` do DockNotes.

## Passo 1 — Leitura no DockNotes e Trava de Responsável
1. Siga `.agents/skills/docknotes-board/SKILL.md` (**Fluxo 2**):
   - Abra `EXECUÇÃO > Sprint Ativa` (ou `Fluxo de trabalho > Backlog` se indicado), clique no card `SAASN-XX` e leia todo o Drawer (`Descrição`, `Sub-tasks`, `Checklists`, `Comentários` e `Responsáveis`).
   - **Valide o Responsável**: Confirme que `Jeffson Luiz Oliveira de Lima Santos` está em `Responsáveis`. Caso contrário, interrompa e avise o usuário.
   - **Mova para `Fazendo`**: Altere o `Status` do card para **`Fazendo`**.

## Passo 2 — Diagnóstico Rápido no Código (Se o Card Antigo Não Estiver "Mastigado")
- Se o card já tiver o contrato completo da skill `especificar-task`, siga-o diretamente.
- Se for um card legado/curto (ex.: apenas título ou resumo breve), inspecione os arquivos afetados no repositório e monte internamente o checklist de:
  - Contratos Zod (`@nutricao/shared`) e Prisma (`schema.prisma`)
  - Isolamento `clinicaId` + FKs do payload (`.agents/rules/02-regras-negocio-seguranca.md`)
  - Guards RBAC (`clinicalGuard` / `roleGuard`) e Cotas/Features (`05-saas-planos-e-backoffice.md`)
  - Cenários de teste unitário (TDD)

## Passo 3 — Preparar Branch GitFlow a partir da `develop`
1. Certifique-se de partir da branch `develop` limpa e atualizada.
2. Crie a branch no padrão de `.agents/rules/04-git-branches-ci.md`:
   - `feat/<modulo>-saasn-<numero>-<slug>`
   - `fix/<modulo>-saasn-<numero>-<slug>`
   - `refactor/<modulo>-saasn-<numero>-<slug>`

## Passo 4 — Desenvolvimento Guiado por Testes (TDD: Red → Green → Refactor)
1. Se envolver API/Backend, siga `.agents/skills/criar-modulo-api/SKILL.md`.
2. Se envolver cálculo clínico/antropométrico, siga `.agents/skills/criar-calculo-nutricional/SKILL.md`.
3. Se encontrar código legado fora de Clean Architecture no módulo tocado, aplique `.agents/skills/padronizar-modulo/SKILL.md` dentro do escopo seguro.
4. Escreva primeiro os testes falhando (**Red**), implemente a solução mínima limpa (**Green**) e refatore mantendo os testes verdes (**Refactor**).

## Passo 5 — Gate de Qualidade (`pre-pr-check`)
Execute obrigatoriamente `.agents/skills/pre-pr-check/SKILL.md`:
1. Auditorias `grep` de Clean Architecture e segurança.
2. `npm run lint` (`0` erros).
3. `npm test` (`0` falhas).
4. `npm run build` (`0` erros).

## Passo 6 — Entrega, Commit e Descrição de PR
1. Realize commit(s) seguindo Conventional Commits em português (ex.: `fix(agenda): valida clinicaId na edicao e exclusao de agendamentos`).
2. Quando o usuário solicitar push/abertura de PR, execute `.agents/skills/gerar-descricao-pr/SKILL.md` entregando o Markdown completo pronto para colar no GitHub.
3. **Lembrete DockNotes**: Mantenha o card em **`Fazendo`** — o movimento final para **`Concluído`** cabe exclusivamente ao humano após revisão.
