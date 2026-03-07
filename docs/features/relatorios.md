# Relatórios

## Visão Geral

Relatório de agendamentos com filtros por período e status, cards de resumo e tabela detalhada com opção de impressão.

## Funcionalidades

- Filtro por data início/fim (padrão: mês atual)
- Filtro por status do agendamento
- Cards de resumo: Total, Realizados, Cancelados
- Tabela: Data, Hora, Paciente, Convênio, Telefone, Status
- Botão de impressão (window.print)

## Endpoint

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/relatorios` | Sim | Gerar relatório filtrado |

### Query Params

| Param | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| dataInicio | YYYY-MM-DD | 1º do mês | Data inicial |
| dataFim | YYYY-MM-DD | Hoje | Data final |
| status | String | Todos | Filtrar por status |
| convenioId | UUID | Todos | Filtrar por convênio |

### Response
```json
{
  "success": true,
  "data": {
    "agendamentos": [...],
    "resumo": {
      "total": 87,
      "realizados": 62,
      "cancelados": 5
    }
  }
}
```

## Arquivos

### Backend
- `apps/api/src/modules/relatorios/infra/relatorios.controller.ts`
- `apps/api/src/modules/relatorios/infra/relatorios.routes.ts`

### Frontend
- `apps/web/src/pages/Relatorios/RelatoriosPage.tsx`
- `apps/web/src/pages/Relatorios/RelatoriosPage.module.scss`
