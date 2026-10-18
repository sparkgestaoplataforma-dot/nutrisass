## 1. Vulnerabilidades de Segurança Críticas

### 🚨 Bypass de Isolamento Multi-tenant (IDOR) no Módulo de Agenda

- **Arquivos Afetados:**
  - agenda.controller.ts (linhas 100-147, 149-176, 178-202)

  - agenda.service.ts (funções `editarAgendamento`, `alterarStatusAgendamento` e `excluirAgendamento`)

#### Descrição

Nas rotas de **Edição**, **Alteração de Status** e **Exclusão** de agendamentos, o sistema carrega o agendamento usando o ID fornecido pela requisição sem validar se ele pertence à mesma clínica (`clinicaId`) do usuário autenticado no token.

```typescript
// Exemplo em agenda.service.ts (editarAgendamento):
const existente = await prisma.agendamento.findUnique({ where: { id } });
// O objeto 'existente' é recuperado e modificado sem conferir o clinicaId!
```

#### Impacto

**Gravíssimo.** Qualquer usuário autenticado de uma Clínica A pode editar, alterar o status ou apagar agendamentos de uma Clínica B, bastando conhecer ou adivinhar o UUID do agendamento (vulnerabilidade do tipo _Insecure Direct Object Reference_ ou IDOR).

#### Solução Recomendada

Garantir que a busca inicial valide o `clinicaId` do usuário logado:

```typescript
const existente = await prisma.agendamento.findFirst({
  where: { id, clinicaId },
});
if (!existente) throw new AppError("Agendamento não encontrado", 404);
```

---

## 2. Inconsistências e Bugs de Lógica no Backend

### 🔄 Desconexão Forçada por Falha de Gravação do Refresh Token no Redis

- **Arquivos Afetados:**
  - clinica.controller.ts (função `alterarTipoClinica`)

  - refresh.usecase.ts

#### Descrição

Ao realizar a migração de modo de operação (`alterarTipoClinica`), o backend atualiza as permissões do usuário e emite um par de novos tokens (`accessToken` e `refreshToken`). Contudo, **o novo&#x20;**`refreshToken`**&#x20;não é persistido no Redis** sob a chave `refresh:${userId}`.

```typescript
// Em clinica.controller.ts (alterarTipoClinica):
const accessToken = jwt.sign(payload, env.JWT_SECRET, {
  expiresIn: env.JWT_EXPIRES_IN,
});
const refreshToken = jwt.sign(payload, env.JWT_SECRET, {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN,
});

// O controller retorna os tokens para o cliente, mas não faz a chamada de gravação no Redis!
return res.json({
  success: true,
  data: { tipo, perfil, tokens: { accessToken, refreshToken } },
});
```

No entanto, o caso de uso `refreshUseCase` valida o token enviado comparando-o estritamente com o token no Redis:

```typescript
const storedToken = await redisGet(`refresh:${decoded.userId}`);
if (storedToken && storedToken !== refreshToken) {
  throw new AppError("Refresh token inválido ou expirado", 401);
}
```

#### Impacto

Assim que o novo `accessToken` expirar no cliente, o interceptor de resposta do Axios tentará renová-lo usando o novo `refreshToken`. Como a chave no Redis ainda armazena o token de refresh antigo (gerado no último login convencional), a comparação falhará (`storedToken !== refreshToken`). O sistema responderá com `401` e deslogará o usuário inesperadamente de volta para a tela de login.

#### Solução Recomendada

Importar `redisSet` no `clinica.controller.ts` e registrar o novo refresh token antes de retorná-lo:

