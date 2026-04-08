# Questionarios - Analise Tecnica

> Documento de analise e proposta de arquitetura para o modulo de Questionarios do NutriSaaS.

---

## Sumario

1. [Estado Atual](#1-estado-atual)
2. [Problemas Identificados](#2-problemas-identificados)
3. [O que Existe nas Feature Branches](#3-o-que-existe-nas-feature-branches)
4. [Proposta de Melhoria](#4-proposta-de-melhoria)
5. [Schema Proposto (Prisma)](#5-schema-proposto-prisma)
6. [Endpoints Propostos](#6-endpoints-propostos)
7. [Consideracoes Finais](#7-consideracoes-finais)

---

## 1. Estado Atual

### 1.1 Schema no Prisma (branch main)

O modulo de questionarios possui duas tabelas no banco:

```prisma
model Questionario {
  id        String                 @id @default(uuid())
  clinicaId String                 @map("clinica_id")
  clinica   Clinica                @relation(fields: [clinicaId], references: [id])
  nome      String
  perguntas Json                   // <-- blob JSON sem estrutura definida
  criadoEm  DateTime               @default(now()) @map("criado_em")
  respostas RespostaQuestionario[]

  @@index([clinicaId])
  @@map("questionarios")
}

model RespostaQuestionario {
  id              String       @id @default(uuid())
  pacienteId      String       @map("paciente_id")
  paciente        Paciente     @relation(fields: [pacienteId], references: [id])
  questionarioId  String       @map("questionario_id")
  questionario    Questionario @relation(fields: [questionarioId], references: [id])
  respostas       Json         // <-- blob JSON sem estrutura definida
  somatorio       Int?
  resultado       String?
  criadoEm        DateTime     @default(now()) @map("criado_em")

  @@index([pacienteId])
  @@map("respostas_questionarios")
}
```

### 1.2 Backend

Nao existe nenhuma implementacao de backend para questionarios:

- Nenhum controller em `apps/api/src/modules/questionarios/`
- Nenhum arquivo de rotas registrado no router principal (`apps/api/src/routes/index.ts`)
- Nenhum use-case implementado
- Nenhum dado de seed para questionarios

### 1.3 Frontend

O frontend nao possui telas funcionais para o modulo. Existe apenas referencia ao modelo no schema Prisma e a relacao no model `Paciente` (`questionarios RespostaQuestionario[]`).

### 1.4 Referencia Legada (PHP)

O arquivo `docs/questionario.php` contem a implementacao original do sistema legado em CodeIgniter. Ele implementa o **QRM (Questionario de Rastreamento Metabolico)** com:

- 63 sintomas distribuidos em 14 categorias corporais
- Escala de 0 a 4 por sintoma (nunca a frequentemente/sempre)
- Somatorio total com classificacao automatica
- Todas as respostas salvas como colunas individuais na tabela (uma coluna por sintoma)

---

## 2. Problemas Identificados

### 2.1 Campo `perguntas Json` -- Blob Sem Estrutura

| Problema | Impacto |
|----------|---------|
| Sem validacao no banco | Qualquer JSON pode ser inserido; dados corrompidos passam despercebidos |
| Sem normalizacao | Impossivel fazer queries SQL eficientes por pergunta individual |
| Sem tipagem | O frontend e backend precisam "adivinhar" a estrutura do JSON |
| Sem integridade referencial | Perguntas nao tem FK, nao ha cascade, nao ha constraints |
| Dificuldade de migracao | Alterar a estrutura de perguntas exige reprocessar todos os JSONs existentes |

### 2.2 Campo `respostas Json` -- Mesmo Problema

As respostas tambem sao um blob JSON, o que impede:

- **Queries analiticas**: nao da para fazer `SELECT AVG(valor) WHERE pergunta = 'insonia'`
- **Comparacao temporal**: comparar evolucao de um sintoma ao longo de multiplas avaliacoes requer parsing de JSON no app
- **Relatorios agregados**: impossivel gerar estatisticas por pergunta, por categoria, ou por clinica diretamente no SQL

### 2.3 Sem Versionamento

Se o nutricionista alterar as perguntas de um questionario, todas as respostas antigas perdem o contexto. Nao ha como saber quais perguntas estavam vigentes quando o paciente respondeu.

### 2.4 Sem Backend Implementado

O modulo e um "placeholder" -- existe no schema mas nao tem:

- Rotas na API
- Validacao com Zod
- Logica de negocio (use-cases)
- Calculo de somatorio/classificacao no servidor
- Testes

### 2.5 Sem Dados de Seed

O QRM (questionario padrao de rastreamento metabolico) nao esta cadastrado como seed. Toda clinica nova comecaria sem nenhum questionario disponivel.

### 2.6 Sem Multi-tenancy na Resposta

O model `RespostaQuestionario` nao tem `clinicaId` direto. Embora seja possivel chegar a clinica via `questionario.clinicaId`, isso dificulta queries de isolamento e auditoria por tenant.

---

## 3. O que Existe nas Feature Branches

Nas branches de feature (SAASN-15 e relacionadas), foi iniciado um schema normalizado com as seguintes entidades:

| Entidade | Proposito |
|----------|-----------|
| `Questionario` | Cabecalho do questionario (nome, descricao, versao, tipo) |
| `Modulo` | Secoes/categorias dentro do questionario (ex: "Cabeca", "Olhos") |
| `Pergunta` | Pergunta individual, vinculada a um modulo, com ordem e labels de opcoes |
| `RegraInterpretacao` | Faixas de pontuacao e suas classificacoes (ex: <=30 = "saudavel") |
| `Avaliacao` | Sessao de preenchimento (quando o paciente respondeu) |
| `Resposta` | Resposta individual por pergunta dentro de uma avaliacao |

Alem disso, as branches introduzem:

- **Versionamento**: campo `versao` no questionario, permitindo criar novas versoes sem quebrar avaliacoes antigas
- **Soft deletes**: campo `ativo`/`deletadoEm` para desativar sem perder historico
- **Labels dinamicos**: possibilidade de customizar as opcoes de resposta por questionario (ex: "Nunca/Raramente/Frequentemente/Sempre" vs "Sim/Nao")

Porem, essa implementacao nas branches **nao foi finalizada** -- falta backend (controllers, use-cases, rotas), frontend, seeds e testes.

---

## 4. Proposta de Melhoria

### 4.1 Arquitetura de Dados Normalizada

A proposta substitui os campos `Json` por tabelas relacionais completas:

```
Questionario (1) ──→ (N) Modulo (1) ──→ (N) Pergunta
     │
     ├──→ (N) RegraInterpretacao
     │
     └──→ (N) Avaliacao (1) ──→ (N) Resposta ──→ Pergunta
                   │
                   └──→ Paciente
```

**Beneficios:**

- **Integridade referencial**: FKs garantem consistencia; nao ha resposta orfao
- **Queries SQL nativas**: `SELECT pergunta.texto, AVG(resposta.valor) FROM ...` funciona diretamente
- **Relatorios por categoria**: agrupar por modulo/secao sem parsing de JSON
- **Comparacao temporal**: buscar todas as respostas de um paciente para uma pergunta especifica ao longo do tempo
- **Validacao no banco**: constraints de tipo, NOT NULL, CHECK garantem dados limpos
- **Performance**: indices em colunas especificas vs scan de JSON

### 4.2 Versionamento de Questionarios

O versionamento e critico para um sistema clinico:

```
Questionario v1 (Jan/2026) ──→ Avaliacao do Paciente A (Fev/2026)
Questionario v2 (Mar/2026) ──→ Avaliacao do Paciente A (Abr/2026)
```

- Cada avaliacao aponta para a **versao exata** do questionario que foi usada
- Editar um questionario cria uma **nova versao**, mantendo a anterior intacta
- Avaliacoes antigas sempre refletem as perguntas que existiam no momento do preenchimento

Implementacao sugerida: campo `versao Int` no questionario + campo `questionarioOrigemId` para rastrear a linhagem de versoes.

### 4.3 Seed do QRM (Questionario de Rastreamento Metabolico)

O QRM deve ser registrado como seed padrao para toda nova clinica. Dados extraidos do sistema legado (`docs/questionario.php`):

**14 Modulos / 63 Perguntas:**

| Modulo | Sintomas |
|--------|----------|
| Cabeca | Dores de cabeca, Desmaio, Tonturas, Insonia |
| Olhos | Cocando, Inchados, Olheiras, Visao borrada |
| Ouvidos | Coceira, Dores, Fluido/secrecao, Zunido |
| Nariz | Entupido, Sinusite, Ataques de espirro |
| Boca/Garganta | Tosse, Muco, Limpar a garganta, Dor de garganta, Lingua/gengivite, Aftas |
| Pele | Acne, Pele seca, Queda de cabelo, Vermelhidao, Suor excessivo |
| Coracao | Falhando, Batimento rapido, Dor no peito |
| Pulmao | Congestao, Asma, Falta de folego, Dificuldade respiratoria |
| Trato Digestivo | Nauseas, Diarreia, Constipacao, Abdomen destendido, Arrotos/gases, Azia, Dor estomacal |
| Articulacoes/Musculos | Dor articular, Artrite, Rigidez, Dolorido, Fraqueza |
| Energia/Atividade | Fadiga, Apatia, Hiperatividade, Dificuldade de relaxar |
| Mente | Memoria fraca, Confusao, Falta de concentracao, Coordenacao motora, Dificuldade de decisao, Repeticoes, Dificuldade de pronuncia, Dificuldade de aprendizagem |
| Emocional | Alteracoes de humor, Ansiedade, Raiva, Depressao |
| Outros | Doente com frequencia, Urgencia para urinar, Corrimento genital, Edema/inchaco |

**Escala de respostas:** 0 (Nunca), 1 (Raramente), 2 (As vezes), 3 (Frequentemente), 4 (Sempre)

**Regras de interpretacao:**

| Faixa | Classificacao |
|-------|--------------|
| 0 -- 30 | Pessoas mais saudaveis, com menores chances de ter hipersensibilidades |
| 31 -- 39 | Indicativo de existencia de hipersensibilidades |
| 40 -- 99 | Absoluta certeza de existencia de hipersensibilidade |
| >= 100 | Saude muito ruim -- alta dificuldade para tarefas diarias, possivel associacao com doencas cronicas e degenerativas |

### 4.4 Arquitetura da API

Seguindo o padrao DDD ja estabelecido no projeto:

```
apps/api/src/modules/questionarios/
  ├── application/
  │   ├── criarQuestionario.usecase.ts
  │   ├── editarQuestionario.usecase.ts
  │   ├── listarQuestionarios.usecase.ts
  │   ├── buscarQuestionario.usecase.ts
  │   ├── aplicarAvaliacao.usecase.ts
  │   ├── listarAvaliacoes.usecase.ts
  │   ├── buscarAvaliacao.usecase.ts
  │   └── compararAvaliacoes.usecase.ts
  └── infra/
      ├── questionarios.controller.ts
      └── questionarios.routes.ts
```

### 4.5 Arquitetura do Frontend

Telas necessarias:

| Tela | Rota | Descricao |
|------|------|-----------|
| Lista de Questionarios | `/configuracoes/questionarios` | CRUD de questionarios (admin/nutri) |
| Editor de Questionario | `/configuracoes/questionarios/:id` | Edicao de modulos, perguntas, regras |
| Aplicar Questionario | `/pacientes/:id/questionario/:qid` | Tela de preenchimento pelo paciente ou profissional |
| Resultado | `/pacientes/:id/avaliacoes/:aid` | Visualizacao do resultado com pontuacao e classificacao |
| Comparativo | `/pacientes/:id/avaliacoes/comparar` | Grafico comparativo entre avaliacoes ao longo do tempo |

Componentes:

- `QuestionarioForm`: formulario dinamico que renderiza modulos e perguntas a partir dos dados da API
- `ResultadoCard`: exibe somatorio, classificacao e breakdown por modulo
- `ComparativoChart`: grafico de linha/radar comparando avaliacoes (usar biblioteca como Recharts)
- Integracao com a tab de Prontuario do paciente (secao "Questionarios" ao lado de Evolucao, Medidas, Exames)

---

## 5. Schema Proposto (Prisma)

```prisma
// ─── Enums ───────────────────────────────────────────────

enum TipoQuestionario {
  PADRAO          // Seed do sistema (QRM, etc.) -- readonly para clinica
  PERSONALIZADO   // Criado pela clinica
}

// ─── Questionario (cabecalho) ────────────────────────────

model Questionario {
  id                  String               @id @default(uuid())
  clinicaId           String               @map("clinica_id")
  clinica             Clinica              @relation(fields: [clinicaId], references: [id])
  nome                String
  descricao           String?
  tipo                TipoQuestionario     @default(PERSONALIZADO)
  versao              Int                  @default(1)
  questionarioOrigemId String?             @map("questionario_origem_id")
  questionarioOrigem  Questionario?        @relation("Versoes", fields: [questionarioOrigemId], references: [id])
  versoesSeguintes    Questionario[]       @relation("Versoes")
  ativo               Boolean              @default(true)
  criadoEm            DateTime             @default(now()) @map("criado_em")
  atualizadoEm        DateTime             @updatedAt @map("atualizado_em")

  modulos             ModuloQuestionario[]
  regras              RegraInterpretacao[]
  avaliacoes          Avaliacao[]

  @@index([clinicaId])
  @@index([questionarioOrigemId])
  @@map("questionarios")
}

// ─── Modulo (secao/categoria de perguntas) ───────────────

model ModuloQuestionario {
  id              String       @id @default(uuid())
  questionarioId  String       @map("questionario_id")
  questionario    Questionario @relation(fields: [questionarioId], references: [id], onDelete: Cascade)
  nome            String
  descricao       String?
  ordem           Int
  criadoEm        DateTime     @default(now()) @map("criado_em")

  perguntas       Pergunta[]

  @@index([questionarioId])
  @@map("modulos_questionarios")
}

// ─── Pergunta ────────────────────────────────────────────

model Pergunta {
  id        String             @id @default(uuid())
  moduloId  String             @map("modulo_id")
  modulo    ModuloQuestionario @relation(fields: [moduloId], references: [id], onDelete: Cascade)
  texto     String
  ordem     Int
  /// Labels das opcoes em JSON. Ex: ["Nunca","Raramente","As vezes","Frequentemente","Sempre"]
  labels    Json               @default("[\"Nunca\",\"Raramente\",\"As vezes\",\"Frequentemente\",\"Sempre\"]")
  /// Valor minimo da escala (geralmente 0)
  valorMin  Int                @default(0) @map("valor_min")
  /// Valor maximo da escala (geralmente 4)
  valorMax  Int                @default(4) @map("valor_max")
  criadoEm  DateTime           @default(now()) @map("criado_em")

  respostas Resposta[]

  @@index([moduloId])
  @@map("perguntas")
}

// ─── Regra de Interpretacao ──────────────────────────────

model RegraInterpretacao {
  id              String       @id @default(uuid())
  questionarioId  String       @map("questionario_id")
  questionario    Questionario @relation(fields: [questionarioId], references: [id], onDelete: Cascade)
  pontuacaoMin    Int          @map("pontuacao_min")
  pontuacaoMax    Int?         @map("pontuacao_max")   // null = sem limite superior
  classificacao   String
  descricao       String?
  cor             String?      // Cor para exibicao no frontend (ex: "#22c55e", "#ef4444")
  ordem           Int          @default(0)

  @@index([questionarioId])
  @@map("regras_interpretacao")
}

// ─── Avaliacao (sessao de preenchimento) ─────────────────

model Avaliacao {
  id              String       @id @default(uuid())
  clinicaId       String       @map("clinica_id")
  questionarioId  String       @map("questionario_id")
  questionario    Questionario @relation(fields: [questionarioId], references: [id])
  pacienteId      String       @map("paciente_id")
  paciente        Paciente     @relation(fields: [pacienteId], references: [id])
  somatorio       Int
  classificacao   String
  observacoes     String?
  criadoEm        DateTime     @default(now()) @map("criado_em")

  respostas       Resposta[]

  @@index([clinicaId])
  @@index([pacienteId])
  @@index([questionarioId])
  @@index([criadoEm])
  @@map("avaliacoes")
}

// ─── Resposta individual ─────────────────────────────────

model Resposta {
  id          String    @id @default(uuid())
  avaliacaoId String    @map("avaliacao_id")
  avaliacao   Avaliacao @relation(fields: [avaliacaoId], references: [id], onDelete: Cascade)
  perguntaId  String    @map("pergunta_id")
  pergunta    Pergunta  @relation(fields: [perguntaId], references: [id])
  valor       Int

  @@index([avaliacaoId])
  @@index([perguntaId])
  @@map("respostas")
}
```

### 5.1 Relacoes com Models Existentes

Adicionar ao model `Paciente`:

```prisma
model Paciente {
  // ... campos existentes ...
  avaliacoes  Avaliacao[]
}
```

Adicionar ao model `Clinica`:

```prisma
model Clinica {
  // ... campos existentes ...
  questionarios Questionario[]  // ja existe
}
```

Remover os models antigos:

```prisma
// REMOVER: RespostaQuestionario (substituido por Avaliacao + Resposta)
// O campo `questionarios RespostaQuestionario[]` do Paciente vira `avaliacoes Avaliacao[]`
```

### 5.2 Migracao de Dados

Se houver dados na tabela `respostas_questionarios` em producao, sera necessario um script de migracao:

1. Para cada `RespostaQuestionario` existente, criar uma `Avaliacao`
2. Parsear o campo `respostas` (JSON) e criar registros individuais em `Resposta`
3. Manter o `somatorio` e `resultado` originais na `Avaliacao`

---

## 6. Endpoints Propostos

### 6.1 Questionarios (CRUD)

| Metodo | Rota | Descricao | Perfis |
|--------|------|-----------|--------|
| `GET` | `/questionarios` | Listar questionarios da clinica | ADMIN, NUTRICIONISTA, SECRETARIA |
| `GET` | `/questionarios/:id` | Buscar questionario completo (com modulos, perguntas e regras) | ADMIN, NUTRICIONISTA, SECRETARIA |
| `POST` | `/questionarios` | Criar questionario personalizado | ADMIN, NUTRICIONISTA |
| `PUT` | `/questionarios/:id` | Editar questionario (cria nova versao se ja houver avaliacoes) | ADMIN, NUTRICIONISTA |
| `DELETE` | `/questionarios/:id` | Desativar questionario (soft delete) | ADMIN |

### 6.2 Avaliacoes

| Metodo | Rota | Descricao | Perfis |
|--------|------|-----------|--------|
| `GET` | `/pacientes/:pacienteId/avaliacoes` | Listar avaliacoes do paciente | ADMIN, NUTRICIONISTA, SECRETARIA |
| `GET` | `/pacientes/:pacienteId/avaliacoes/:id` | Buscar avaliacao completa (respostas + classificacao) | ADMIN, NUTRICIONISTA, SECRETARIA |
| `POST` | `/pacientes/:pacienteId/avaliacoes` | Aplicar questionario (criar avaliacao com respostas) | ADMIN, NUTRICIONISTA, SECRETARIA |
| `DELETE` | `/pacientes/:pacienteId/avaliacoes/:id` | Excluir avaliacao | ADMIN, NUTRICIONISTA |
| `GET` | `/pacientes/:pacienteId/avaliacoes/comparar` | Comparar evolucao entre avaliacoes (query: `ids=uuid1,uuid2`) | ADMIN, NUTRICIONISTA |

### 6.3 Exemplo de Payloads

**POST `/questionarios`** -- Criar questionario:

```json
{
  "nome": "Questionario de Rastreamento Metabolico",
  "descricao": "QRM - Avaliacao de sintomas por categoria corporal",
  "modulos": [
    {
      "nome": "Cabeca",
      "ordem": 1,
      "perguntas": [
        { "texto": "Dores de cabeca", "ordem": 1 },
        { "texto": "Desmaio", "ordem": 2 },
        { "texto": "Tonturas", "ordem": 3 },
        { "texto": "Insonia", "ordem": 4 }
      ]
    }
  ],
  "regras": [
    { "pontuacaoMin": 0, "pontuacaoMax": 30, "classificacao": "Saudavel", "cor": "#22c55e" },
    { "pontuacaoMin": 31, "pontuacaoMax": 39, "classificacao": "Indicativo de hipersensibilidade", "cor": "#eab308" },
    { "pontuacaoMin": 40, "pontuacaoMax": 99, "classificacao": "Certeza de hipersensibilidade", "cor": "#f97316" },
    { "pontuacaoMin": 100, "pontuacaoMax": null, "classificacao": "Saude muito ruim", "cor": "#ef4444" }
  ]
}
```

**POST `/pacientes/:pacienteId/avaliacoes`** -- Aplicar questionario:

```json
{
  "questionarioId": "uuid-do-questionario",
  "respostas": [
    { "perguntaId": "uuid-pergunta-1", "valor": 2 },
    { "perguntaId": "uuid-pergunta-2", "valor": 0 },
    { "perguntaId": "uuid-pergunta-3", "valor": 3 }
  ],
  "observacoes": "Paciente relata piora nos ultimos 30 dias"
}
```

O backend calcula automaticamente:
- `somatorio`: soma de todos os valores
- `classificacao`: aplicando as regras de interpretacao do questionario

**GET `/pacientes/:pacienteId/avaliacoes/:id`** -- Resposta:

```json
{
  "id": "uuid-avaliacao",
  "criadoEm": "2026-03-26T14:30:00Z",
  "somatorio": 47,
  "classificacao": "Certeza de hipersensibilidade",
  "observacoes": "Paciente relata piora nos ultimos 30 dias",
  "questionario": {
    "id": "uuid-questionario",
    "nome": "Questionario de Rastreamento Metabolico",
    "versao": 1
  },
  "respostasPorModulo": [
    {
      "modulo": "Cabeca",
      "subtotal": 9,
      "respostas": [
        { "pergunta": "Dores de cabeca", "valor": 3 },
        { "pergunta": "Desmaio", "valor": 0 },
        { "pergunta": "Tonturas", "valor": 2 },
        { "pergunta": "Insonia", "valor": 4 }
      ]
    }
  ]
}
```

### 6.4 Validacao Zod (packages/shared)

```typescript
// packages/shared/src/schemas/questionarios.ts

import { z } from 'zod';

export const criarQuestionarioSchema = z.object({
  nome: z.string().min(3).max(200),
  descricao: z.string().max(500).optional(),
  modulos: z.array(z.object({
    nome: z.string().min(1).max(100),
    ordem: z.number().int().positive(),
    perguntas: z.array(z.object({
      texto: z.string().min(1).max(500),
      ordem: z.number().int().positive(),
      labels: z.array(z.string()).min(2).max(10).optional(),
      valorMin: z.number().int().min(0).optional(),
      valorMax: z.number().int().max(10).optional(),
    })).min(1),
  })).min(1),
  regras: z.array(z.object({
    pontuacaoMin: z.number().int().min(0),
    pontuacaoMax: z.number().int().positive().nullable(),
    classificacao: z.string().min(1).max(200),
    descricao: z.string().max(500).optional(),
    cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  })).min(1),
});

export const aplicarAvaliacaoSchema = z.object({
  questionarioId: z.string().uuid(),
  respostas: z.array(z.object({
    perguntaId: z.string().uuid(),
    valor: z.number().int().min(0).max(10),
  })).min(1),
  observacoes: z.string().max(1000).optional(),
});
```

---

## 7. Consideracoes Finais

### 7.1 Multi-tenancy

- O model `Questionario` ja possui `clinicaId` para isolamento por clinica
- O model `Avaliacao` tambem inclui `clinicaId` direto para facilitar queries e auditoria
- Todos os endpoints devem filtrar por `clinicaId` do usuario autenticado (mesmo padrao usado em agendamentos, pacientes, etc.)
- Questionarios do tipo `PADRAO` sao criados via seed e replicados para cada clinica no momento do onboarding

### 7.2 Performance

- **Indices**: todas as FKs e campos de busca frequente possuem indice (`clinicaId`, `pacienteId`, `questionarioId`, `criadoEm`)
- **Cascade delete**: perguntas e respostas seguem cascade a partir do questionario/avaliacao pai
- **Paginacao**: listagens devem usar cursor-based pagination (padrao do Prisma) para avaliacoes
- **Eager loading**: buscar avaliacao completa com `include` de respostas + perguntas + modulos em uma unica query

### 7.3 Extensibilidade

- **Questionarios customizados**: cada clinica pode criar seus proprios questionarios alem do QRM padrao
- **Tipos de escala flexiveis**: o campo `labels` na pergunta permite diferentes escalas (0-4, sim/nao, likert 1-5, etc.)
- **Novas regras de interpretacao**: o modelo de regras e generico o suficiente para qualquer questionario pontuado
- **Exportacao**: a estrutura normalizada facilita exportacao para PDF, CSV e integracao com sistemas externos

### 7.4 Proximos Passos (Ordem de Implementacao)

1. **Migration Prisma**: criar a migration com o schema proposto (remover models antigos, adicionar novos)
2. **Seed do QRM**: implementar seed com os 14 modulos, 63 perguntas e 4 regras de interpretacao
3. **Schemas Zod**: adicionar schemas de validacao em `packages/shared`
4. **Use-cases**: implementar logica de negocio (calculo de somatorio, classificacao, versionamento)
5. **Controller + Rotas**: expor endpoints REST seguindo padrao existente
6. **Frontend -- Aplicacao**: tela de preenchimento do questionario
7. **Frontend -- Resultado**: tela de visualizacao com breakdown por modulo
8. **Frontend -- Comparativo**: graficos de evolucao temporal
9. **Frontend -- CRUD**: telas de gestao de questionarios customizados (admin/nutri)
10. **Testes**: unitarios para use-cases e integracao para endpoints

### 7.5 Estimativa de Complexidade

| Etapa | Complexidade | Motivo |
|-------|-------------|--------|
| Migration + Seed | Media | Muitos dados no seed (63 perguntas), mas schema e direto |
| Backend (API completa) | Media | Segue padroes ja estabelecidos no projeto |
| Frontend -- Aplicacao | Alta | Formulario dinamico com multiplos modulos e validacao |
| Frontend -- Resultado | Media | Renderizacao de dados com classificacao visual |
| Frontend -- Comparativo | Alta | Graficos interativos, selecao de avaliacoes, layout responsivo |
| Frontend -- CRUD admin | Media | CRUD padrao com nested forms (modulos > perguntas) |
