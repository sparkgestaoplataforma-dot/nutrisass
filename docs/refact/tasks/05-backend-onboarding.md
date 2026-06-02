# Task 05 — Backend: Onboarding bifurcado (Autônomo vs Clínica)

## Objetivo
Adaptar o endpoint de onboarding para criar a estrutura correta dependendo do tipo escolhido.

## Dependências
- Task 01 (campo `tipo` no schema)
- Task 02 (schema de onboarding com `tipo`)
- Task 03 (JWT com `tipoClinica`)

## Arquivos Impactados
- `apps/api/src/modules/clinica/infra/clinica.controller.ts` (função `onboarding`)

## Detalhamento

### Diferenças entre os fluxos

| Aspecto | Clínica (atual) | Autônomo (novo) |
|---------|----------------|-----------------|
| Clinica.tipo | `CLINICA` | `AUTONOMO` |
| Perfil do usuário | `ADMIN` | `NUTRICIONISTA` |
| Token.tipoClinica | `CLINICA` | `AUTONOMO` |
| Convênio "Particular" | ✅ Cria | ✅ Cria |
| Questionário default | ✅ Cria (no frontend) | ✅ Cria (no frontend) |

### Implementação

```typescript
export async function onboarding(req: Request, res: Response) {
  const { tipo = 'CLINICA', clinica, admin } = req.body;
  
  // ... validações existentes ...

  const result = await prisma.$transaction(async (tx) => {
    const novaClinica = await tx.clinica.create({
      data: {
        nome: clinica.nome,
        cnpj: clinica.cnpj || null,
        telefone: clinica.telefone || null,
        email: clinica.email || null,
        endereco: clinica.endereco || null,
        tipo: tipo, // NOVO
      },
    });

    const novoAdmin = await tx.usuario.create({
      data: {
        clinicaId: novaClinica.id,
        nome: admin.nome,
        email: admin.email,
        senha: senhaHash,
        perfil: tipo === 'AUTONOMO' ? 'NUTRICIONISTA' : 'ADMIN', // NOVO
      },
    });

    await tx.convenio.create({
      data: { clinicaId: novaClinica.id, nome: 'Particular' },
    });

    return { clinica: novaClinica, admin: novoAdmin };
  });

  const payload: TokenPayload = {
    userId: result.admin.id,
    clinicaId: result.clinica.id,
    email: result.admin.email,
    perfil: result.admin.perfil,
    tipoClinica: result.clinica.tipo, // NOVO
  };

  // ... emissão de tokens ...
}
```

## Critérios de Aceite
- [ ] Onboarding com `tipo: 'CLINICA'` funciona como antes (perfil ADMIN)
- [ ] Onboarding com `tipo: 'AUTONOMO'` cria clínica com `tipo=AUTONOMO` e usuário com `perfil=NUTRICIONISTA`
- [ ] Token retornado inclui `tipoClinica` correto
- [ ] Convênio "Particular" é criado em ambos os casos
- [ ] Testes do onboarding atualizados para cobrir ambos os fluxos

## Riscos / Observações
- **Gap Identificado**: No modo autônomo, o campo "Nome da Clínica" no onboarding poderia ser auto-preenchido com o nome do profissional + "Consultório" (ex: "Consultório Anna Nutri"). Isso é uma melhoria de UX tratada na Task 07 (frontend onboarding).
