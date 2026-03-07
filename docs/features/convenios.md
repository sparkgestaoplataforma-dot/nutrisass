# Convênios

## Visão Geral

CRUD de convênios/planos de saúde da clínica. Acesso restrito a ADMIN.

Um convênio "Particular" é criado automaticamente no onboarding.

## Funcionalidades

- Listagem de convênios
- Cadastro com nome e registro ANS (opcional)
- Edição inline
- Exclusão com confirmação

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| nome | String | Sim |
| registroANS | String | Não |

## Endpoints

| Método | Rota | Auth | Role | Descrição |
|--------|------|------|------|-----------|
| GET | `/api/convenios` | Sim | Todos | Listar convênios |
| POST | `/api/convenios` | Sim | ADMIN | Criar convênio |
| PUT | `/api/convenios/:id` | Sim | ADMIN | Editar convênio |
| DELETE | `/api/convenios/:id` | Sim | ADMIN | Excluir convênio |

## Arquivos

### Backend
- `apps/api/src/modules/convenios/infra/convenios.controller.ts`
- `apps/api/src/modules/convenios/infra/convenios.routes.ts`

### Frontend
- `apps/web/src/pages/Configuracoes/Convenios/ConveniosConfig.tsx`
- `apps/web/src/services/convenios.ts`

### Shared
- `packages/shared/src/schemas/convenio.schema.ts`
