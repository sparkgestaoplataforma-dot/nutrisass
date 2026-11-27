---
name: docknotes-board
description: >-
  Use this skill whenever interacting with the DockNotes web app in Chrome (via the
  browser subagent) to create new tasks in Backlog, inspect active sprint cards and
  their Drawer details, check assignee ownership, or move a card to Fazendo.
---

# Skill: Operação Remota do Board DockNotes (`docknotes-board`)

O **DockNotes** ainda não possui servidor MCP próprio; por isso, toda leitura e escrita no board é feita via subagente `browser` conectado à sessão aberta do Google Chrome do desenvolvedor (`chrome://inspect/#remote-debugging` habilitado).

> **Dica de eficiência**: Se já existir um subagente `browser` criado na conversa atual, reutilize-o com `send_message` em vez de instanciar um novo. Caso receba erro de `DevToolsActivePort`, peça ao usuário para confirmar que o Remote Debugging está ativo em `chrome://inspect/#remote-debugging`.

Utilize **exclusivamente as duas telas abaixo** dentro do projeto **Saas de Nutrição (SAASN)** no DockNotes:

---

## Fluxo 1 — Criar Nova Tarefa (`Fluxo de trabalho > Backlog`)

Use este fluxo somente **após** a especificação da task (`especificar-task`) e seus metadados (responsáveis, prioridade, categoria e datas) estarem definidos pelo usuário no prompt.

1. Na **sidebar à esquerda**, clique em **`Fluxo de trabalho`** → **`Backlog`**.
2. No **canto superior direito** da tela de Backlog, clique no botão **`"Nova Tarefa"`** para abrir o modal **`Novo Item`**.
3. Preencha os campos do modal **`Novo Item`**:
   - **Título**: campo `"Título do item..."`.
   - **Categoria / Tipo**: clique na pílula correspondente (`Épico`, `História`, `Tarefa`, `Bug`, `Débito Técnico`, `Spike`, `Hotfix` ou `Teste`). **Não** clique em `"Gerar com IA"` nem `"Gerar template"` do modal — utilize o conteúdo já especificado.
   - **Descrição**: cole o Markdown completo da task mastigada.
   - **Prioridade**: selecione `Crítica`, `Alta`, `Média` ou `Baixa`.
   - **Data Início** (`Selecionar...`) e **Data Entrega** (`Selecionar...`): selecione as datas informadas no prompt.
   - **Responsáveis**:
     - Tasks de código (Backend, Frontend, Testes): selecionar `Jeffson Luiz Oliveira de Lima Santos` e/ou `Kevin Maravilha Henrique da Silva` conforme instruído no prompt.
     - Tasks de infraestrutura, servidor, deploy ou configuração externa de gateway: selecionar `Talles Carrelo`.
   - **Participantes** (quando solicitado no prompt): escolher a função (`Co-autor`, `Revisor` ou `QA Tester`) e marcar o integrante correspondente.
4. Confirme/salve a criação do item e retorne ao usuário o código gerado (`SAASN-XX`) e o título criado.

---

## Fluxo 2 — Ler Contexto e Iniciar Tarefa (`EXECUÇÃO > Sprint Ativa`)

Use este fluxo quando o usuário pedir para listar tarefas da sprint ou executar uma issue específica (`SAASN-XX`).

1. Na **sidebar à esquerda**, clique em **`EXECUÇÃO`** → **`Sprint Ativa`** para abrir o quadro Kanban da sprint.
   *(Nota: se o usuário pedir explicitamente uma issue que ainda está fora da sprint ativa, consulte em `Fluxo de trabalho > Backlog`)*.
2. Localize o card desejado (`SAASN-XX`) e **clique sobre o card** para abrir o **Drawer lateral** de detalhes.
3. Extraia do Drawer todo o contexto necessário:
   - Código (`SAASN-XX`), Título e `Tipo` (`Tarefa`, `Bug`, `História`, etc.)
   - `Descrição` completa
   - `Sub-tasks` e `Checklists` (se houver)
   - `Comentários & Atividade` (para decisões recentes do time)
   - `Status` atual, `Prioridade`, `Estimativa`, `Data Início` / `Data Entrega`
   - **`Responsáveis`**

### Regras Inegociáveis de Governança no Board
1. **Verificação Obrigatória de Responsável**:
   - Ao atuar para o Jeffson, o agente **SÓ PODE iniciar/codificar uma issue se `Jeffson Luiz Oliveira de Lima Santos` estiver listado em `Responsáveis`**.
   - Se a issue estiver atribuída exclusivamente a outro integrante (ex.: somente `Kevin Maravilha Henrique da Silva` ou somente `Talles Carrelo`), **PARE IMEDIATAMENTE**, avise o usuário quem é o responsável atual e **não modifique nem o card nem o código** (a menos que o usuário dê ordem expressa para assumir).
2. **Movimentação de Coluna / Status**:
   - **Ao iniciar o desenvolvimento**: altere o campo `Status` no Drawer (ou mova o card no board) para **`Fazendo`**.
   - **Ao concluir o desenvolvimento**: **PROIBIDO mover o card para `Concluído`**. O card permanece em `Fazendo` (podendo opcionalmente receber comentário se o usuário pedir), pois mover para `Concluído` é uma validação exclusiva do humano responsável.
