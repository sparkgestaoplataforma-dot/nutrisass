# Task 01 — Schema Prisma: Enum TipoClinica + Campo na Clinica

## Objetivo
Adicionar o enum `TipoClinica` e o campo `tipo` na tabela `Clinica` no Prisma Schema.

## Dependências
- Nenhuma (primeira task da cadeia)

## Arquivos Impactados
- `apps/api/prisma/schema.prisma`

## Detalhamento

### 1. Criar enum `TipoClinica`
```prisma
enum TipoClinica {
  AUTONOMO
  CLINICA
}
```

### 2. Adicionar campo `tipo` no model `Clinica`
```prisma
model Clinica {
  // ... campos existentes
  tipo TipoClinica @default(CLINICA)
}
```

### 3. Gerar e aplicar migration
```bash
npx prisma migrate dev --name add-tipo-clinica
npx prisma generate
```

## Critérios de Aceite
- [ ] Enum `TipoClinica` existe no schema
- [ ] Campo `tipo` existe na tabela `clinicas` com default `CLINICA`
- [ ] Migration aplicada com sucesso
- [ ] Prisma Client regenerado
- [ ] Registros existentes no banco permanecem com `tipo = CLINICA` (retrocompatibilidade)

## Riscos / Observações
- A migration é retrocompatível: o default `CLINICA` garante que clínicas existentes não quebram.
