# Task 03 — Backend Auth: JWT com tipoClinica

## Objetivo
Incluir `tipoClinica` em todos os pontos de emissão de JWT (login, refresh, onboarding) e no endpoint `/auth/me`.

## Dependências
- Task 01 (campo `tipo` existe no banco)
- Task 02 (TokenPayload atualizado)

## Arquivos Impactados
- `apps/api/src/modules/auth/application/login.usecase.ts`
- `apps/api/src/modules/auth/application/refresh.usecase.ts`
- `apps/api/src/modules/auth/infra/auth.controller.ts`

## Detalhamento

### 1. `login.usecase.ts`
Ao buscar o usuário, também buscar a clínica para obter o `tipo`:
```typescript
const usuario = await prisma.usuario.findUnique({
  where: { email: input.email },
  include: { clinica: { select: { tipo: true } } }, // NOVO
});

const payload: TokenPayload = {
  userId: usuario.id,
  clinicaId: usuario.clinicaId,
  email: usuario.email,
  perfil: usuario.perfil,
  tipoClinica: usuario.clinica.tipo, // NOVO
};
```

### 2. `refresh.usecase.ts`
O refresh decodifica o token antigo. Duas abordagens:
- **Simples**: Propagar `decoded.tipoClinica` (pode ser undefined em tokens antigos)
- **Robusto**: Re-buscar a clínica do banco (garante valor atualizado caso o tipo tenha mudado)

**Recomendação**: Abordagem robusta, pois quando o usuário migrar de plano (AUTONOMO ↔ CLINICA), o refresh precisa refletir a mudança imediatamente.

```typescript
const clinica = await prisma.clinica.findUnique({
  where: { id: decoded.clinicaId },
  select: { tipo: true },
});

const payload: TokenPayload = {
  userId: decoded.userId,
  clinicaId: decoded.clinicaId,
  email: decoded.email,
  perfil: decoded.perfil,
  tipoClinica: clinica?.tipo ?? 'CLINICA', // NOVO
};
```

### 3. `auth.controller.ts` — endpoint `/auth/me`
O `me` retorna `req.user` (do JWT). Se o token foi emitido antes da mudança, `tipoClinica` será `undefined`. O endpoint pode enriquecer o dado:
```typescript
export async function me(req: Request, res: Response) {
  const user = req.user!;
  if (!user.tipoClinica) {
    const clinica = await prisma.clinica.findUnique({
      where: { id: user.clinicaId },
      select: { tipo: true },
    });
    user.tipoClinica = clinica?.tipo ?? 'CLINICA';
  }
  return res.json({ success: true, data: user });
}
```

## Critérios de Aceite
- [ ] Login retorna JWT com `tipoClinica`
- [ ] Refresh retorna JWT com `tipoClinica` atualizado do banco
- [ ] `/auth/me` retorna `tipoClinica` mesmo para tokens antigos
- [ ] Tokens de clínicas existentes retornam `CLINICA`

## Riscos / Observações
- **Gap Identificado**: O `refresh.usecase.ts` atualmente **não** consulta o banco para o usuário/clínica. Ele simplesmente re-assina o payload decodificado. Isso é um risco se o perfil ou tipo mudaram desde o último login. A abordagem robusta (re-buscar do banco) resolve isso mas adiciona 1 query extra por refresh.
