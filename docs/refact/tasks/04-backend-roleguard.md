# Task 04 — Backend: roleGuard com bypass para autônomo

## Objetivo
Garantir que o nutricionista autônomo (perfil `NUTRICIONISTA` + `tipoClinica: AUTONOMO`) tenha acesso a **todas as rotas**, inclusive as protegidas por `roleGuard('ADMIN')`.

## Dependências
- Task 03 (tipoClinica disponível no JWT / req.user)

## Arquivos Impactados
- `apps/api/src/shared/middlewares/auth.ts` (roleGuard)

## Detalhamento

### O Problema (Gap Crítico)
No modo autônomo, o usuário é `NUTRICIONISTA`. Mas várias rotas exigem `ADMIN`:

| Rota | Guard Atual | Autônomo bloqueado? |
|------|------------|-------------------|
| `PUT /clinica` | `roleGuard('ADMIN')` | ✅ **SIM** — não pode editar dados da própria clínica |
| `POST /convenios` | `roleGuard('ADMIN')` | ✅ **SIM** — não pode criar convênios |
| `PUT /convenios/:id` | `roleGuard('ADMIN')` | ✅ **SIM** — não pode editar convênios |
| `DELETE /convenios/:id` | `roleGuard('ADMIN')` | ✅ **SIM** — não pode excluir convênios |
| `DELETE /exames/base/:id` | `roleGuard('ADMIN')` | ✅ **SIM** — não pode excluir exames base |
| `GET /usuarios` | `roleGuard('ADMIN', 'SECRETARIA')` | ✅ **SIM** — não pode listar usuários |
| `POST /usuarios` | `roleGuard('ADMIN', 'SECRETARIA')` | ✅ **SIM** — não pode criar usuários |
| `DELETE /usuarios/:id` | `roleGuard('ADMIN')` | ✅ **SIM** — não pode excluir usuários |

### Solução
Modificar o `roleGuard` para conceder acesso total quando `tipoClinica === 'AUTONOMO'`:

```typescript
export function roleGuard(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Não autenticado', 401);
    }

    // Autônomo tem acesso total (é o único usuário)
    if (req.user.tipoClinica === 'AUTONOMO') {
      return next();
    }

    if (!roles.includes(req.user.perfil)) {
      throw new AppError('Sem permissão para acessar este recurso', 403);
    }

    next();
  };
}
```

## Critérios de Aceite
- [ ] Nutricionista autônomo pode acessar `PUT /clinica`
- [ ] Nutricionista autônomo pode CRUD de convênios
- [ ] Nutricionista autônomo pode CRUD de exames base
- [ ] Nutricionista autônomo pode CRUD de questionários
- [ ] Modo clínica continua funcionando como antes (sem regressão)
- [ ] Testes do auth middleware atualizados

## Riscos / Observações
- **Segurança**: Este bypass é seguro porque no modo autônomo existe apenas 1 usuário. Não há risco de escalação de privilégios pois não há outros usuários para comparar.
- **Gap de CRUD de Usuários para autônomo**: Embora o autônomo ganhe acesso técnico às rotas de CRUD de usuários, o frontend **não deve exibir** essa funcionalidade. Isso é tratado na Task 08 (frontend).
