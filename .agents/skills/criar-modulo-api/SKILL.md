---
name: criar-modulo-api
description: >-
  Use this skill when creating a new endpoint, service, or module in apps/api,
  or when adding new backend business logic in NutriSaaS. Enforces Clean Architecture,
  multi-tenant clinicaId + FK isolation, RBAC, Entitlements/Quotas, Zod validation
  in @nutricao/shared, and TDD.
---

# Skill: Criar ou Expandir Módulo na API (`@nutricao/api`)

Siga este passo a passo sempre que criar um novo endpoint ou adicionar/alterar uma regra de negócio no backend.

## Passo 1 — Definir o Contrato em `@nutricao/shared` (Anti-Mass Assignment)
1. Toda rota `POST`, `PUT` ou `PATCH` que receba `req.body` **exige** schema Zod em `packages/shared/src/schemas/<modulo>.schema.ts`.
2. Exporte o schema e o tipo inferido (`z.infer<typeof schema>`) em `packages/shared/src/schemas/index.ts` e `packages/shared/src/index.ts`.
3. Compile o pacote compartilhado:
   `npm run build --workspace=@nutricao/shared`

## Passo 2 — Checklist de Segurança, RBAC, FKs e Planos (Antes de Codar)
Responda explicitamente para o endpoint:
1. **Guard de Acesso (`.agents/rules/02-regras-negocio-seguranca.md`)**:
   - Manipula dados clínicos? → `clinicalGuard` (`ADMIN` e `NUTRICIONISTA`; `SECRETARIA` recebe `403`).
   - Manipula gestão administrativa (`usuarios`, `clinica`, `assinaturas`, escrita em `convenios`)? → `roleGuard('ADMIN')`.
   - Manipula catálogos clínicos (`alimentos`, `exames`, `questionarios`/`modulos` escrita)? → `roleGuard('ADMIN', 'NUTRICIONISTA')`.
   - É rota de Super Admin (`/api/backoffice/*`)? → `superAdminMiddleware` + `BackofficeAuditLog` + zero retorno de prontuários nominais (LGPD).
2. **Chaves Estrangeiras (FKs) do Payload**:
   - Liste todos os IDs recebidos em `req.body` (`pacienteId`, `nutricionistaId`, `convenioId`, `alimentoId`, `medidaCaseiraId`, `perguntaId`, `exameBaseId`) que precisarão de `findFirst` comprovando pertença à `clinicaId` (ou `clinicaId: null` para TACO global).
3. **Limites do Plano (`.agents/rules/05-saas-planos-e-backoffice.md`)**:
   - Exige módulo pago? → `featureGuard('chave')` na rota (`402 FEATURE_LOCKED`).
   - Possui limite de quantidade no Gratuito? → `assertQuota(tx, clinicaId, 'chave', countAtual)` dentro de `prisma.$transaction` (`402 QUOTA_EXCEEDED`). **Proibido** usar `if (plano === 'PRO')`.

## Passo 3 — Escrever o Teste Unitário do Service Primeiro (TDD - Red)
1. Em `apps/api/src/modules/<modulo>/infra/<modulo>.service.spec.ts`, escreva os casos de teste usando `prismaMock` (`@/shared/providers/__mocks__/prisma`):
   - Caso de sucesso garantindo `clinicaId` no `where` / `data`.
   - Caso `AppError 404` quando o recurso principal **ou qualquer FK secundária do payload** pertence a outra `clinicaId`.
   - Casos de erro de domínio, RBAC ou limite de cota (`400`, `402`, `403`, `409`).
2. Rode o teste para confirmar a falha inicial (Red):
   `npm test --workspace=@nutricao/api`

## Passo 4 — Implementar no `<modulo>.service.ts` (TDD - Green)
1. Crie/atualize a função em `apps/api/src/modules/<modulo>/infra/<modulo>.service.ts`.
2. Use exclusivamente imports com alias `@/`:
   ```ts
   import { prisma } from '@/shared/providers/prisma';
   import { AppError } from '@/shared/middlewares/errorHandler';
   ```
3. **Regras Inegociáveis**:
   - Nunca faça `update` ou `delete` direto por `id` sem antes verificar `findFirst({ where: { id, clinicaId } })` (ou `paciente: { clinicaId }`).
   - Valide todas as FKs do `body` contra `clinicaId`.
   - Envolva verificações de conflito de horário ou cota (`assertQuota`) + escrita em `prisma.$transaction`.

## Passo 5 — Expor no `<modulo>.controller.ts` e `<modulo>.routes.ts`
1. No `<modulo>.controller.ts`, **não importe o `prisma`**. Apenas extraia `clinicaId = getClinicaId(req)`, chame o `<modulo>.service.ts` e retorne `res.status(...).json({ success: true, data })`.
2. No `<modulo>.routes.ts`, aplique `authMiddleware`, o guard correspondente (`clinicalGuard` / `roleGuard` / `featureGuard`) e `validate(schema)` / `validateQuery(schema)`.

## Passo 6 — Registrar na Suíte de Autorização Clínica e Service Web
1. Se protegido pelo `clinicalGuard`, adicione o endpoint no array `clinicalEndpoints` em `apps/api/src/test/clinical-authorization.spec.ts`.
2. Crie/atualize o serviço tipado no frontend em `apps/web/src/services/<modulo>.ts`.

## Passo 7 — Validação Final
Execute:
```bash
npm test --workspace=@nutricao/api
npm run lint
```
