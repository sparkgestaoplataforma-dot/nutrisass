# API Endpoints

Base URL: `/api`

## Autenticação

| Método | Rota | Auth | Role | Descrição |
|--------|------|------|------|-----------|
| POST | `/auth/login` | — | — | Login |
| POST | `/auth/refresh` | — | — | Renovar token |
| POST | `/auth/logout` | Bearer | Todos | Logout |
| GET | `/auth/me` | Bearer | Todos | Dados do usuário |

## Clínica

| Método | Rota | Auth | Role | Descrição |
|--------|------|------|------|-----------|
| POST | `/clinica/onboarding` | — | — | Cadastrar clínica + admin |
| GET | `/clinica` | Bearer | Todos | Ver clínica |
| PUT | `/clinica` | Bearer | ADMIN | Atualizar clínica |

## Dashboard

| Método | Rota | Auth | Role | Descrição |
|--------|------|------|------|-----------|
| GET | `/dashboard` | Bearer | Todos | KPIs + agenda do dia |

## Agendamentos

| Método | Rota | Auth | Role | Descrição |
|--------|------|------|------|-----------|
| GET | `/agendamentos?data=YYYY-MM-DD` | Bearer | Todos | Agenda do dia |
| POST | `/agendamentos` | Bearer | Todos | Criar agendamento |
| PUT | `/agendamentos/:id` | Bearer | Todos | Editar agendamento |
| PATCH | `/agendamentos/:id/status` | Bearer | Todos | Alterar status |
| DELETE | `/agendamentos/:id` | Bearer | Todos | Excluir |

## Pacientes

| Método | Rota | Auth | Role | Descrição |
|--------|------|------|------|-----------|
| GET | `/pacientes?busca=&page=1&limit=20` | Bearer | Todos | Listar (paginado) |
| GET | `/pacientes/:id` | Bearer | Todos | Detalhes |
| POST | `/pacientes` | Bearer | Todos | Cadastrar |
| PUT | `/pacientes/:id` | Bearer | Todos | Editar |
| DELETE | `/pacientes/:id` | Bearer | Todos | Excluir |

## Prontuário

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/prontuario/:pacienteId/evolucoes` | Bearer | Listar evoluções |
| POST | `/prontuario/:pacienteId/evolucoes` | Bearer | Criar evolução |
| PUT | `/prontuario/evolucoes/:id` | Bearer | Editar evolução |
| GET | `/prontuario/:pacienteId/medidas` | Bearer | Listar medidas |
| POST | `/prontuario/:pacienteId/medidas` | Bearer | Criar medida |
| DELETE | `/prontuario/medidas/:id` | Bearer | Excluir medida |

## Exames

| Método | Rota | Auth | Role | Descrição |
|--------|------|------|------|-----------|
| GET | `/exames/base` | Bearer | Todos | Listar templates |
| POST | `/exames/base` | Bearer | ADMIN, NUTRI | Criar template |
| PUT | `/exames/base/:id` | Bearer | ADMIN, NUTRI | Editar template |
| DELETE | `/exames/base/:id` | Bearer | ADMIN | Excluir template |
| GET | `/exames/paciente/:pacienteId` | Bearer | Todos | Listar solicitações |
| POST | `/exames/paciente/:pacienteId` | Bearer | Todos | Solicitar exames |
| DELETE | `/exames/:id` | Bearer | Todos | Excluir solicitação |
| POST | `/exames/resultado` | Bearer | Todos | Registrar resultado |

## Convênios

| Método | Rota | Auth | Role | Descrição |
|--------|------|------|------|-----------|
| GET | `/convenios` | Bearer | Todos | Listar |
| POST | `/convenios` | Bearer | ADMIN | Criar |
| PUT | `/convenios/:id` | Bearer | ADMIN | Editar |
| DELETE | `/convenios/:id` | Bearer | ADMIN | Excluir |

## Usuários

| Método | Rota | Auth | Role | Descrição |
|--------|------|------|------|-----------|
| GET | `/usuarios` | Bearer | ADMIN | Listar |
| POST | `/usuarios` | Bearer | ADMIN | Criar |
| PUT | `/usuarios/:id` | Bearer | ADMIN | Editar |
| DELETE | `/usuarios/:id` | Bearer | ADMIN | Excluir |

## Relatórios

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/relatorios?dataInicio=&dataFim=&status=` | Bearer | Gerar relatório |

## Formato de Resposta Padrão

```json
{
  "success": true,
  "data": { ... },
  "message": "Mensagem opcional"
}
```

## Formato de Erro

```json
{
  "success": false,
  "message": "Descrição do erro",
  "errors": { "campo": ["mensagem"] }
}
```

## Códigos HTTP

| Código | Quando |
|--------|--------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Validação / regra de negócio |
| 401 | Não autenticado / token inválido |
| 403 | Sem permissão (role) |
| 404 | Recurso não encontrado |
| 409 | Conflito (email/cnpj duplicado) |
| 500 | Erro interno |
