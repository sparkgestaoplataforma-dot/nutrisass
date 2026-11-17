# Regra 04 — Padrão de Branches, Commits e CI/CD

## 1. Estratégia de Branches
- `main`: Branch principal de produção. Código na `main` deve estar sempre estável, com `lint`, `test` e `build` passando.
- Branches de desenvolvimento devem ser criadas a partir da branch principal seguindo a nomenclatura:
  - `feat/<modulo>-<descricao-curta>` (ex.: `feat/medidas-composicao-corporal`)
  - `fix/<modulo>-<descricao-curta>` (ex.: `fix/plano-medida-caseira`)
  - `refactor/<modulo>-<descricao-curta>` (ex.: `refactor/api-clean-services`)
  - `test/<modulo>-<descricao-curta>` (ex.: `test/exames-service-unit`)
  - `chore/<descricao-curta>` (ex.: `chore/ci-github-actions`)

## 2. Padrão de Mensagens de Commit (Conventional Commits)
Sempre escreva commits em português claro no formato:
`<tipo>(<escopo>): <descrição no imperativo sem ponto final>`

Tipos permitidos:
- `feat`: Nova funcionalidade clínica ou de sistema
- `fix`: Correção de bug
- `refactor`: Refatoração de código sem alterar comportamento externo
- `test`: Adição ou correção de testes unitários/E2E
- `docs`: Alterações em documentação, `AGENTS.md`, rules ou skills
- `chore`: Configurações de build, CI, dependências

## 3. Gate de Qualidade (CI — GitHub Actions)
O workflow `.github/workflows/ci.yml` valida automaticamente qualquer Push ou Pull Request:
1. Geração do Prisma Client (`npm run db:generate --workspace=@nutricao/api`)
2. TypeScript Typecheck em todos os pacotes (`npm run lint`)
3. Suíte completa de Testes Unitários (`npm test`)
4. Build completo de produção (`npm run build`)

Nenhuma alteração deve ser considerada pronta sem que os 4 passos passem localmente sem erros.

