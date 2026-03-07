# Autenticação

## Visão Geral

Sistema de autenticação baseado em JWT com refresh token e blacklist via Redis.

## Fluxo

1. Usuário faz login com email/senha
2. Backend valida credenciais (bcrypt) e retorna `accessToken` (15m) + `refreshToken` (7d)
3. Frontend armazena tokens no Zustand (localStorage)
4. Axios interceptor adiciona `Authorization: Bearer {token}` em todas as requests
5. Quando access token expira, interceptor usa refresh token automaticamente
6. No logout, token é adicionado à blacklist no Redis

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/login` | Não | Login com email/senha |
| POST | `/api/auth/refresh` | Não | Renovar access token |
| POST | `/api/auth/logout` | Sim | Logout + blacklist |
| GET | `/api/auth/me` | Sim | Dados do usuário logado |

## Request/Response

### Login
```json
// POST /api/auth/login
// Request
{ "email": "admin@nutricao.com", "senha": "123456" }

// Response
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

### Me
```json
// GET /api/auth/me
// Response
{
  "success": true,
  "data": {
    "userId": "uuid",
    "clinicaId": "uuid",
    "email": "admin@nutricao.com",
    "perfil": "ADMIN"
  }
}
```

## Token Payload (JWT)

```typescript
interface TokenPayload {
  userId: string;
  clinicaId: string;
  email: string;
  perfil: string; // ADMIN | NUTRICIONISTA | SECRETARIA
}
```

## Middleware de Autenticação

- `authMiddleware` — Valida JWT, verifica blacklist no Redis, injeta `req.user`
- `roleGuard(...roles)` — Verifica se o perfil do usuário está na lista permitida
- `getClinicaId(req)` — Extrai clinicaId do JWT para filtrar queries

## Frontend

- **Store:** `useAuthStore` (Zustand com persist)
- **Hooks:** `useLogin()`, `useLogout()`
- **Interceptor:** Auto-refresh em 401
- **ProtectedRoute:** Redireciona para `/login` se não autenticado

## Arquivos

### Backend
- `apps/api/src/modules/auth/application/login.usecase.ts`
- `apps/api/src/modules/auth/application/refresh.usecase.ts`
- `apps/api/src/modules/auth/application/logout.usecase.ts`
- `apps/api/src/modules/auth/infra/auth.controller.ts`
- `apps/api/src/modules/auth/infra/auth.routes.ts`
- `apps/api/src/shared/middlewares/auth.ts`

### Frontend
- `apps/web/src/stores/authStore.ts`
- `apps/web/src/hooks/useAuth.ts`
- `apps/web/src/services/api.ts`
- `apps/web/src/routes/ProtectedRoute.tsx`
- `apps/web/src/pages/Login/LoginPage.tsx`

### Shared
- `packages/shared/src/schemas/auth.schema.ts`
- `packages/shared/src/types/index.ts`
