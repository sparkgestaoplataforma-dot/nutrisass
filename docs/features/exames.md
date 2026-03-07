# Exames

## Visão Geral

Sistema de solicitação de exames laboratoriais e registro de resultados. Exames base são templates cadastrados pela clínica.

## Funcionalidades

### Exames Base (Configurações)
- CRUD de templates de exames
- Campos: código, nome, valor mínimo, valor máximo, unidade
- Exemplo: Glicemia (GLI), 70-99, mg/dL

### Solicitação de Exames
- Selecionar paciente → checkboxes dos exames base
- Criar solicitação com múltiplos exames de uma vez
- Listar solicitações por paciente

### Registro de Resultados
- Edição inline: data do resultado + valor
- Comparação com valores de referência (min/max)

## Endpoints

### Exames Base
| Método | Rota | Auth | Role | Descrição |
|--------|------|------|------|-----------|
| GET | `/api/exames/base` | Sim | Todos | Listar templates |
| POST | `/api/exames/base` | Sim | ADMIN, NUTRI | Criar template |
| PUT | `/api/exames/base/:id` | Sim | ADMIN, NUTRI | Editar template |
| DELETE | `/api/exames/base/:id` | Sim | ADMIN | Excluir template |

### Solicitações
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/exames/paciente/:pacienteId` | Sim | Listar solicitações |
| POST | `/api/exames/paciente/:pacienteId` | Sim | Solicitar exames |
| DELETE | `/api/exames/:id` | Sim | Excluir solicitação |
| POST | `/api/exames/resultado` | Sim | Registrar resultado |

### Solicitar Exames
```json
// POST /api/exames/paciente/:pacienteId
{ "exameBaseIds": ["uuid1", "uuid2", "uuid3"] }
```

### Registrar Resultado
```json
// POST /api/exames/resultado
{
  "itemId": "uuid",
  "dataResultado": "2026-03-07",
  "resultado": "95"
}
```

## Arquivos

### Backend
- `apps/api/src/modules/exames/infra/exames.controller.ts`
- `apps/api/src/modules/exames/infra/exames.routes.ts`

### Frontend
- `apps/web/src/pages/Pacientes/Prontuario/components/ExamesTab.tsx`
- `apps/web/src/pages/Configuracoes/ExamesBase/ExamesBaseConfig.tsx`

### Shared
- `packages/shared/src/schemas/exame.schema.ts`
