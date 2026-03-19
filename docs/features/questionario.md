# 📊 Sistema de Questionários Clínicos

## 📑 Sumário

1. [🧠 Visão Geral](#1-visao-geral)
2. [🧱 Estrutura do Banco](#2-estrutura-do-banco)
3. [🔗 Relacionamentos (Resumo)](#3-relacionamentos-resumo)
4. [🧪 Como Funciona (63 Sintomas)](#4-como-funciona-63-sintomas)
5. [🎯 Regras de Pontuação](#5-regras-de-pontuacao)
6. [📈 Interpretação do Resultado](#6-interpretacao-do-resultado)
7. [🔄 Fluxo Operacional (Passo a Passo)](#7-fluxo-operacional-passo-a-passo)
8. [💡 Exemplo Completo de Execução](#8-exemplo-completo-de-execucao)
9. [✅ Conclusão](#conclusao)

---

<a id="1-visao-geral"></a>

## 1. 🧠 Visão Geral

O sistema de questionários clínicos foi modelado para separar:

- **Estrutura (imutável):** o que será perguntado.
- **Execução (dinâmico):** respostas dos pacientes.

Com isso, o módulo entrega:

- histórico auditável por paciente;
- versionamento controlado por clínica;
- interpretação automática por faixas de pontuação;
- base preparada para novos questionários clínicos.

---

<a id="2-estrutura-do-banco"></a>

## 2. 🧱 Estrutura do Banco

### 📋 Questionário

Define o instrumento clínico (ex.: rastreamento de hipersensibilidade).

**Campos:**

- `id`
- `clinicaId`
- `nome`
- `versao`
- `ativo`

**Relacionamentos:**

- N questionários → 1 clínica
- 1 questionário → N módulos
- 1 questionário → N regras
- 1 questionário → N avaliações

### 🧩 Módulo (Categoria)

Agrupa perguntas por contexto corporal.

**Campos:**

- `id`
- `nome`
- `ordem`
- `questionarioId`

**Relacionamento:**

- 1 módulo → N perguntas

### ❓ Pergunta (Sintoma)

Cada sintoma é uma pergunta.

**Campos:**

- `id`
- `descricao`
- `ordem`
- `moduloId`

**Relacionamento:**

- 1 pergunta → N respostas

### 📊 RegraInterpretacao

Define como interpretar o score final.

**Campos:**

- `id`
- `pontuacaoMin`
- `pontuacaoMax`
- `classificacao`
- `questionarioId`

### 🧾 Avaliacao

Representa uma aplicação completa do questionário para um paciente.

**Campos:**

- `id`
- `dataRealizacao`
- `scoreTotal`
- `pacienteId`
- `questionarioId`

**Relacionamento:**

- 1 avaliação → N respostas

### 📝 Resposta

Resposta de uma pergunta dentro de uma avaliação.

**Campos:**

- `id`
- `nota` (0 a 4)
- `avaliacaoId`
- `perguntaId`
- `pacienteId`

> Observação: `pacienteId` em `Resposta` permite rastreio direto por paciente, mesmo sem navegar pela `Avaliacao`.

---

<a id="3-relacionamentos-resumo"></a>

## 3. 🔗 Relacionamentos (Resumo)

- Clinica → Questionario (1:N)
- Paciente → Avaliacao (1:N)
- Questionario → Modulo (1:N)
- Modulo → Pergunta (1:N)
- Pergunta → Resposta (1:N)
- Avaliacao → Resposta (1:N)
- Questionario → RegraInterpretacao (1:N)
- Paciente → Resposta (1:N)

---

<a id="4-como-funciona-63-sintomas"></a>

## 4. 🧪 Como Funciona (63 Sintomas)

O questionário de hipersensibilidade é composto por **63 sintomas**, organizados por categoria corporal.

| Categoria | Sintomas |
| --- | --- |
| Cabeça | dor de cabeça, desmaio, tonturas, insônia |
| Olhos | coceira, inchaço, olheiras, visão borrada |
| Ouvidos | coceira, dores, fluido, zumbido |
| Nariz | entupido, sinusite, ataques de espirro |
| Boca/Garganta | muco, tosse, dor de garganta, língua/lábios, aftas |
| Pele | acne, pele seca, cabelo, vermelhidão, suor excessivo |
| Coração | batimento falhando/rápido, dor no peito, congestão |
| Pulmão | asma, falta de fôlego, dificuldade respiratória |
| Trato Digestivo | náuseas, diarreia, constipação, distensão, arrotos, azia, dor estomacal |
| Articulações/Músculos | dor articular, artrite, rigidez, dolorido, fraqueza |
| Energia/Atividade | fadiga, apatia, hiperatividade, dificuldade de relaxar |
| Mente | memória, confusão, concentração, coordenação motora, decisão, repetições, pronúncia, aprendizagem |
| Emocional | humor, ansiedade, raiva, depressão |
| Outros | doença frequente, urgência urinária, corrimento, edema |

---

<a id="5-regras-de-pontuacao"></a>

## 5. 🎯 Regras de Pontuação

Cada sintoma recebe nota de **0 a 4**:

- **0** = nunca/quase nunca
- **1** = ocasionalmente
- **2** = frequentemente
- **3** = com frequência
- **4** = sempre/quase sempre

Ao final, o backend calcula:

`somatorio = Σ(nota de todas as respostas)`

Esse valor é salvo em `Avaliacao.scoreTotal`.

---

<a id="6-interpretacao-do-resultado"></a>

## 6. 📈 Interpretação do Resultado

| Somatório | Classificação |
| --- | --- |
| <= 30 | Pessoa mais saudável, menores chances de hipersensibilidades |
| 31 a 39 | Indicativo de existência de hipersensibilidades |
| 40 a 99 | Absoluta certeza de existência de hipersensibilidade |
| >= 100 | Saúde muito ruim — alta dificuldade para tarefas diárias, possível associação com doenças crônicas e degenerativas |

---

<a id="7-fluxo-operacional-passo-a-passo"></a>

## 7. 🔄 Fluxo Operacional (Passo a Passo)

1. **Configuração da clínica**
   - Cadastra `Questionario` (nome, versão, ativo) vinculado à `Clinica`.
   - Cadastra `Modulo` (categorias) e `Pergunta` (sintomas).
   - Cadastra `RegraInterpretacao` com faixas de score.

2. **Aplicação para o paciente**
   - Cria uma `Avaliacao` para `pacienteId` + `questionarioId`.
   - Para cada pergunta, grava uma `Resposta` com `nota`.

3. **Cálculo e persistência**
   - Soma todas as notas das respostas da avaliação.
   - Atualiza `Avaliacao.scoreTotal` com o resultado.

4. **Classificação automática**
   - Busca a regra onde `pontuacaoMin <= scoreTotal <= pontuacaoMax`.
   - Retorna a classificação correspondente.

5. **Consumo no sistema**
   - Exibe score final, categoria de risco e histórico de avaliações.

---

<a id="8-exemplo-completo-de-execucao"></a>

## 8. 💡 Exemplo Completo de Execução

### Cenário

- Paciente responde 63 sintomas.
- O backend grava todas as respostas com notas de 0 a 4.

### Exemplo simplificado (10 respostas)

Notas respondidas: `2, 1, 3, 0, 4, 2, 1, 2, 3, 1`

`somatorio_parcial = 2 + 1 + 3 + 0 + 4 + 2 + 1 + 2 + 3 + 1 = 19`

No questionário real, o mesmo cálculo é feito com as **63 notas**:

`scoreTotal = Σ(nota_1 ... nota_63)`

### Exemplo de classificação final

- Se `scoreTotal = 37` → faixa **31 a 39**
- Resultado: **Indicativo de existência de hipersensibilidades**

### Estruturas persistidas no banco

- 1 registro em `Avaliacao`
- 63 registros em `Resposta`
- 1 `scoreTotal` consolidado para relatórios e histórico

---

<a id="conclusao"></a>

## ✅ Conclusão

Com essa estrutura, o módulo de questionário fica:

- claro para manutenção;
- consistente com o schema atual;
- preparado para escalar por clínica, versão e histórico de paciente.