---
name: criar-calculo-nutricional
description: >-
  Use this skill when adding or modifying clinical, anthropometric, or nutritional
  calculations (TMB, GET, macros g/kg, IMC, Pollock skinfolds, bioimpedance,
  household measures, or food substitutions) in NutriSaaS.
---

# Skill: Criar ou Atualizar Cálculo Nutricional / Antropométrico (TDD)

Todo cálculo clínico do NutriSaaS deve ser determinístico, puro e validado com TDD antes de ir para a interface React.

## Passo 1 — Escrever o Teste Unitário com Caso Clínico Real (TDD - Red)
1. Abra `apps/web/src/utils/nutricaoCalculos.spec.ts`.
2. Adicione um bloco `describe` / `it` com valores conhecidos da literatura científica (ex.: homem de 80kg, 180cm, 30 anos; mulher idosa de 68 anos; alimento com medida caseira de 25g).
3. Inclua testes para casos de borda (`0`, `null`, `undefined`, valores negativos, strings com vírgula `"85,4"`).
4. Execute o teste para vê-lo falhar:
   `npm test --workspace=@nutricao/web`

## Passo 2 — Implementar a Função Pura em `nutricaoCalculos.ts` (TDD - Green)
1. Implemente e exporte a função e suas interfaces em `apps/web/src/utils/nutricaoCalculos.ts`.
2. Regras para funções de cálculo:
   - Zero dependência de React (`useState`, `useEffect`) ou `window`/`document`.
   - Nunca retornar `NaN` ou `Infinity` (retorne `0` ou `null` quando os parâmetros forem inválidos).
   - Arredonde valores de apresentação para 1 ou 2 casas decimais de forma consistente.

## Passo 3 — Integrar no Componente ou Relatório Impresso
1. Importe a função pura de `@/utils/nutricaoCalculos` no componente React (`.tsx`) ou utilitário de impressão (`imprimirMedidas.ts`, `PlanoAlimentarPdfPage.tsx`).
2. Mantenha a interface amigável para nutricionistas de todas as idades:
   - Mostre o valor calculado acompanhado de um badge semântico claro (ex.: `Peso adequado`, `Risco Baixo`, `Normal`, `Acima da ref.`).
   - Sempre indique qual protocolo/critério foi usado (ex.: `OMS Adulto` vs. `Lipschitz Idoso ≥ 60a`).

## Passo 4 — Validação Final
Execute:
```bash
npm test --workspace=@nutricao/web
npm run lint --workspace=@nutricao/web
```

