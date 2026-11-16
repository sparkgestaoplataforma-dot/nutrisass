---
name: padronizar-modulo
description: >-
  Use this skill when refactoring legacy or inconsistent modules in NutriSaaS to
  conform to Clean Architecture (extracting Prisma queries from controllers into
  services, standardizing @/ imports, and extracting direct api.get/post calls
  from React components into apps/web/src/services/).
---

# Skill: Padronizar Módulo para Clean Architecture

Use este guia sempre que encontrar um módulo fora do padrão arquitetural do NutriSaaS.

## Checklist de Padronização no Backend (`apps/api`)
1. **Verificar se existe `<modulo>.service.ts`**:
   - Se o `<modulo>.controller.ts` estiver importando `prisma` diretamente, extraia todas as funções de banco e regras de negócio para `apps/api/src/modules/<modulo>/infra/<modulo>.service.ts`.
2. **Criar `<modulo>.service.spec.ts`**:
   - Escreva testes unitários para cada método do novo service validando o isolamento por `clinicaId` e os erros `AppError`.
3. **Limpar o `<modulo>.controller.ts`**:
   - O controller deve conter apenas a extração de dados do `req` (`getClinicaId(req)`, `req.params`, `req.body`, `req.query`), a chamada ao `<modulo>Service` e o `res.status(...).json(...)`.
   - Atualize `<modulo>.controller.spec.ts` para continuar passando (testando o fluxo integrado controller -> service -> prismaMock ou mockando o service).
4. **Padronizar Imports**:
   - Substitua qualquer `../../../shared/...` por `@/shared/...`.

## Checklist de Padronização no Frontend (`apps/web`)
1. **Verificar chamadas HTTP em componentes `.tsx`**:
   - Procure por `import { api } from '@/services/api'` dentro de `apps/web/src/pages/` ou `apps/web/src/components/`.
2. **Extrair para `apps/web/src/services/<modulo>.ts`**:
   - Crie funções semânticas e tipadas (ex.: `listarMedidas(pacienteId: string)`, `criarMedida(pacienteId: string, data: CreateMedidaInput)`).
3. **Atualizar o Componente React**:
   - Substitua `api.get(...)` / `api.post(...)` no `useQuery` e `useMutation` pelas funções do service.

## Validação Obrigatória Pós-Refatoração
```bash
npm run lint
npm test
npm run build
```

