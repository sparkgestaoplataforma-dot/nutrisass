# Task 10 — Backend/Frontend: Restrições de Usuários no modo Autônomo

## Objetivo
Impedir a criação de novos usuários e a exclusão do único usuário quando a clínica estiver no modo `AUTONOMO`.

## Dependências
- Task 01 (campo `tipo` em `Clinica`)
- Task 04 (roleGuard bypass)

## Arquivos Impactados
- `apps/api/src/modules/usuarios/infra/usuarios.service.ts`

## Detalhamento

### 1. Impedir criação de novos usuários no modo Autônomo

Na função `criarUsuario` do `usuarios.service.ts`, buscar a clínica e verificar o seu tipo:
```typescript
export async function criarUsuario(clinicaId: string, data: any) {
  // Novo check de segurança:
  const clinica = await prisma.clinica.findUnique({
    where: { id: clinicaId },
    select: { tipo: true },
  });
  
  if (clinica?.tipo === 'AUTONOMO') {
    throw new AppError(
      "Não é possível adicionar novos usuários no modo Autônomo. Migre para o modo Clínica primeiro.",
      400
    );
  }

  const existente = await prisma.usuario.findUnique({
    where: { email: data.email },
  });
  // ... resto do código ...
}
```

### 2. Impedir a exclusão do único usuário da clínica/consultório

Atualmente, o `excluirUsuario` apenas impede a exclusão do último `ADMIN`:
```typescript
  if (existente.perfil === "ADMIN") {
    const totalAdmins = await prisma.usuario.count({
      where: { clinicaId, perfil: "ADMIN" },
    });
    if (totalAdmins <= 1) {
      throw new AppError("Não é possível excluir o último administrador", 400);
    }
  }
```

No modo autônomo, o usuário é `NUTRICIONISTA` (e único). Devemos garantir que **nenhum** usuário único possa ser excluído, independente do perfil:
```typescript
export async function excluirUsuario(id: string, clinicaId: string) {
  const existente = await prisma.usuario.findFirst({
    where: { id, clinicaId },
  });
  if (!existente) throw new AppError("Usuário não encontrado", 404);

  // Impede excluir o último usuário da clínica
  const totalUsuarios = await prisma.usuario.count({
    where: { clinicaId },
  });
  if (totalUsuarios <= 1) {
    throw new AppError("Não é possível excluir o único usuário do consultório/clínica.", 400);
  }

  // Mantém check específico para ADMIN se houver múltiplos usuários
  if (existente.perfil === "ADMIN") {
    const totalAdmins = await prisma.usuario.count({
      where: { clinicaId, perfil: "ADMIN" },
    });
    if (totalAdmins <= 1) {
      throw new AppError("Não é possível excluir o último administrador", 400);
    }
  }

  await prisma.usuario.delete({ where: { id } });
  return { message: "Usuário excluído" };
}
```

## Critérios de Aceite
- [ ] Requisições `POST /usuarios` retornam status 400 se a clínica for `AUTONOMO`
- [ ] Tentativas de deletar o único usuário da clínica (em qualquer modo) retornam status 400
- [ ] Testes de unidade do `usuarios.service.ts` cobrem ambos os cenários de erro

## Riscos / Observações
- Essa validação no backend é essencial para impedir abusos em que o usuário do plano Autônomo tenta adicionar secretárias ou outros nutricionistas por fora da interface gráfica (via chamadas diretas de API).
