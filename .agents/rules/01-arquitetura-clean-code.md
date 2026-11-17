# Regra 01 — Arquitetura Limpa (Clean Architecture) e Clean Code

## 1. Estrutura Padrão de Módulo no Backend (`apps/api/src/modules/<modulo>/`)
Todo módulo do backend deve conter os seguintes arquivos dentro de `infra/` (e opcionalmente `application/` ou `domain/`):
- `<modulo>.routes.ts`: Apenas definição de rotas Express, `authMiddleware`, `clinicalGuard` (para rotas clínicas) e `validate(schema)` do Zod.
- `<modulo>.controller.ts`: Apenas adaptação HTTP (`req`, `res`).
  - Extrai `clinicaId = getClinicaId(req)` e `usuarioId = getUsuarioId(req)`.
  - Chama funções do `<modulo>.service.ts`.
  - Retorna JSON padronizado: `{ success: true, data: ... }`.
  - **PROIBIDO**: Importar `prisma`, executar `prisma.$transaction`, ou escrever regras de cálculo/filtro dentro do controller.
- `<modulo>.service.ts`: Contém toda a lógica de negócio, validações de existência (`AppError`), filtros multi-tenant (`clinicaId`) e acesso ao Prisma/Redis.
- `<modulo>.service.spec.ts` e `<modulo>.controller.spec.ts`: Testes unitários isolados com `prismaMock`.

## 2. Padronização de Imports
- No backend (`apps/api`), use sempre o alias `@/` configurado no `tsconfig.json`:
  - Correto: `import { prisma } from '@/shared/providers/prisma';`
  - Correto: `import { AppError } from '@/shared/middlewares/errorHandler';`
  - Correto: `import { getClinicaId } from '@/shared/middlewares/auth';`
  - Incorreto: `import { prisma } from '../../../shared/providers/prisma.js';`
- No frontend (`apps/web`), use `@/` para arquivos internos de `src/` e `@nutricao/shared` para schemas, constantes e tipos compartilhados.

## 3. Estrutura Padrão no Frontend (`apps/web/src/`)
- **Camada de Serviços (`src/services/*.ts`)**:
  - Todo módulo de domínio (`pacientes`, `prontuario`, `exames`, `planoAlimentar`, `agenda`, `convenios`, `clinica`, `questionarios`, `avaliacao`, `usuario`, `dashboard`, `notificacao`) possui seu arquivo em `src/services/`.
  - Componentes React (`.tsx`) **NUNCA** importam `api` de `@/services/api` diretamente; eles importam funções de negócio tipadas do respectivo service (ex.: `listarMedidas(pacienteId)`, `criarMedida(pacienteId, payload)`).
- **Motor de Cálculos (`src/utils/nutricaoCalculos.ts`)**:
  - Nenhum cálculo nutricional (TMB, GET, IMC, RCQ, RCE, Pollock, conversão de medidas caseiras, soma de macros/fibras) deve ser escrito inline dentro de componentes React. Sempre extraia para funções puras em `nutricaoCalculos.ts` com testes unitários em `nutricaoCalculos.spec.ts`.

