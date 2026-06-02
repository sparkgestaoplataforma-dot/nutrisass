# Task 02 — Shared Types: TokenPayload + OnboardingSchema

## Objetivo
Propagar o `tipoClinica` pelo sistema, adicionando-o ao `TokenPayload` (JWT) e ao schema de onboarding.

## Dependências
- Task 01 (schema Prisma precisa existir)

## Arquivos Impactados
- `packages/shared/src/types/index.ts`
- `packages/shared/src/schemas/clinica.schema.ts`

## Detalhamento

### 1. Atualizar `TokenPayload` em `types/index.ts`
```typescript
export interface TokenPayload {
  userId: string;
  clinicaId: string;
  email: string;
  perfil: string;
  tipoClinica: 'AUTONOMO' | 'CLINICA'; // NOVO
}
```

### 2. Atualizar `onboardingSchema` em `clinica.schema.ts`
Adicionar campo `tipo` no nível raiz (não dentro de `clinica`):
```typescript
export const onboardingSchema = z.object({
  tipo: z.enum(['AUTONOMO', 'CLINICA']).default('CLINICA'), // NOVO
  clinica: z.object({
    nome: z.string().min(2, '...'),
    cnpj: z.string().optional(),
    telefone: z.string().optional(),
    email: z.string().email('...').optional(),
    endereco: z.string().optional(),
  }),
  admin: z.object({
    nome: z.string().min(2, '...'),
    email: z.string().email('...'),
    senha: z.string().min(6, '...'),
  }),
});
```

## Critérios de Aceite
- [ ] `TokenPayload` inclui `tipoClinica`
- [ ] `onboardingSchema` aceita campo `tipo` com valores `AUTONOMO` | `CLINICA`
- [ ] `OnboardingInput` type exporta o campo `tipo`
- [ ] Build do package shared compila sem erros

## Riscos / Observações
- **Gap Crítico Identificado**: O `TokenPayload` é lido de `req.user` no endpoint `/auth/me`. Como `req.user` vem do JWT decodificado, o `tipoClinica` só estará disponível para tokens emitidos **após** esta mudança. Tokens antigos não terão o campo. O frontend deve tratar `tipoClinica` como possivelmente `undefined` e defaultar para `'CLINICA'` nesse caso.
