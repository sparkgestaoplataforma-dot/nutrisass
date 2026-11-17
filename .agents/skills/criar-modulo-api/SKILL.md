---
name: criar-modulo-api
description: >-
  Use this skill when creating a new endpoint, service, or module in apps/api,
  or when adding new backend business logic in NutriSaaS. Enforces Clean Architecture,
  multi-tenant clinicaId isolation, Zod validation in @nutricao/shared, and TDD.
---

# Skill: Criar ou Expandir Módulo na API (`@nutricao/api`)

Siga este passo a passo sempre que precisar criar um novo endpoint ou adicionar uma regra de negócio no backend.

## Passo 1 — Definir o Contrato em `@nutricao/shared`
1. Abra ou crie o schema Zod correspondente em `packages/shared/src/schemas/<modulo>.schema.ts`.
2. Exporte o schema e o tipo inferido (`z.infer<typeof schema>`) em `packages/shared/src/schemas/index.ts` e `packages/shared/src/index.ts`.
3. Compile o pacote compartilhado:
   `npm run build --workspace=@nutricao/shared`

## Passo 2 — Escrever o Teste Unitário do Service Primeiro (TDD - Red)
1. Em `apps/api/src/modules/<modulo>/infra/<modulo>.service.spec.ts`, escreva os casos de teste usando `prismaMock` (`@/shared/providers/__mocks__/prisma`):
   - Caso de sucesso garantindo que `clinicaId` está presente no `where` ou `data`.
   - Caso de erro (`AppError 404`) quando o recurso ou paciente não pertence à `clinicaId`.
   - Casos de erro de regra de negócio (`400`, `403`, `409`).
2. Rode o teste para confirmar a falha inicial (Red):
   `npm test --workspace=@nutricao/api`

## Passo 3 — Implementar no `<modulo>.service.ts` (TDD - Green)
1. Crie/atualize a função em `apps/api/src/modules/<modulo>/infra/<modulo>.service.ts`.
2. Use exclusivamente imports com alias `@/`:
   ```ts
   import { prisma } from '@/shared/providers/prisma';
   import { AppError } from '@/shared/middlewares/errorHandler';
   ```
3. **Regra Multi-Tenant Obrigatória**:
   - Nunca faça `update` ou `delete` direto por `id` sem antes verificar `findFirst({ where: { id, clinicaId } })` (ou `paciente: { clinicaId }`).

## Passo 4 — Expor no `<modulo>.controller.ts` e `<modulo>.routes.ts`
1. No `<modulo>.controller.ts`, **não importe o `prisma`**. Apenas extraia `clinicaId = getClinicaId(req)`, chame o `<modulo>.service.ts` e retorne `res.status(...).json({ success: true, data })`.
2. No `<modulo>.routes.ts`:
   - Se a rota manipular dados clínicos (prontuário, medidas, exames de paciente, planos alimentares, avaliações), aplique `router.use(authMiddleware, clinicalGuard)` (ou passe `clinicalGuard` na rota).
   - Aplique o middleware `validate(schema)` para validar `body`/`params`.

## Passo 5 — Registrar na Suíte de Autorização Clínica
Se o endpoint for protegido pelo `clinicalGuard`:
1. Adicione o endpoint no array `clinicalEndpoints` em `apps/api/src/test/clinical-authorization.spec.ts`.
2. Crie o respectivo serviço tipado no frontend em `apps/web/src/services/<modulo>.ts`.

## Passo 6 — Validação Final
Execute:
```bash
npm test --workspace=@nutricao/api
npm run lint
```

