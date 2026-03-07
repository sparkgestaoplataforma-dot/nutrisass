# Prontuário

## Visão Geral

Prontuário do paciente com card de perfil e 3 abas: Evolução Clínica, Medidas Antropométricas e Exames.

## Estrutura

### Card de Perfil
- Nome, email, telefone, convênio
- Últimos agendamentos

### Tab 1: Evolução Clínica
- Formulário: Estado clínico, Aparelho digestivo, Antecedentes mórbidos, Medicamentos, Outros
- Lista de evoluções anteriores (cards com data)
- Edição inline

### Tab 2: Medidas Antropométricas
- 10 campos: peso, altura, cintura, abdomen, quadril, braço D/E, coxa D/E, culote
- Tabela histórica com todas as medições
- Exclusão individual

### Tab 3: Exames
- Solicitação: checkboxes dos exames base cadastrados
- Registro de resultados inline (data + valor)
- Lista de solicitações com itens

## Endpoints

### Evolução Clínica
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/prontuario/:pacienteId/evolucoes` | Listar evoluções |
| POST | `/api/prontuario/:pacienteId/evolucoes` | Criar evolução |
| PUT | `/api/prontuario/evolucoes/:id` | Editar evolução |

### Medidas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/prontuario/:pacienteId/medidas` | Listar medidas |
| POST | `/api/prontuario/:pacienteId/medidas` | Criar medida |
| DELETE | `/api/prontuario/medidas/:id` | Excluir medida |

### Exames (ver [exames.md](exames.md))

## Arquivos

### Backend
- `apps/api/src/modules/prontuario/infra/prontuario.controller.ts`
- `apps/api/src/modules/prontuario/infra/prontuario.routes.ts`

### Frontend
- `apps/web/src/pages/Pacientes/Prontuario/ProntuarioPage.tsx`
- `apps/web/src/pages/Pacientes/Prontuario/components/EvolucaoTab.tsx`
- `apps/web/src/pages/Pacientes/Prontuario/components/MedidasTab.tsx`
- `apps/web/src/pages/Pacientes/Prontuario/components/ExamesTab.tsx`

### Shared
- `packages/shared/src/schemas/prontuario.schema.ts`
