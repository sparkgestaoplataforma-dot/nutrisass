# Task 09 — Backend: Endpoint de migração de plano (AUTONOMO ↔ CLINICA)

## Objetivo
Criar endpoint para permitir ao usuário migrar entre os modos Autônomo e Clínica.

## Dependências
- Task 01 (campo `tipo` no schema)
- Task 04 (roleGuard com bypass)

## Arquivos Impactados
- `apps/api/src/modules/clinica/infra/clinica.controller.ts` (nova função)
- `apps/api/src/modules/clinica/infra/clinica.routes.ts` (nova rota)
- `packages/shared/src/schemas/clinica.schema.ts` (novo schema de validação)

## Detalhamento

### Novo endpoint: `PUT /clinica/tipo`

#### AUTONOMO → CLINICA
1. Atualizar `clinica.tipo` para `CLINICA`
2. Alterar `perfil` do usuário de `NUTRICIONISTA` para `ADMIN`
3. Retornar novos tokens com `tipoClinica: 'CLINICA'` e `perfil: 'ADMIN'`

#### CLINICA → AUTONOMO
1. Verificar se existe **apenas 1 usuário ativo** na clínica
   - Se houver mais de 1, bloquear: "Remova os outros usuários antes de migrar para o modo Autônomo"
2. Atualizar `clinica.tipo` para `AUTONOMO`
3. Alterar `perfil` do usuário para `NUTRICIONISTA`
4. Retornar novos tokens com `tipoClinica: 'AUTONOMO'` e `perfil: 'NUTRICIONISTA'`

### Implementação

```typescript
export async function alterarTipoClinica(req: Request, res: Response) {
  const clinicaId = getClinicaId(req);
  const userId = getUsuarioId(req);
  const { tipo } = req.body; // 'AUTONOMO' | 'CLINICA'
  
  const clinica = await prisma.clinica.findUnique({ where: { id: clinicaId } });
  if (!clinica) throw new AppError('Clínica não encontrada', 404);
  
  if (clinica.tipo === tipo) {
    throw new AppError(`A clínica já está no modo ${tipo}`, 400);
  }

  if (tipo === 'AUTONOMO') {
    const totalUsuarios = await prisma.usuario.count({ where: { clinicaId } });
    if (totalUsuarios > 1) {
      throw new AppError(
        'Para migrar para o modo Autônomo, a clínica deve ter apenas 1 usuário. Remova os demais primeiro.',
        400
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.clinica.update({
      where: { id: clinicaId },
      data: { tipo },
    });

    const novoPerfil = tipo === 'AUTONOMO' ? 'NUTRICIONISTA' : 'ADMIN';
    await tx.usuario.update({
      where: { id: userId },
      data: { perfil: novoPerfil },
    });

    return { tipo, perfil: novoPerfil };
  });

  // Emitir novos tokens
  const payload: TokenPayload = {
    userId,
    clinicaId,
    email: req.user!.email,
    perfil: result.perfil,
    tipoClinica: result.tipo,
  };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });

  return res.json({
    success: true,
    data: { tipo: result.tipo, perfil: result.perfil, tokens: { accessToken, refreshToken } },
  });
}
```

### Rota
```typescript
clinicaRoutes.put('/tipo', authMiddleware, validate(alterarTipoSchema), controller.alterarTipoClinica);
```
Nota: sem `roleGuard` — qualquer perfil autenticado na clínica pode migrar (tanto ADMIN quanto NUTRICIONISTA autônomo).

## Critérios de Aceite
- [ ] AUTONOMO → CLINICA: altera tipo e perfil, retorna novos tokens
- [ ] CLINICA → AUTONOMO: bloqueia se >1 usuário, altera se 1 usuário
- [ ] Tokens retornados refletem o novo `tipoClinica` e `perfil`
- [ ] Testes cobrindo ambas as direções e o bloqueio

## Riscos / Observações
- **Gap Identificado**: Ao migrar AUTONOMO → CLINICA, o usuário muda de NUTRICIONISTA para ADMIN. Mas ele pode querer continuar atendendo como nutricionista. No sistema atual, ADMIN **não** pode criar planos alimentares (rota protegida por `roleGuard('NUTRICIONISTA')`). Duas soluções:
  - (a) O `roleGuard` já tem bypass para autônomo, mas agora ele é CLINICA. Então o ADMIN no modo clínica não tem acesso a rotas de NUTRICIONISTA.
  - (b) Após a migração, o admin pode criar um segundo usuário NUTRICIONISTA para si mesmo (usando outro email).
  - **Recomendação**: Isso não é um blocker agora. O admin migrado pode criar um NUTRICIONISTA com um alias de email na tela de Configurações > Usuários.

- **Fluxo do Frontend no Sucesso da Migração**:
  Ao receber a resposta do endpoint com os novos tokens, o frontend **deve** atualizar a store de autenticação para evitar erros de 403 e atualizar a interface imediatamente:
  ```typescript
  // Exemplo de fluxo no componente que chamará a migração:
  const { setTokens, setUser } = useAuthStore();
  
  const mutation = useMutation({
    mutationFn: (tipo: 'AUTONOMO' | 'CLINICA') => api.put('/clinica/tipo', { tipo }),
    onSuccess: async (res) => {
      // 1. Atualiza os tokens
      setTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
      // 2. Busca e atualiza as informações do usuário logado (me)
      const user = await getMe();
      setUser(user);
      // 3. Redireciona ou recarrega a página para atualizar o estado global das rotas
      window.location.reload(); 
    }
  });
  ```
