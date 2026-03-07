# Agenda

## Visão Geral

Módulo de agendamentos com navegação por dia, cards de status, tabela interativa e atualização em tempo real via Socket.io.

## Funcionalidades

- Navegação por data (anterior/próximo/hoje)
- Cards de resumo: Total, Agendados, Realizados, Cancelados
- Tabela com: hora, paciente, convênio, telefone, tipo, observação, status, ações
- Status alterável inline via dropdown (9 opções com cores)
- Modal para criar/editar agendamento
- Atualização em tempo real (Socket.io)

## Status de Agendamento

| Status | Cor | Descrição |
|--------|-----|-----------|
| AGENDADO | Azul | Recém criado |
| CONFIRMOU | Verde | Paciente confirmou |
| PRESENTE | Verde | Paciente presente |
| ENCAIXE | Amarelo | Consulta de encaixe |
| CANCELADO | Vermelho | Cancelado |
| NAO_COMPARECEU | Vermelho | Paciente faltou |
| REALIZADO | Verde | Consulta concluída |
| DESISTIU | Vermelho | Paciente desistiu |
| REMARCOU | Amarelo | Remarcado |

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/agendamentos?data=YYYY-MM-DD` | Sim | Listar agenda do dia |
| POST | `/api/agendamentos` | Sim | Criar agendamento |
| PUT | `/api/agendamentos/:id` | Sim | Editar agendamento |
| PATCH | `/api/agendamentos/:id/status` | Sim | Alterar status |
| DELETE | `/api/agendamentos/:id` | Sim | Excluir agendamento |

## Socket.io Events

| Evento | Quando | Payload |
|--------|--------|---------|
| `agenda:novo` | Agendamento criado | Agendamento completo |
| `agenda:atualizado` | Agendamento editado | Agendamento completo |
| `agenda:status` | Status alterado | Agendamento completo |
| `agenda:excluido` | Agendamento excluído | `{ id }` |

## Request/Response

### Criar Agendamento
```json
// POST /api/agendamentos
{
  "pacienteId": "uuid",
  "convenioId": "uuid",
  "dataHora": "2026-03-07T14:30:00",
  "tipo": "CONSULTA",
  "encaixe": false,
  "observacao": "Primeira consulta"
}
```

### Alterar Status
```json
// PATCH /api/agendamentos/:id/status
{ "status": "REALIZADO" }
```

## Arquivos

### Backend
- `apps/api/src/modules/agenda/application/criarAgendamento.usecase.ts`
- `apps/api/src/modules/agenda/application/listarAgendaDia.usecase.ts`
- `apps/api/src/modules/agenda/application/editarAgendamento.usecase.ts`
- `apps/api/src/modules/agenda/application/alterarStatus.usecase.ts`
- `apps/api/src/modules/agenda/application/excluirAgendamento.usecase.ts`
- `apps/api/src/modules/agenda/infra/agenda.controller.ts`
- `apps/api/src/modules/agenda/infra/agenda.routes.ts`

### Frontend
- `apps/web/src/pages/Agenda/AgendaPage.tsx`
- `apps/web/src/pages/Agenda/components/TabelaAgenda.tsx`
- `apps/web/src/pages/Agenda/components/AgendamentoModal.tsx`
- `apps/web/src/pages/Agenda/components/StatusBadge.tsx`
- `apps/web/src/pages/Agenda/hooks/useAgenda.ts`
- `apps/web/src/services/agenda.ts`

### Shared
- `packages/shared/src/schemas/agenda.schema.ts`
