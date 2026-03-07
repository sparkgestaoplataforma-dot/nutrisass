# Database Schema

## Visão Geral

PostgreSQL com Prisma ORM. Tabelas em português com snake_case (via `@map`). Multi-tenant por coluna `clinica_id`.

## Diagrama de Relacionamentos

```
Clinica (1) ──── (N) Usuario
Clinica (1) ──── (N) Paciente
Clinica (1) ──── (N) Convenio
Clinica (1) ──── (N) Agendamento
Clinica (1) ──── (N) Questionario
Clinica (1) ──── (N) ExameBase

Paciente (1) ──── (N) Agendamento
Paciente (1) ──── (N) EvolucaoClinica
Paciente (1) ──── (N) Medida
Paciente (1) ──── (N) SolicitacaoExame
Paciente (1) ──── (N) RespostaQuestionario
Paciente (N) ──── (1) Convenio

Usuario  (1) ──── (N) Agendamento
Convenio (1) ──── (N) Agendamento

SolicitacaoExame (1) ──── (N) SolicitacaoExameItem
ExameBase        (1) ──── (N) SolicitacaoExameItem

Questionario (1) ──── (N) RespostaQuestionario
```

## Enums

### Perfil
`ADMIN` | `NUTRICIONISTA` | `SECRETARIA`

### Sexo
`MASCULINO` | `FEMININO`

### TipoAgendamento
`CONSULTA` | `RETORNO`

### StatusAgendamento
`AGENDADO` | `CONFIRMOU` | `PRESENTE` | `ENCAIXE` | `CANCELADO` | `NAO_COMPARECEU` | `REALIZADO` | `DESISTIU` | `REMARCOU`

## Tabelas

| Tabela | Model Prisma | clinicaId | Descrição |
|--------|-------------|-----------|-----------|
| clinicas | Clinica | — | Clínicas (tenants) |
| usuarios | Usuario | Sim | Usuários do sistema |
| pacientes | Paciente | Sim | Pacientes |
| convenios | Convenio | Sim | Convênios/planos |
| agendamentos | Agendamento | Sim | Agendamentos |
| evolucoes_clinicas | EvolucaoClinica | Via paciente | Evoluções clínicas |
| medidas | Medida | Via paciente | Medidas antropométricas |
| questionarios | Questionario | Sim | Templates de questionários |
| respostas_questionarios | RespostaQuestionario | Via paciente | Respostas |
| exames_base | ExameBase | Sim | Templates de exames |
| solicitacoes_exames | SolicitacaoExame | Via paciente | Solicitações de exames |
| solicitacoes_exames_itens | SolicitacaoExameItem | Via solicitação | Itens da solicitação |

## Índices

- `agendamentos`: clinicaId, dataHora, pacienteId, usuarioId
- `pacientes`: clinicaId
- `convenios`: clinicaId
- `usuarios`: clinicaId
- `evolucoes_clinicas`: pacienteId
- `medidas`: pacienteId
- `solicitacoes_exames`: pacienteId
- `respostas_questionarios`: pacienteId
- `questionarios`: clinicaId
- `exames_base`: clinicaId, unique(clinicaId, codigo)

## Seed

O seed cria:
- 1 Clínica Demo (CNPJ: 00000000000100)
- 3 Usuários: admin, nutricionista, secretária (senha: 123456)
- 1 Convênio: Particular

```bash
cd apps/api && npx tsx prisma/seed.ts
```

## Convenções

- Nomes de tabelas: português snake_case (`@map`)
- PKs: UUID v4 (`@default(uuid())`)
- Timestamps: `criadoEm` + `atualizadoEm` (`@default(now())` + `@updatedAt`)
- Enums: UPPER_CASE em português
- Soft delete: não implementado (hard delete)
