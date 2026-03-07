# Clínica (Multi-Tenancy)

## Visão Geral

Cada clínica é um tenant isolado no sistema. O cadastro de uma nova clínica (onboarding) cria automaticamente a clínica, o usuário admin e um convênio "Particular".

## Multi-Tenancy

- Coluna `clinicaId` em todas as tabelas relevantes
- JWT carrega `clinicaId` no payload
- Helper `getClinicaId(req)` filtra automaticamente
- **Isolamento total**: Clínica A não vê dados da Clínica B

## Fluxo de Onboarding

1. Usuário acessa `/cadastro`
2. Preenche dados da clínica + dados do admin
3. Backend cria (em transação):
   - `Clinica` com os dados informados
   - `Usuario` com perfil ADMIN
   - `Convenio` "Particular" (padrão)
4. Retorna tokens JWT → login automático
5. Admin pode então cadastrar nutricionistas e secretárias

## Endpoints

| Método | Rota | Auth | Role | Descrição |
|--------|------|------|------|-----------|
| POST | `/api/clinica/onboarding` | Não | — | Cadastrar clínica + admin |
| GET | `/api/clinica` | Sim | Todos | Ver dados da clínica |
| PUT | `/api/clinica` | Sim | ADMIN | Atualizar clínica |

## Request/Response

### Onboarding
```json
// POST /api/clinica/onboarding
{
  "clinica": {
    "nome": "Clínica Nutri Vida",
    "cnpj": "12345678000100",
    "telefone": "(11) 99999-9999"
  },
  "admin": {
    "nome": "João Silva",
    "email": "joao@nutrivida.com",
    "senha": "123456"
  }
}

// Response
{
  "success": true,
  "data": {
    "clinica": { "id": "uuid", "nome": "Clínica Nutri Vida", ... },
    "tokens": { "accessToken": "...", "refreshToken": "..." }
  }
}
```

## Model Prisma

```prisma
model Clinica {
  id           String   @id @default(uuid())
  nome         String
  cnpj         String?  @unique
  telefone     String?
  email        String?
  endereco     String?
  logomarca    String?
  ativa        Boolean  @default(true)
  criadoEm     DateTime @default(now())
  atualizadoEm DateTime @updatedAt
}
```

## Arquivos

### Backend
- `apps/api/src/modules/clinica/infra/clinica.controller.ts`
- `apps/api/src/modules/clinica/infra/clinica.routes.ts`

### Frontend
- `apps/web/src/pages/Onboarding/OnboardingPage.tsx`
- `apps/web/src/pages/Onboarding/OnboardingPage.module.scss`

### Shared
- `packages/shared/src/schemas/clinica.schema.ts`
