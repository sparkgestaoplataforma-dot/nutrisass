# Regra 03 — TDD (Test-Driven Development) e Padrões de Testes Unitários

## 1. Fluxo Obrigatório Red → Green → Refactor
Toda nova funcionalidade, cálculo ou correção de bug deve começar pelo teste unitário:
1. **Red**: Escreva o teste descrevendo o comportamento esperado e execute `npm test` para vê-lo falhar.
2. **Green**: Implemente a regra no Service ou utilitário puro até o teste passar.
3. **Refactor**: Limpe duplicações mantendo todos os testes verdes.

## 2. Onde Escrever Cada Tipo de Teste
- **Regras de Negócio e Banco (Backend)**:
  - `apps/api/src/modules/<modulo>/infra/<modulo>.service.spec.ts`: Testa cada função do service usando `prismaMock` (`@/shared/providers/__mocks__/prisma`), cobrindo casos de sucesso, filtros por `clinicaId` e erros (`AppError 404 / 400 / 409 / 403`).
- **Adaptação HTTP (Backend)**:
  - `apps/api/src/modules/<modulo>/infra/<modulo>.controller.spec.ts`: Testa se o controller extrai parâmetros corretamente e retorna os status HTTP esperados (`200`, `201`, `204`).
- **Segurança e Isolamento Multi-Tenant (Backend)**:
  - `apps/api/src/test/clinical-authorization.spec.ts`: Matriz obrigatória que testa automaticamente todos os endpoints clínicos contra acesso sem token (`401`), acesso por `SECRETARIA` em `CLINICA` (`403`), acesso por `NUTRICIONISTA`/`ADMIN` (`200`/`201`) e tentativa de acesso cruzado entre `CLINICA_A` e `CLINICA_B` (`404`).
- **Cálculos Clínicos e Utilitários (Frontend)**:
  - `apps/web/src/utils/nutricaoCalculos.spec.ts` e `apps/web/src/utils/utils.spec.ts`: Testam todas as fórmulas matemáticas, arredondamentos e casos de borda (`null`, `0`, valores negativos).

## 3. Isolamento de Ambiente nos Testes
- Nenhum teste unitário pode depender de conexões reais com PostgreSQL ou Redis.
- O provider `redis.ts` desativa conexões TCP automaticamente quando `NODE_ENV === 'test'` ou `VITEST` está ativo.