```typescript
await redisSet(`refresh:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
```

---

## 3. Brechas de Autorização (RBAC)

### 🔑 Ausência de Role Guard na Rota de Transição de Modo de Operação

- **Arquivo Afetado:** clinica.routes.ts

#### Descrição

A rota que gerencia a transição de modo de operação de uma clínica não possui validação de perfil administrativo (`ADMIN`):

```typescript
clinicaRoutes.put(
  "/tipo",
  authMiddleware,
  validate(alterarTipoSchema),
  controller.alterarTipoClinica,
);
```

#### Impacto

Em clínicas estruturadas com múltiplos profissionais (modo `CLINICA`), qualquer usuário comum (como `SECRETARIA` ou `NUTRICIONISTA` que não seja gestor administrativo) pode disparar um PUT para `/api/clinica/tipo` e tentar alterar as configurações organizacionais de toda a instituição ou rebaixar a conta para o modo autônomo (o que falhará apenas caso haja mais de 1 usuário, mas representa uma quebra clara de privilégios de controle).

_Nota: No modo autônomo (_`AUTONOMO`_), o middleware&#x20;_`roleGuard`_&#x20;possui um bypass padrão para permitir que o nutricionista autônomo acesse todas as opções da clínica. Portanto, adicionar&#x20;_`roleGuard('ADMIN')`_&#x20;não impedirá o autônomo de retornar ao modo clínica._

#### Solução Recomendada

Aplicar o `roleGuard('ADMIN')` na rota correspondente:

```diff
-clinicaRoutes.put('/tipo', authMiddleware, validate(alterarTipoSchema), controller.alterarTipoClinica);
+clinicaRoutes.put('/tipo', authMiddleware, roleGuard('ADMIN'), validate(alterarTipoSchema), controller.alterarTipoClinica);
```

---

## 4. Inconsistências de UI / UX no Frontend

### 🔇 Silenciamento de Erros e Reversão Inconsistente em `handleChangeStatus`

- **Arquivos Afetados:**
  - AgendaPage.tsx

  - useAgenda.ts

#### Descrição

A função `handleChangeStatus` executa o status do agendamento utilizando `statusMutation.mutate({ id, input: { status: status as any } })`. No entanto, a mutação não fornece nenhum tratamento de erros (`onError`).

#### Impacto

Caso o backend rejeite a mudança de status por conflito de horários (por exemplo, ao tentar marcar um paciente como "AGENDADO" em um horário que já foi ocupado por outro compromisso normal ativo), o backend lançará um erro HTTP 400.\
Na interface do usuário, esse erro será silenciado (ocorrendo de forma invisível no console do navegador), o seletor visual permanecerá na opção inválida que o usuário tentou escolher, e o estado real da agenda ficará dessincronizado até que a página seja completamente recarregada.

#### Solução Recomendada

Adicionar um callback `onError` no `useAlterarStatus` ou na chamada `.mutate` no `AgendaPage.tsx` para apresentar um feedback (alert, toast ou modal) notificando o motivo da recusa.

---

### 📊 Dropdown de Filtro do Dashboard Ocultado e Bloqueado para o Perfil ADMIN

- **Arquivo Afetado:** DashboardPage.tsx

#### Descrição

No frontend, o cabeçalho e os filtros por nutricionista do Dashboard são visíveis apenas para o perfil `SECRETARIA`:

```typescript
// L73: Define o valor padrão
const [nutricionistaId, setNutricionistaId] = useState<string | undefined>(
  user?.perfil === "SECRETARIA" ? undefined : user?.userId,
);
...
// L149: Condiciona a UI do filtro
{user?.perfil === "SECRETARIA" && (
  <div className={styles.header}>
    ...
    <select id="nutri-select" ...>
```

No entanto, no backend (`dashboard.controller.ts`), o perfil `ADMIN` também é elegível para ver a totalidade dos dados da clínica e efetuar filtros individuais:

```typescript
const targetId = isAutonomo
  ? usuarioId
  : usuarioPerfil === "SECRETARIA" || usuarioPerfil === "ADMIN"
    ? nutricionistaId
      ? (nutricionistaId as string)
      : undefined
    : usuarioId;
```

#### Impacto

O administrador da clínica (`ADMIN`) não tem acesso à seleção de nutricionistas no frontend e fica forçado a ver apenas dados ligados ao seu próprio ID de usuário, impedindo-o de desempenhar um papel analítico ou gestor sobre as agendas globais no Dashboard.

#### Solução Recomendada

Alterar a condição no frontend para incluir o perfil `ADMIN` nas permissões de filtro do dashboard:

```typescript
const [nutricionistaId, setNutricionistaId] = useState<string | undefined>(
  (user?.perfil === "SECRETARIA" || user?.perfil === "ADMIN") ? undefined : user?.userId,
);
...
{(user?.perfil === "SECRETARIA" || user?.perfil === "ADMIN") && (
  <div className={styles.header}>
    ...
```
