# 📊 Sistema de Questionários Clínicos

## 📑 Sumário

1. [Visão Geral](#1-visao-geral)
2. [Modelo de Dados](#2-modelo-de-dados)
3. [Regras de Versionamento](#3-regras-de-versionamento)
4. [CRUDs e Endpoints](#4-cruds-e-endpoints)
5. [Ordem Recomendada de Uso](#5-ordem-recomendada-de-uso)
6. [Validações e Regras de Negócio](#6-validacoes-e-regras-de-negocio)
7. [Exemplo de Fluxo Completo](#7-exemplo-de-fluxo-completo)

---

<a id="1-visao-geral"></a>

## 1. Visão Geral

Este módulo separa:

- **Estrutura do questionário:** questionário, módulos, perguntas e regras.
- **Execução clínica:** avaliação e respostas por paciente.

Objetivo principal implementado:

- manter histórico de avaliações íntegro;
- aplicar **versionamento automático apenas em mudanças estruturais** quando já existe avaliação;
- impedir novas respostas em versões inativas.

---

<a id="2-modelo-de-dados"></a>

## 2. Modelo de Dados

### Entidades principais

- `Questionario`: `id`, `clinicaId`, `nome`, `versao`, `ativo`
- `Modulo`: `id`, `questionarioId`, `nome`, `ordem`
- `Pergunta`: `id`, `moduloId`, `descricao`, `ordem`
- `RegraInterpretacao`: `id`, `questionarioId`, `pontuacaoMin`, `pontuacaoMax`, `classificacao`
- `Avaliacao`: `id`, `pacienteId`, `questionarioId`, `scoreTotal`, `dataRealizacao`
- `Resposta`: `id`, `avaliacaoId`, `perguntaId`, `pacienteId`, `nota`

### Restrições relevantes

- `Questionario`: `@@unique([clinicaId, nome, versao])`
- `Modulo`: `@@unique([questionarioId, ordem])`
- `Pergunta`: `@@unique([moduloId, ordem])`

---

<a id="3-regras-de-versionamento"></a>

## 3. Regras de Versionamento

### Quando versiona

Versiona automaticamente (clona estrutura, incrementa `versao`, desativa anterior) quando houver **mudança estrutural** em questionário que já possui pelo menos 1 avaliação:

- adicionar módulo;
- adicionar regra;
- adicionar pergunta;
- deletar módulo;
- deletar pergunta.

### Quando não versiona

- `PUT /questionarios/:id` (metadata do questionário);
- `PUT /modulos/:moduloId`;
- `PUT /modulos/:moduloId/perguntas/:perguntaId`.

### Regra de ativação

- só uma versão ativa por questionário (mesmo `nome`) por clínica;
- ao versionar, versões ativas anteriores daquele nome são inativadas.

### Avaliação em versão inativa

- criação de avaliação em questionário inativo retorna erro `400`.

---

<a id="4-cruds-e-endpoints"></a>

## 4. CRUDs e Endpoints

> Prefixos de rota: `/questionarios` e `/modulos`.
>
> Autenticação: todas as rotas usam `authMiddleware`.
>
> Permissão de escrita: `roleGuard("ADMIN", "NUTRICIONISTA")`.

## 4.1 Questionário

### `GET /questionarios`

Lista questionários com resumo por módulo.

**Query params:**

- `page` (opcional, padrão `1`)
- `limit` (opcional, padrão `20`)
- `incluirDeletados` (opcional, `true|false`, padrão `false`)

**Retorno (200):**

- paginação: `total`, `page`, `limit`, `totalPages`
- `data[]` com:
  - `id`, `nome`, `versao`, `ativo`
  - `totalModulos`
  - `modulos[]` com `id`, `nome`, `ordem`, `totalPerguntas`

### `GET /questionarios/:id`

Detalha questionário com módulos e perguntas.

**Query params:**

- `incluirDeletados` (opcional, `true|false`, padrão `false`)

**Retorno (200):**

- `id`, `nome`, `versao`, `ativo`
- `modulos[]` ordenados por `ordem`
- `modulos.perguntas[]` ordenadas por `ordem`

### `POST /questionarios`

Cria questionário.

**Body:**

- `nome` (obrigatório, min 3)
- `versao` (opcional, inteiro positivo)
- `ativo` (opcional)

**Retorno:** `201` com questionário criado.

### `POST /questionarios/default`

Cria (seed) o questionário padrão de hipersensibilidades para a clínica autenticada.

**Body:**

- sem body

**Comportamento:**

- se o questionário padrão (`nome` padrão, `versao = 1`) ainda não existir para a clínica, cria:
  - questionário;
  - módulos padrão;
  - perguntas padrão;
  - regras padrão.
- se já existir, retorna o registro existente (não duplica).

**Retorno:** `201` com o questionário padrão criado/encontrado.

> Observação: o endpoint implementado no backend é `POST /questionarios/default`.

### `PUT /questionarios/:id`

Atualiza **somente metadata** do questionário.

**Body:**

- `nome` (opcional no schema, mas obrigatório na regra de negócio para efetivar alteração)

**Retorno:**

- `200` com questionário atualizado
- `400` se payload sem alteração de metadata

### `DELETE /questionarios/:id`

Exclusão lógica por inativação (`ativo=false`).

**Retorno:**

- `200` com mensagem de sucesso
- `404` se questionário não existir para a clínica

## 4.2 Módulo

### `POST /questionarios/:questionarioId/modulos`

Cria módulo no questionário.

**Body:**

- `nome` (obrigatório, min 3)
- `ordem` (obrigatório, inteiro positivo)

**Regra de ordem:** desloca (`+1`) módulos com `ordem >= novaOrdem`.

**Versionamento:** sim, se já houver avaliação.

### `PUT /modulos/:moduloId`

Edita metadata/ordem do módulo.

**Body:**

- `nome` (opcional)
- `ordem` (opcional)

**Regras:**

- não versiona;
- se alterar ordem, reordena os demais módulos do questionário;
- `ordem` é normalizada para faixa válida.

### `DELETE /modulos/:moduloId`

Remove módulo e reordena os demais.

**Regras:**

- versiona se já houver avaliação;
- depois da exclusão, módulos com ordem maior sofrem `-1`.

## 4.3 Pergunta

### `POST /modulos/:moduloId/perguntas`

Cria pergunta no módulo.

**Body:**

- `descricao` (obrigatório, min 3)
- `ordem` (obrigatório, inteiro positivo)

**Regras:**

- desloca (`+1`) perguntas com `ordem >= novaOrdem`;
- versiona se já houver avaliação.

### `PUT /modulos/:moduloId/perguntas/:perguntaId`

Edita metadata/ordem da pergunta.

**Body:**

- `descricao` (opcional)
- `ordem` (opcional)

**Regras:**

- não versiona;
- se alterar ordem, reordena perguntas do módulo;
- `ordem` é normalizada para faixa válida.

### `DELETE /modulos/:moduloId/perguntas/:perguntaId`

Remove pergunta e reordena as perguntas restantes do módulo.

**Regras:**

- versiona se já houver avaliação;
- após exclusão, perguntas com ordem maior sofrem `-1`.

## 4.4 Regras de interpretação

### `POST /questionarios/:questionarioId/regras`

Cria regra de interpretação.

**Body:**

- `pontuacaoMin` (obrigatório, numérico não-negativo)
- `pontuacaoMax` (obrigatório, numérico não-negativo)
- `classificacao` (obrigatório, min 3)

**Regras:**

- versiona se já houver avaliação;
- `pontuacaoMin <= pontuacaoMax`;
- impede sobreposição de faixas no mesmo questionário.

## 4.5 Avaliação de paciente

### `POST /pacientes/:id/questionarios/:questionarioId/avaliacoes`

Cria avaliação e respostas.

**Regras adicionais implementadas:**

- calcula `scoreTotal` pela soma das notas;
- bloqueia criação se `questionario.ativo = false`.

---

<a id="5-ordem-recomendada-de-uso"></a>

## 5. Ordem Recomendada de Uso

1. Criar questionário (`POST /questionarios`) ou gerar padrão (`POST /questionarios/default`).
2. Criar módulos (`POST /questionarios/:questionarioId/modulos`).
3. Criar perguntas (`POST /modulos/:moduloId/perguntas`).
4. Criar regras de interpretação (`POST /questionarios/:questionarioId/regras`).
5. Consultar estrutura para aplicação (`GET /questionarios/:id`).
6. Registrar respostas do paciente (`POST /pacientes/:id/questionarios/:questionarioId/avaliacoes`).
7. Para manutenção estrutural em produção, preferir operações de create/delete com versionamento automático.

---

<a id="6-validacoes-e-regras-de-negocio"></a>

## 6. Validações e Regras de Negócio

### Segurança e escopo

- todas as consultas/mutações são escopadas por `clinicaId` extraído do token;
- apenas perfis `ADMIN` e `NUTRICIONISTA` alteram estrutura.

### Integridade

- não permite intervalo de regra inválido (`min > max`);
- não permite sobreposição de faixas de regra;
- mantém ordenação consistente de módulos e perguntas;
- em deletes, reordena para evitar “buracos”.

### Atualização de metadata

- `PUT /questionarios/:id` foi restringido a metadata (`nome`), sem update de `versao` ou `ativo`.

### Soft delete

- questionário não é removido fisicamente no delete: é inativado.

---

<a id="7-exemplo-de-fluxo-completo"></a>

## 7. Exemplo de Fluxo Completo

1. Clínica cria `Questionario A` versão `1` (ativo).
2. Pacientes respondem e geram avaliações.
3. Nutricionista precisa remover uma pergunta.
4. Sistema detecta avaliações existentes e:
   - clona estrutura para versão `2`;
   - inativa versão `1`;
   - aplica remoção na versão `2`;
   - mantém histórico das avaliações antigas apontando para versão `1`.
5. Novas avaliações passam a usar a versão `2` ativa.
