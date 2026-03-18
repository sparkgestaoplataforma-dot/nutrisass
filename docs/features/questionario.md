# 📊 Documentação - Sistema de Questionários (Anamnese)

---

# 📑 Sumário

1. [Estrutura das Tabelas](#-estrutura-das-tabelas)
2. [Cardinalidade](#-cardinalidade)
3. [Lógica da Modelagem](#-lógica-por-trás-da-modelagem)
4. [Tipos de Questão](#-tipos-de-questão-enum)
5. [Lógica por Tipo de Questão](#-lógica-por-tipo-de-questão)
6. [Versionamento](#-versionamento)
7. [Rotas da API](#-rotas-da-api-alto-nível)
8. [Regras Importantes](#-regras-importantes)
9. [Conclusão](#-conclusão)

---

# 🧱 Estrutura das Tabelas

## 📋 Questionario

```ts
id: uuid
clinicaId: uuid
titulo: string
descricao?: string
ativo: boolean
createdAt: Date
```

---

## 🔁 QuestionarioVersao

```ts
id: uuid;
questionarioId: uuid;
versao: number;
ativo: boolean;
createdAt: Date;
```

---

## 📦 Modulo

```ts
id: uuid;
questionarioVersaoId: uuid;
titulo: string;
ordem: number;
```

---

## ❓ Questao

```ts
id: uuid;
moduloId: uuid;
enunciado: string;
tipo: TipoQuestao;
obrigatoria: boolean;
ordem: number;
```

---

## 🔘 QuestaoOpcao

```ts
id: uuid
questaoId: uuid
texto: string
valor?: number
ordem: number
```

---

## 🧾 Resposta

```ts
id: uuid;
questionarioVersaoId: uuid;
pacienteId: uuid;
createdAt: Date;
```

---

## 🧩 RespostaItem

```ts
id: uuid
respostaId: uuid
questaoId: uuid

valorTexto?: string
valorNumero?: number
valorBooleano?: boolean
```

---

## ☑️ RespostaItemOpcao

```ts
id: uuid;
respostaItemId: uuid;
questaoOpcaoId: uuid;
```

---

# 🔗 Cardinalidade

```
Questionario 1 ─── N QuestionarioVersao

QuestionarioVersao 1 ─── N Modulo

Modulo 1 ─── N Questao

Questao 1 ─── N QuestaoOpcao

QuestionarioVersao 1 ─── N Resposta

Resposta 1 ─── N RespostaItem

RespostaItem 1 ─── N RespostaItemOpcao
```

---

# 🧠 Lógica por trás da modelagem

## 📌 Separação entre estrutura e resposta

O sistema separa:

- Estrutura → Questionario, Modulo, Questao, QuestaoOpcao
- Dados → Resposta, RespostaItem, RespostaItemOpcao

Isso permite:

- versionamento seguro
- histórico consistente
- flexibilidade para novos tipos

---

## ❓ Por que existe `Questao` e `QuestaoOpcao`?

Nem toda questão possui alternativas.

### Exemplos:

### TEXTO

> "Descreva sua dor"

- não precisa de opções

---

### MULTIPLA ESCOLHA

> "Onde dói?"

- precisa de opções:
  - Cabeça
  - Costas
  - Pernas

👉 Por isso existe `QuestaoOpcao`

---

## 🧩 Por que `RespostaItem` e `RespostaItemOpcao`?

### `RespostaItem`

- representa a resposta base de uma questão

### `RespostaItemOpcao`

- representa as opções escolhidas

---

### Exemplo:

Checkbox:

> "Quais sintomas você sente?"

- Febre
- Dor

Resultado:

- 1 `RespostaItem`
- 2 `RespostaItemOpcao`

---

# 🧠 Tipos de Questão (ENUM)

```ts
enum TipoQuestao {
  TEXTO
  BOOLEANO
  NUMERICO
  ESCALA
  MULTIPLA_ESCOLHA
  CHECKBOX
}
```

---

# 🧪 Lógica por tipo de questão

## ✍️ TEXTO

- não usa opções
- usa: `valorTexto`

Exemplo:

```json
{
  "valorTexto": "Dor na lombar"
}
```

---

## 🔘 BOOLEANO

- não usa opções
- usa: `valorBooleano`

Exemplo:

```json
{
  "valorBooleano": true
}
```

---

## 🔢 NUMERICO

- número livre
- usa: `valorNumero`

Exemplo:

```json
{
  "valorNumero": 8
}
```

---

## 📊 ESCALA

- número com range (ex: 1–5)
- usa: `valorNumero`

Exemplo:

```json
{
  "valorNumero": 4
}
```

---

## 🔵 MULTIPLA_ESCOLHA

- usa `QuestaoOpcao`
- apenas 1 escolha

Exemplo:

```json
{
  "opcaoId": 2
}
```

---

## ☑️ CHECKBOX

- usa `QuestaoOpcao`
- múltiplas escolhas

Exemplo:

```json
{
  "opcoesIds": [1, 3]
}
```

---

# ⚙️ Versionamento

## 📌 Como funciona

- Cada alteração estrutural cria uma nova versão
- Versões antigas nunca são alteradas

---

## 🔄 O que gera nova versão

- adicionar/remover questão
- alterar tipo
- alterar opções

---

## ✏️ O que NÃO gera versão

- correção de texto
- ajuste de título

---

## 🧠 Estratégia

- snapshot completo (cópia de módulos, questões e opções)

---

# 🌐 Rotas da API (alto nível)

## 📋 Questionário

### Criar

```
POST /questionarios
```

- cria questionário + versão inicial

---

### Atualização leve (sem versão)

```
PATCH /questionarios/:id
```

- altera título, descrição, etc.

---

### Atualização estrutural (com versão)

```
POST /questionarios/:id/versionar
```

- cria nova versão
- clona estrutura
- aplica mudanças

---

### Deletar

```
DELETE /questionarios/:id
```

- soft delete (`ativo = false`)

---

## 📦 Módulos

### Adicionar módulo

```
POST /modulos
```

- cria dentro da versão ativa

---

## ❓ Questões

### Adicionar questão

```
POST /questoes
```

- define tipo
- cria opções (se necessário)

---

## 🔘 Opções

### Adicionar opções

```
POST /questoes/:id/opcoes
```

---

## 🧾 Respostas

### Responder questionário

```
POST /respostas
```

### Exemplo payload:

```json
{
  "questionarioVersaoId": "uuid",
  "pacienteId": "uuid",
  "respostas": [
    {
      "questaoId": "uuid",
      "valorTexto": "Dor leve"
    },
    {
      "questaoId": "uuid",
      "valorBooleano": true
    },
    {
      "questaoId": "uuid",
      "opcoesIds": ["uuid", "uuid"]
    }
  ]
}
```

---

# 🔐 Regras importantes

- Apenas um `valor_*` pode ser preenchido
- `RespostaItemOpcao` só existe para questões com opções
- Versões são imutáveis
- Sempre validar baseado no `tipo`

---

# 💬 Conclusão

Esse modelo:

- é escalável
- suporta múltiplos tipos de pergunta
- permite versionamento seguro
- mantém histórico consistente
- facilita evolução futura

---
