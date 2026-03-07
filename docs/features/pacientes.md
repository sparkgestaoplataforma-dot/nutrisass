# Pacientes

## Visão Geral

CRUD completo de pacientes com busca por nome/email/telefone, paginação e formulário com seções: Dados Pessoais, Documentos, Endereço e Convênio.

## Funcionalidades

- Listagem com busca (debounce 300ms) e paginação
- Cadastro com formulário completo
- Edição reutilizando o mesmo form
- Exclusão com confirmação
- Link para prontuário

## Campos do Paciente

### Dados Pessoais
nome, email, telefone, whatsapp, sexo, dataNascimento, profissao, escolaridade, nomeMae

### Documentos
cpf, identidade, ufIdentidade, orgaoExpedidor

### Endereço
endereco, bairro, municipio, uf, cep

### Convênio
convenioId, numeroCarteira, validadeCarteira

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/pacientes?busca=&page=1&limit=20` | Sim | Listar (paginado, busca) |
| GET | `/api/pacientes/:id` | Sim | Detalhes + últimos 10 agendamentos |
| POST | `/api/pacientes` | Sim | Cadastrar |
| PUT | `/api/pacientes/:id` | Sim | Editar |
| DELETE | `/api/pacientes/:id` | Sim | Excluir |

## Arquivos

### Backend
- `apps/api/src/modules/pacientes/infra/pacientes.controller.ts`
- `apps/api/src/modules/pacientes/infra/pacientes.routes.ts`

### Frontend
- `apps/web/src/pages/Pacientes/Listagem/PacientesPage.tsx`
- `apps/web/src/pages/Pacientes/Cadastro/PacienteFormPage.tsx`
- `apps/web/src/services/pacientes.ts`

### Shared
- `packages/shared/src/schemas/paciente.schema.ts`
