# Regra 04 — Padrão de Branches (GitFlow), Commits e CI/CD

## 1. Estratégia de Branches (GitFlow Oficial)
- `main`: Branch de produção protegida. **Só aceita Pull Requests vindos de `develop` ou `hotfix/*`** (validado automaticamente pelo GitHub Actions).
- `develop`: Branch principal de integração de desenvolvimento. Todas as novas features, correções e refatorações devem partir da `develop` e abrir Pull Request de volta para a `develop`.
- Branches de trabalho (criadas a partir da `develop`):
  - `feat/<modulo>-<descricao-curta>` (ex.: `feat/medidas-composicao-corporal`)
  - `fix/<modulo>-<descricao-curta>` (ex.: `fix/plano-medida-caseira`)
  - `refactor/<modulo>-<descricao-curta>` (ex.: `refactor/web-clean-services`)
  - `test/<modulo>-<descricao-curta>` (ex.: `test/exames-service-unit`)
  - `chore/<descricao-curta>` (ex.: `chore/ci-github-actions`)
- Branches de correção crítica em produção (criadas a partir da `main`):
  - `hotfix/<descricao-curta>` (ex.: `hotfix/corrige-auth-prod`) — única exceção além da `develop` que pode abrir PR direto para a `main` (devendo também ser mergeada de volta na `develop`).

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
0. Validação de GitFlow (`develop` ou `hotfix/*` → `main`)
1. Geração do Prisma Client (`npm run db:generate --workspace=@nutricao/api`)
2. TypeScript Typecheck em todos os pacotes (`npm run lint`)
3. Suíte completa de Testes Unitários (`npm test`)
4. Build completo de produção (`npm run build`)

Nenhuma alteração deve ser considerada pronta sem que todos os passos passem localmente sem erros.
