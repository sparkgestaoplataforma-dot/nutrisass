# Dashboard

## Visão Geral

Página inicial após login. Mostra KPIs da clínica e a agenda do dia.

## KPIs (Cards)

| Card | Descrição |
|------|-----------|
| Total Pacientes | Quantidade total de pacientes da clínica |
| Agenda Hoje | Agendamentos para hoje |
| Realizados (mês) | Consultas realizadas no mês |
| Cancelados (mês) | Cancelamentos no mês |

## Resumo do Mês

| Card | Descrição |
|------|-----------|
| Novos Pacientes | Pacientes cadastrados no mês |
| Agendamentos | Total de agendamentos no mês |
| Não Compareceu | Faltas no mês |

## Tabela: Agenda de Hoje

Mostra os agendamentos do dia com:
- Hora
- Nome do paciente (link para prontuário)
- Convênio
- Telefone
- Status (badge colorido)

## Endpoint

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/dashboard` | Sim | Retorna todos os KPIs |

### Response
```json
{
  "success": true,
  "data": {
    "totalPacientes": 45,
    "pacientesMes": 8,
    "agendaHoje": 12,
    "agendamentosMes": 87,
    "realizadosMes": 62,
    "canceladosMes": 5,
    "naoCompareceuMes": 3,
    "proximosAgendamentos": [...]
  }
}
```

## Arquivos

### Backend
- `apps/api/src/modules/dashboard/infra/dashboard.controller.ts`
- `apps/api/src/modules/dashboard/infra/dashboard.routes.ts`

### Frontend
- `apps/web/src/pages/Dashboard/DashboardPage.tsx`
- `apps/web/src/pages/Dashboard/DashboardPage.module.scss`
