# Usuários

## Visão Geral

CRUD de usuários da clínica. Acesso restrito a ADMIN. Permite cadastrar nutricionistas e secretárias.

## Funcionalidades

- Listagem com badges de perfil (Admin/Nutricionista/Secretária)
- Cadastro com nome, email, senha e perfil
- Edição (senha opcional — deixar vazio mantém a atual)
- Exclusão com proteção: não permite excluir o último admin
- Senhas hasheadas com bcrypt (salt 10)

## Perfis

| Perfil | Badge | Descrição |
|--------|-------|-----------|
| ADMIN | Vermelho | Acesso total, gerencia usuários e configurações |
| NUTRICIONISTA | Verde | Atendimento, prontuário, exames |
| SECRETARIA | Azul | Agenda, listagem de pacientes |

## Endpoints

| Método | Rota | Auth | Role | Descrição |
|--------|------|------|------|-----------|
| GET | `/api/usuarios` | Sim | ADMIN | Listar usuários da clínica |
| POST | `/api/usuarios` | Sim | ADMIN | Criar usuário |
| PUT | `/api/usuarios/:id` | Sim | ADMIN | Editar usuário |
| DELETE | `/api/usuarios/:id` | Sim | ADMIN | Excluir (protege último admin) |

## Validações

- Email único (global)
- Senha mínima: 6 caracteres
- Não permite excluir último ADMIN da clínica

## Arquivos

### Backend
- `apps/api/src/modules/usuarios/infra/usuarios.controller.ts`
- `apps/api/src/modules/usuarios/infra/usuarios.routes.ts`

### Frontend
- `apps/web/src/pages/Configuracoes/Usuarios/UsuariosConfig.tsx`

### Shared
- `packages/shared/src/schemas/auth.schema.ts` (createUsuarioSchema)
