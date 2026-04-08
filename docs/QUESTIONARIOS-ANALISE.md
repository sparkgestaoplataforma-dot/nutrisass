# Questionarios - Analise Tecnica e Backlog

> Documento atualizado em 08/04/2026 com o estado real da implementacao apos merge das branches SAASN-15, 20.2, 21, 23 e 128.

---

## Sumario

1. [Estado Atual da Implementacao](#1-estado-atual-da-implementacao)
2. [Engenharia Reversa - O Que Temos Hoje](#2-engenharia-reversa---o-que-temos-hoje)
3. [Problemas e Debitos Tecnicos](#3-problemas-e-debitos-tecnicos)
4. [Backlog de Atividades](#4-backlog-de-atividades)
5. [Detalhamento das Atividades](#5-detalhamento-das-atividades)
6. [Consideracoes de Arquitetura](#6-consideracoes-de-arquitetura)

---

## 1. Estado Atual da Implementacao

### 1.1 O Que Ja Funciona

| Funcionalidade | Status | Onde |
|----------------|--------|------|
| Schema normalizado (Questionario > Modulo > Pergunta) | OK | Prisma schema |
| Seed do QRM padrao (14 modulos, 63 perguntas, 4 regras) | OK | `default-questionario.ts` |
| Seed de avaliacoes para 3 pacientes teste | OK | `seed.ts` |
| CRUD de questionarios (backend) | OK | `questionarios.controller.ts` |
| Versionamento automatico de questionarios | OK | `questionarios.service.ts` |
| Labels de escolha dinamicos (LabelEscolha) | OK | Backend + Frontend |
| Pagina publica de responder questionario | OK | `ResponderQuestionarioPage.tsx` |
| Detalhes da avaliacao (respostas por modulo) | OK | `AvaliacaoDetalhesPage.tsx` |
| Comparativo temporal com grafico | OK | `ComparativoPage.tsx` |
| Card de observacao no prontuario | OK | `ProntuarioPage.tsx` sidebar |
| Modal de selecao de questionario + copiar link | OK | `QuestionarioSelectorModal.tsx` |
| Exclusao de avaliacao | OK | Backend + Frontend |
| Validacao Zod (schemas compartilhados) | OK | `questionario.schema.ts` |

### 1.2 O Que NAO Existe Ainda

| Funcionalidade | Impacto |
|----------------|---------|
| Tela admin de CRUD de questionarios no frontend | Nao da pra criar/editar questionarios pela plataforma |
| Editor visual de modulos/perguntas | Depende do CRUD acima |
| Editor de regras de interpretacao | Depende do CRUD acima |
| Exportacao de avaliacao em PDF | Nutricionista nao consegue imprimir/enviar resultado |
| Tab de Questionarios no Prontuario | Questionarios ficam isolados na sidebar, sem tab dedicada |
| Reordenacao de modulos/perguntas (drag & drop) | UX ruim para organizar questionarios |
| Suporte a escalas flexiveis (1-5, 1-10, sim/nao) | Limitado a escala 0-4 |
| Testes automatizados | Zero cobertura |

### 1.3 Mapa de Arquivos

```
Backend (apps/api/src/modules/)
├── questionarios/
│   ├── infra/
│   │   ├── questionarios.controller.ts  (186 linhas)
│   │   ├── questionarios.routes.ts      (75 linhas)
│   │   └── questionarios.service.ts     (529 linhas)
│   └── seed/
│       └── default-questionario.ts      (191 linhas)
└── avaliacoes/
    └── infra/
        ├── avaliacoes.controller.ts      (37 linhas)
        ├── avaliacoes.routes.ts          (14 linhas)
        └── avaliacoes.service.ts         (117 linhas)

Frontend (apps/web/src/)
├── pages/
│   ├── Questionario/Responder/
│   │   └── ResponderQuestionarioPage.tsx (343 linhas)
│   └── Pacientes/
│       ├── AvaliacaoDetalhes/
│       │   └── AvaliacaoDetalhesPage.tsx (65 linhas)
│       ├── Comparativo/
│       │   └── ComparativoPage.tsx       (323 linhas)
│       └── Prontuario/
│           └── ProntuarioPage.tsx        (sidebar com avaliacoes)
├── components/
│   └── QuestionarioSelectorModal/
│       └── QuestionarioSelectorModal.tsx (200 linhas)
└── services/
    ├── questionarios.ts                  (92 linhas)
    └── avaliacao.ts                      (64 linhas)

Shared (packages/shared/src/schemas/)
└── questionario.schema.ts               (118 linhas)
```

---

## 2. Engenharia Reversa - O Que Temos Hoje

### 2.1 Schema do Banco (Prisma)

```
Questionario (1) ──→ (N) Modulo (1) ──→ (N) Pergunta
     │
     ├──→ (N) RegraInterpretacao
     ├──→ (N) LabelEscolha
     │
     └──→ (N) Avaliacao (1) ──→ (N) Resposta ──→ Pergunta
                   │
                   └──→ Paciente
```

**Campos-chave:**
- `Questionario`: id, clinicaId, nome, versao, ativo
- `Modulo`: id, questionarioId, nome, ordem
- `Pergunta`: id, moduloId, descricao, ordem
- `Avaliacao`: id, dataRealizacao, scoreTotal, pacienteId, questionarioId
- `Resposta`: id, nota (0-4), avaliacaoId, perguntaId, pacienteId
- `RegraInterpretacao`: id, pontuacaoMin, pontuacaoMax, classificacao, questionarioId
- `LabelEscolha`: id, questionarioId, nota, label (unique por questionarioId+nota)

### 2.2 Fluxo de Responder Questionario

```
1. Nutricionista abre modal de selecao (QuestionarioSelectorModal)
2. Copia URL publica: /questionarios/:qid/pacientes/:pid/responder
3. Envia link ao paciente (WhatsApp, email)
4. Paciente abre URL (sem autenticacao)
5. ResponderQuestionarioPage carrega questionario com modulos e perguntas
6. Paciente responde todas as 63 perguntas (0-4 cada)
7. Frontend envia POST /questionarios/:qid/pacientes/:pid/avaliacoes
8. Backend calcula scoreTotal e salva Avaliacao + Respostas
9. No prontuario, nutricionista ve resultado na sidebar
```

### 2.3 Fluxo de Visualizacao

```
Prontuario → Sidebar direita
  ├── Dropdown (seleciona avaliacao por data)
  ├── Card Observacao (classificacao + score + cor dinamica)
  ├── Data da avaliacao
  ├── Somatorio
  ├── Botao "Ver Respostas" → AvaliacaoDetalhesPage
  └── Botao "Comparativo" → ComparativoPage
```

### 2.4 Versionamento (Backend)

O service `resolverQuestionarioParaMutacaoEstrutural()` implementa:
- Se o questionario NAO tem avaliacoes → edita direto
- Se o questionario JA tem avaliacoes → clona para nova versao (preserva historico)
- Clone inclui: modulos, perguntas, regras, labels

### 2.5 Regras de Interpretacao (QRM Padrao)

| Faixa de Score | Classificacao |
|----------------|--------------|
| 0 -- 30 | Pessoa mais saudavel, menores chances de hipersensibilidades |
| 31 -- 39 | Indicativo de existencia de hipersensibilidades |
| 40 -- 99 | Absoluta certeza de existencia de hipersensibilidade |
| >= 100 | Saude muito ruim -- alta dificuldade para tarefas diarias |

---

## 3. Problemas e Debitos Tecnicos

### 3.1 CRITICO - Seguranca (Multi-tenancy)

**Problema:** Os endpoints de avaliacao NAO validam `clinicaId`. Qualquer usuario autenticado pode acessar avaliacoes de qualquer clinica.

**Arquivos afetados:**
- `avaliacoes.controller.ts` — nenhuma funcao chama `getClinicaId(req)`
- `avaliacoes.service.ts` — nenhuma query filtra por clinicaId

**Endpoints vulneraveis:**
| Endpoint | Risco |
|----------|-------|
| `GET /avaliacoes/:id` | Ler avaliacao de outra clinica |
| `GET /avaliacoes/:id/questionario` | Ler respostas completas de outra clinica |
| `GET /avaliacoes/paciente/:id` | Listar avaliacoes de paciente de outra clinica |
| `DELETE /avaliacoes/:id` | Excluir avaliacao de outra clinica |

**Impacto:** Vazamento de dados clinicos entre tenants. Em ambiente SaaS com multiplas clinicas, isso e uma falha grave de privacidade.

**Nota:** O model `Avaliacao` no Prisma nao tem campo `clinicaId` direto. Para validar, hoje seria necessario JOIN via `paciente.clinicaId` ou `questionario.clinicaId`, o que e ineficiente.

### 3.2 CRITICO - Valores Hardcoded em 3+ Lugares

As faixas de score estao duplicadas e hardcoded em:

| Lugar | Arquivo | Linhas |
|-------|---------|--------|
| Banco de dados | `RegraInterpretacao` | Unico lugar correto |
| Prontuario (cor do card) | `ProntuarioPage.tsx` | ~471-477 |
| Comparativo (classificacao) | `ComparativoPage.tsx` | 21-44 |
| Comparativo (exemplos de calculo) | `ComparativoPage.tsx` | 46-67 |
| Responder (labels fallback) | `ResponderQuestionarioPage.tsx` | 14-20 |

**Risco:** Se um nutricionista criar um questionario com regras diferentes (ex: faixa 0-50 = saudavel), o frontend vai mostrar cores/classificacoes erradas porque usa os thresholds hardcoded do QRM padrao.

**Solucao:** Frontend deve consumir as regras da API (`questionario.regras[]`) e aplicar cores/classificacoes dinamicamente.

### 3.3 ALTO - Tipagem Fraca no Frontend

| Arquivo | Problema |
|---------|----------|
| `AvaliacaoDetalhesPage.tsx` | `paciente: any` no state |
| `ComparativoPage.tsx` | `<any>` em queryClient.getQueryData e callbacks |
| `ResponderQuestionarioPage.tsx` | `error: any` no mutation handler |
| `avaliacao.ts` (service) | `modulos: any[]`, `labelEscolha: any[]` no tipo `AvaliacaoComRespostas` |
| Subcomponentes de AvaliacaoDetalhes | Props tipadas como `any` |

**Impacto:** Bugs silenciosos, autocompletion quebrado, dificuldade de manutencao.

### 3.4 ALTO - Erro no AvaliacaoDetalhesPage

```typescript
// Linha 31-32 — chamada duplicada
setAvaliacao(avaliacaoData.data || null);
setAvaliacao(avaliacaoData.data || null); // DUPLICADO
```

Alem disso:
- Nao tem loading state
- Nao tem error handling nos useEffects
- Delete nao aguarda resposta da API antes de navegar

### 3.5 MEDIO - Escala Fixa 0-4

A escala de respostas e limitada a 0-4 em:
- `questionario.schema.ts` (Zod: `nota.min(0).max(4)`)
- `LabelEscolha` (unique constraint por `questionarioId + nota`)
- Frontend fallback labels (5 opcoes fixas)

Isso impede criar questionarios com escala diferente (1-5, 1-10, sim/nao, likert).

### 3.6 MEDIO - Typo no Controller

```typescript
// avaliacoes.controller.ts
export async function Exluir(...) // Deveria ser "Excluir"
```

### 3.7 BAIXO - Endpoint Publico Sem Rate Limit

`GET /questionarios/:id` e publico (sem auth) — por design, para o paciente acessar. Porem nao tem rate limiting, permitindo enumeracao de questionarios.

---

## 4. Backlog de Atividades

### Prioridade CRITICA (Seguranca)

| # | Atividade | Tipo | Estimativa |
|---|-----------|------|-----------|
| C1 | Adicionar `clinicaId` ao model Avaliacao e Resposta | Backend | 2h |
| C2 | Implementar isolamento por clinica nos endpoints de avaliacao | Backend | 3h |
| C3 | Validar que paciente pertence a clinica ao criar avaliacao | Backend | 1h |

### Prioridade ALTA (Qualidade + Features Core)

| # | Atividade | Tipo | Estimativa |
|---|-----------|------|-----------|
| A1 | Eliminar thresholds hardcoded — consumir regras da API | Frontend | 4h |
| A2 | Tipar corretamente todos os `any` nos componentes de questionario | Frontend | 3h |
| A3 | Corrigir bugs do AvaliacaoDetalhesPage (duplicate fetch, error handling, loading) | Frontend | 2h |
| A4 | Criar tela CRUD de questionarios (Configuracoes > Questionarios) | Full-stack | 16h |
| A5 | Criar editor de modulos e perguntas (nested form) | Frontend | 12h |
| A6 | Criar editor de regras de interpretacao | Full-stack | 6h |
| A7 | Criar tab "Questionarios" no Prontuario | Frontend | 4h |

### Prioridade MEDIA (UX + Extensibilidade)

| # | Atividade | Tipo | Estimativa |
|---|-----------|------|-----------|
| M1 | Exportar avaliacao como PDF | Full-stack | 8h |
| M2 | Suporte a escalas flexiveis (1-5, 1-10, sim/nao) | Full-stack | 8h |
| M3 | Drag & drop para reordenar modulos/perguntas | Frontend | 6h |
| M4 | Auto-save rascunho na pagina de responder | Frontend | 4h |
| M5 | Rate limiting no endpoint publico de questionario | Backend | 2h |
| M6 | Skeleton loading nos componentes de avaliacao | Frontend | 2h |
| M7 | Paginacao na listagem de avaliacoes (prontuario) | Full-stack | 3h |

### Prioridade BAIXA (Polish)

| # | Atividade | Tipo | Estimativa |
|---|-----------|------|-----------|
| B1 | Corrigir typo "Exluir" → "Excluir" | Backend | 5min |
| B2 | Mostrar versao do questionario no QuestionarioSelectorModal | Frontend | 30min |
| B3 | Adicionar timestamps (criadoEm/atualizadoEm) nos models Modulo e Pergunta | Backend | 1h |
| B4 | Testes unitarios para questionarios.service.ts | Backend | 8h |
| B5 | Testes unitarios para avaliacoes.service.ts | Backend | 4h |
| B6 | Testes E2E para fluxo completo de responder questionario | QA | 6h |

---

## 5. Detalhamento das Atividades

### C1 + C2: Isolamento Multi-tenant nas Avaliacoes

**Contexto:** Hoje o model `Avaliacao` nao tem `clinicaId`. Para saber a clinica, precisamos fazer JOIN via `paciente.clinicaId` ou `questionario.clinicaId`, que e ineficiente e facil de esquecer.

**O que fazer:**

1. Adicionar ao schema Prisma:
```prisma
model Avaliacao {
  // ... campos existentes ...
  clinicaId  String  @map("clinica_id")
  clinica    Clinica @relation(fields: [clinicaId], references: [id])
  @@index([clinicaId])
}
```

2. Rodar migration para adicionar coluna (popular com base em `paciente.clinicaId`)

3. Alterar `avaliacoes.controller.ts`:
```typescript
export async function listarAvaliacoesPorPacienteId(req, res) {
  const clinicaId = getClinicaId(req);
  const { id } = req.params;
  const avaliacoes = await service.pegarAvaliacoesPorPacienteId(clinicaId, id);
  return res.json({ success: true, data: avaliacoes });
}
```

4. Alterar `avaliacoes.service.ts` — todas as queries devem filtrar por `clinicaId`:
```typescript
export async function pegarAvaliacoesPorPacienteId(clinicaId: string, pacienteId: string) {
  return prisma.avaliacao.findMany({
    where: { pacienteId, clinicaId }, // <-- filtro por clinica
    orderBy: { dataRealizacao: 'desc' },
    include: { questionario: { include: { regras: true } } },
  });
}
```

### A1: Eliminar Thresholds Hardcoded

**Contexto:** `ProntuarioPage.tsx` e `ComparativoPage.tsx` tem as faixas de score (0-30, 31-39, etc.) hardcoded. Se um questionario customizado usar faixas diferentes, as cores e classificacoes ficam erradas.

**O que fazer:**

1. O endpoint `GET /avaliacoes/paciente/:id` ja retorna `questionario.regras[]` no response
2. Criar helper compartilhado:
```typescript
// utils/questionario.ts
export function getClassificacaoFromRegras(
  score: number,
  regras: RegraInterpretacao[]
): { classificacao: string; nivel: number } {
  const sorted = [...regras].sort((a, b) => a.pontuacaoMin - b.pontuacaoMin);
  const idx = sorted.findIndex(r => score >= r.pontuacaoMin && score <= r.pontuacaoMax);
  return {
    classificacao: sorted[idx]?.classificacao ?? 'Sem classificacao',
    nivel: idx, // 0=primeira faixa, 1=segunda, etc.
  };
}

// Cores por nivel (nao por threshold)
const CORES_NIVEL = ['green', 'yellow', 'orange', 'red'];
export function getCorNivel(nivel: number): string {
  return CORES_NIVEL[Math.min(nivel, CORES_NIVEL.length - 1)];
}
```

3. Substituir os ternarios hardcoded por chamadas a esse helper
4. Remover `FAIXAS_SCORE` do ComparativoPage
5. Atualizar exemplos de calculo para serem dinamicos (baseados no numero real de perguntas)

### A4 + A5: CRUD de Questionarios

**Contexto:** Hoje nao existe tela para criar/editar questionarios. O backend ja suporta CRUD completo, mas falta o frontend.

**Rota:** `/configuracoes/questionarios`

**Telas necessarias:**

1. **Listagem** — tabela com nome, versao, status (ativo/inativo), qtd modulos, qtd avaliacoes, acoes (editar, desativar)
2. **Criar/Editar** — formulario com:
   - Nome do questionario
   - Modulos (accordion/lista expansivel)
     - Cada modulo: nome + lista de perguntas
     - Cada pergunta: descricao + ordem
   - Labels de escolha (configurar as opcoes 0-4)
   - Regras de interpretacao (faixas de pontuacao + classificacao)
3. **Preview** — visualizacao de como o paciente vai ver o questionario

**Endpoints ja disponiveis:**
- `GET /questionarios` — listar
- `POST /questionarios` — criar
- `PUT /questionarios/:id` — editar (versiona automaticamente se tem avaliacoes)
- `DELETE /questionarios/:id` — soft delete
- `POST /questionarios/:id/modulos` — adicionar modulo
- `POST /questionarios/:id/regras` — adicionar regras
- CRUD de labels de escolha

**Endpoints que faltam:**
- `PUT /questionarios/:questionarioId/modulos/:moduloId` — editar modulo
- `DELETE /questionarios/:questionarioId/modulos/:moduloId` — excluir modulo
- `PUT /modulos/:moduloId/perguntas/:perguntaId` — editar pergunta
- `DELETE /modulos/:moduloId/perguntas/:perguntaId` — excluir pergunta
- `PUT /questionarios/:id/regras/:regraId` — editar regra
- `DELETE /questionarios/:id/regras/:regraId` — excluir regra

### M1: Exportar Avaliacao como PDF

**Contexto:** Nutricionistas precisam imprimir/enviar resultado da avaliacao para o paciente.

**Proposta:**
- Botao "Exportar PDF" na AvaliacaoDetalhesPage
- Gerar PDF no backend usando `@react-pdf/renderer` ou `puppeteer`
- Incluir: dados do paciente, data, score, classificacao, respostas por modulo, logo da clinica

---

## 6. Consideracoes de Arquitetura

### 6.1 Sobre Escalas Flexiveis (M2)

Hoje a escala e fixada em 0-4 via:
- Zod schema (`nota.min(0).max(4)`)
- `LabelEscolha` unique constraint
- Frontend hardcoded

Para suportar escalas diferentes, seria necessario:
1. Adicionar `escalaMin Int` e `escalaMax Int` no model `Questionario`
2. Ajustar Zod para validar `nota` dinamicamente contra a escala do questionario
3. Ajustar frontend para renderizar N opcoes ao inves de 5 fixas
4. Ajustar regras de interpretacao para considerar escala variavel

**Recomendacao:** Fazer isso DEPOIS do CRUD estar pronto (A4+A5). Adicionar escala flexivel sem UI de gestao nao agrega valor.

### 6.2 Sobre Versionamento

O sistema de versionamento ja funciona bem no backend (`resolverQuestionarioParaMutacaoEstrutural`). Porem o frontend nao mostra versoes ao usuario. Ao implementar o CRUD (A4), incluir:
- Indicador visual de versao no editor
- Aviso antes de editar: "Este questionario ja tem X avaliacoes. Uma nova versao sera criada."
- Historico de versoes na listagem

### 6.3 Sobre a Tab de Questionarios no Prontuario (A7)

Hoje os questionarios ficam isolados na sidebar direita. Proposta:
- Adicionar tab "Questionarios" ao lado de "Evolucao", "Medidas", "Exames"
- Tab mostra: historico de avaliacoes em cards, botao de aplicar novo questionario, link para comparativo
- Sidebar continua mostrando o resumo (observacao + score) da avaliacao mais recente

### 6.4 Sobre Testes (B4-B6)

Prioridade minima de testes recomendada:
- `questionarios.service.ts` — testar versionamento, validacao de overlap de regras, clone
- `avaliacoes.service.ts` — testar calculo de regraInterpretacao, filtro por clinica
- E2E — fluxo completo: criar questionario → paciente responde → nutricionista ve resultado
