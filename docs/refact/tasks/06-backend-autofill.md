# Task 06 — Backend: Auto-preenchimento de nutricionistaId nos services

## Objetivo
Nos services de agenda e dashboard, quando `tipoClinica === 'AUTONOMO'`, auto-preencher o `nutricionistaId` com o `userId` do token, eliminando a necessidade de selecionar nutricionista.

## Dependências
- Task 03 (tipoClinica disponível no req.user)

## Arquivos Impactados
- `apps/api/src/modules/agenda/infra/agenda.controller.ts`
- `apps/api/src/modules/dashboard/infra/dashboard.service.ts`

## Detalhamento

### 1. `agenda.controller.ts` — função `listar`

Atualmente:
```typescript
const targetNutricionistaId = (usuarioPerfil === "SECRETARIA" || usuarioPerfil === "ADMIN")
  ? (nutricionistaId ? (nutricionistaId as string) : undefined)
  : usuarioId;
```

Mudança: no modo autônomo, sempre usar o próprio userId:
```typescript
const isAutonomo = req.user!.tipoClinica === 'AUTONOMO';
const targetNutricionistaId = isAutonomo
  ? usuarioId
  : (usuarioPerfil === "SECRETARIA" || usuarioPerfil === "ADMIN")
    ? (nutricionistaId ? (nutricionistaId as string) : undefined)
    : usuarioId;
```

### 2. `agenda.controller.ts` — função `criar`

A validação de que "Nutricionista só pode criar agendamentos para si mesmo" já funciona.
No modo autônomo, o `nutricionistaId` do body sempre será o userId do token (preenchido pelo frontend). Sem mudança necessária no backend.

### 3. `dashboard.service.ts`

A lógica atual já funciona: se `usuarioId` é passado, filtra por ele. No modo autônomo, o frontend sempre passa o `userId` do token. **Sem mudança necessária** no service.

No entanto, o controller do dashboard precisa ser verificado para garantir que passa o `userId` corretamente.

## Critérios de Aceite
- [ ] Agenda no modo autônomo lista apenas agendamentos do próprio nutricionista
- [ ] Dashboard no modo autônomo mostra dados apenas do próprio nutricionista
- [ ] Modo clínica não é afetado (sem regressão)

## Riscos / Observações
- A maioria do auto-preenchimento é feita no **frontend** (Tasks 08-09). O backend nesta task é apenas uma camada de segurança para garantir que os dados são filtrados corretamente, mesmo se o frontend falhar.
