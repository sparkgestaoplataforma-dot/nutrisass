# NutriSaaS — Roadmap Detalhado por Tarefas

> Documento para importação em sistema de gerenciamento de projetos.
> Cada fase contém épicos, e cada épico contém tarefas específicas com critérios de aceite.

---

## Fase 1 — Fundação (CONCLUÍDA)

> Todos os itens abaixo já estão implementados e em produção.

- [x] Auth (JWT + Redis blacklist + refresh token)
- [x] Agenda (CRUD + status inline + Socket.io real-time + stats cards)
- [x] Pacientes (CRUD + busca paginada + form completo)
- [x] Prontuário (Perfil + tabs: Evolução Clínica, Medidas, Exames)
- [x] Exames (Solicitação por checkboxes + registro de resultados + CRUD exames base)
- [x] Convênios (CRUD admin only)
- [x] Usuários (CRUD admin only + proteção último admin)
- [x] Relatórios (filtros por data/status + stats + tabela + impressão)
- [x] Dashboard com KPIs reais
- [x] Multi-tenancy (isolamento por clinicaId em todas as tabelas)
- [x] Onboarding de clínicas (cadastro público com criação de clínica + admin)

---

## Fase 2 — Tela de Atendimento Completa

> Prioridade máxima. É a tela principal da nutricionista durante a consulta.
> Referência visual: ficha completa do paciente com dados pessoais, estado clínico estruturado, questionários com somatório e interpretação.

---

### Épico 2.1 — Estado Clínico Estruturado

**Contexto:** Hoje o prontuário tem uma "Evolução Clínica" com campos de texto (estadoClinico, aparelhoDigestivo, antecedentesMorbidos, medicamentos, outros). Precisamos transformar isso numa timeline de atendimento onde cada seção tem histórico com datas, como um diário clínico.

#### Tarefas Backend:

- [ ] **2.1.1 — Refatorar model EvolucaoClinica no Prisma**
  - Manter os campos atuais (estadoClinico, aparelhoDigestivo, antecedentesMorbidos, medicamentos, outros)
  - Adicionar campo `dataAtendimento` (DateTime, default now) separado de `criadoEm`
  - Adicionar campo `usuarioId` (FK) para registrar qual profissional criou a evolução
  - Rodar migration e atualizar seed
  - **Aceite:** migration aplicada sem perda de dados, model atualizado

- [ ] **2.1.2 — Endpoint: listar evoluções com filtro por seção**
  - GET `/prontuario/:pacienteId/evolucoes`
  - Query params: `secao` (opcional, filtra por campo específico), `page`, `limit`
  - Retornar com paginação e ordenado por dataAtendimento DESC
  - Incluir nome do profissional que criou (join com Usuario)
  - **Aceite:** retorna evoluções paginadas, filtráveis por seção, com nome do profissional

- [ ] **2.1.3 — Endpoint: criar evolução com seções parciais**
  - POST `/prontuario/:pacienteId/evolucoes`
  - Permitir enviar apenas as seções preenchidas (todas opcionais)
  - Registrar automaticamente o usuarioId do profissional logado
  - **Aceite:** cria evolução mesmo com apenas 1 seção preenchida

- [ ] **2.1.4 — Endpoint: editar evolução individual**
  - PUT `/prontuario/evolucoes/:id`
  - Validar que o profissional é o mesmo que criou ou é ADMIN
  - **Aceite:** edição funciona, validação de permissão ok

- [ ] **2.1.5 — Endpoint: excluir evolução**
  - DELETE `/prontuario/evolucoes/:id`
  - Soft delete ou hard delete (definir)
  - Validar permissão (criador ou ADMIN)
  - **Aceite:** exclusão funciona com validação de permissão

#### Tarefas Frontend:

- [ ] **2.1.6 — Componente: Timeline de Estado Clínico**
  - Criar componente `EstadoClinicoTimeline` que exibe evoluções em formato de timeline vertical
  - Cada entrada mostra: data, profissional, e as seções preenchidas
  - Ícones coloridos por seção (Sintomas, Aparelho Digestivo, Antecedentes, Medicamentos, Outros)
  - Seções vazias não aparecem no card
  - **Aceite:** timeline visual com ícones, datas e conteúdo por seção

- [ ] **2.1.7 — Componente: Formulário de Nova Evolução**
  - Formulário com 5 seções colapsáveis (accordion): Sintomas, Aparelho Digestivo, Antecedentes Mórbidos, Medicamentos, Outros
  - Cada seção com textarea de texto rico (ou textarea simples com markdown)
  - Campo de data do atendimento (default: hoje)
  - Botões: Cancelar e Salvar
  - **Aceite:** formulário salva evolução, seções colapsáveis funcionam, data editável

- [ ] **2.1.8 — Componente: Edição inline de evolução**
  - Clicar em uma evolução existente abre modo edição nos campos daquela evolução
  - Botões: Cancelar edição e Salvar alterações
  - **Aceite:** edição inline funciona, mutação invalida cache

- [ ] **2.1.9 — Filtro por seção na timeline**
  - Dropdown ou botões para filtrar a timeline por seção específica (ex: "só Medicamentos")
  - Opção "Todas" para ver tudo
  - **Aceite:** filtro funciona, atualiza lista em tempo real

---

### Épico 2.2 — Questionários Dinâmicos

**Contexto:** A nutricionista precisa aplicar questionários padronizados (ex: rastreamento de hipersensibilidades alimentares) durante o atendimento. Cada questionário tem perguntas com pesos, e o sistema calcula o somatório + interpreta o resultado automaticamente.

#### Tarefas Backend — Models:

- [ ] **2.2.1 — Criar model QuestionarioModelo no Prisma**
  - Campos: id, clinicaId, nome, descricao, criadoEm, atualizadoEm, ativo (boolean)
  - Relação 1:N com QuestionarioModeloPergunta
  - **Aceite:** migration aplicada, model funcional

- [ ] **2.2.2 — Criar model QuestionarioModeloPergunta no Prisma**
  - Campos: id, questionarioModeloId (FK), texto, tipo (ESCALA_1_5, SIM_NAO, MULTIPLA_ESCOLHA, TEXTO_LIVRE), peso (Float, default 1.0), ordem (Int), obrigatoria (Boolean)
  - Relação 1:N com QuestionarioModeloOpcao (para MULTIPLA_ESCOLHA)
  - **Aceite:** migration aplicada, suporta diferentes tipos de pergunta

- [ ] **2.2.3 — Criar model QuestionarioModeloOpcao no Prisma**
  - Campos: id, perguntaId (FK), texto, valor (Float — peso da opção), ordem (Int)
  - **Aceite:** migration aplicada

- [ ] **2.2.4 — Criar model QuestionarioResposta no Prisma**
  - Campos: id, pacienteId (FK), questionarioModeloId (FK), usuarioId (FK — quem aplicou), dataAplicacao, somatorio (Float, calculado), resultado (String, interpretação), criadoEm
  - Relação 1:N com QuestionarioRespostaItem
  - **Aceite:** migration aplicada

- [ ] **2.2.5 — Criar model QuestionarioRespostaItem no Prisma**
  - Campos: id, respostaId (FK), perguntaId (FK), valorNumerico (Float, opcional), valorTexto (String, opcional)
  - **Aceite:** migration aplicada

- [ ] **2.2.6 — Criar model QuestionarioFaixaInterpretacao no Prisma**
  - Campos: id, questionarioModeloId (FK), valorMinimo (Float), valorMaximo (Float), descricao (String — ex: "Indicativo de existência de hipersensibilidades")
  - Permite que cada questionário tenha faixas de interpretação customizáveis
  - **Aceite:** migration aplicada, múltiplas faixas por modelo

#### Tarefas Backend — CRUD de Modelos de Questionário:

- [ ] **2.2.7 — Endpoint: listar modelos de questionário**
  - GET `/questionarios/modelos`
  - Filtro por clinicaId (multi-tenant), apenas ativos por default
  - Retornar com count de perguntas
  - **Aceite:** lista modelos com contagem de perguntas

- [ ] **2.2.8 — Endpoint: buscar modelo completo**
  - GET `/questionarios/modelos/:id`
  - Retornar com todas as perguntas, opções e faixas de interpretação
  - Ordenado por pergunta.ordem
  - **Aceite:** retorna modelo completo com perguntas ordenadas

- [ ] **2.2.9 — Endpoint: criar modelo de questionário**
  - POST `/questionarios/modelos`
  - Body: nome, descricao, perguntas (array com texto, tipo, peso, ordem, opcoes), faixas (array com min, max, descricao)
  - Criar tudo em transaction (modelo + perguntas + opções + faixas)
  - Permissão: ADMIN ou NUTRICIONISTA
  - **Aceite:** cria modelo completo em uma única requisição

- [ ] **2.2.10 — Endpoint: editar modelo de questionário**
  - PUT `/questionarios/modelos/:id`
  - Permitir editar nome, descricao, ativo
  - Permitir adicionar/editar/remover perguntas, opções e faixas
  - Validar que não existem respostas vinculadas antes de remover perguntas
  - **Aceite:** edição completa funcional com validações

- [ ] **2.2.11 — Endpoint: excluir modelo de questionário**
  - DELETE `/questionarios/modelos/:id`
  - Soft delete (ativo = false) se houver respostas vinculadas
  - Hard delete se não houver respostas
  - **Aceite:** exclusão segura, não perde dados históricos

#### Tarefas Backend — Aplicação e Respostas:

- [ ] **2.2.12 — Endpoint: aplicar questionário a paciente**
  - POST `/questionarios/paciente/:pacienteId/responder`
  - Body: questionarioModeloId, respostas (array com perguntaId + valorNumerico ou valorTexto)
  - Calcular somatório automaticamente: soma(valorNumerico * peso da pergunta)
  - Determinar interpretação baseada nas faixas do modelo
  - Registrar usuarioId do profissional que aplicou
  - **Aceite:** cria resposta com somatório e interpretação calculados automaticamente

- [ ] **2.2.13 — Endpoint: listar respostas de questionários do paciente**
  - GET `/questionarios/paciente/:pacienteId`
  - Query params: questionarioModeloId (opcional, para filtrar por tipo)
  - Retornar com: data, somatório, resultado (interpretação), nome do modelo
  - Ordenado por dataAplicacao DESC
  - **Aceite:** lista respostas com filtro por tipo de questionário

- [ ] **2.2.14 — Endpoint: ver resposta completa**
  - GET `/questionarios/respostas/:id`
  - Retornar resposta com todos os itens, perguntas originais e valores
  - **Aceite:** retorna detalhes completos da resposta

- [ ] **2.2.15 — Endpoint: comparativo de questionários**
  - GET `/questionarios/paciente/:pacienteId/comparativo?modeloId=xxx`
  - Retornar todas as respostas do mesmo modelo para o paciente
  - Ordenado por data, com somatório e interpretação de cada
  - Ideal para visualizar evolução ao longo do tempo
  - **Aceite:** retorna série temporal de respostas para comparação

#### Tarefas Backend — Validação:

- [ ] **2.2.16 — Criar schemas Zod para questionários**
  - Em `packages/shared/src/schemas/questionario.schema.ts`
  - Schemas: createQuestionarioModelo, updateQuestionarioModelo, responderQuestionario
  - Validar tipos de pergunta, pesos positivos, faixas não sobrepostas
  - **Aceite:** schemas criados, importáveis no front e back

#### Tarefas Frontend — CRUD de Modelos:

- [ ] **2.2.17 — Página: Lista de Modelos de Questionário**
  - Rota: `/configuracoes/questionarios`
  - Tabela com: nome, qtd perguntas, status (ativo/inativo), ações (editar, excluir)
  - Botão "Novo Questionário"
  - Permissão: ADMIN ou NUTRICIONISTA
  - **Aceite:** lista modelos, permite navegar para criação/edição

- [ ] **2.2.18 — Página: Criar/Editar Modelo de Questionário**
  - Rota: `/configuracoes/questionarios/novo` e `/configuracoes/questionarios/:id/editar`
  - Form com: nome, descrição
  - Seção dinâmica de perguntas: adicionar, reordenar (drag & drop ou setas), remover
  - Cada pergunta: texto, tipo (dropdown), peso, obrigatória (toggle)
  - Se tipo = MULTIPLA_ESCOLHA: sub-form para adicionar opções com valor
  - Seção de faixas de interpretação: min, max, descrição (adicionar/remover)
  - Preview do questionário
  - **Aceite:** formulário completo funciona, cria/edita modelo com todas as perguntas e faixas

#### Tarefas Frontend — Aplicação durante Atendimento:

- [ ] **2.2.19 — Componente: Seletor de Questionário**
  - Dropdown para escolher qual questionário aplicar
  - Mostra questionários ativos da clínica
  - **Aceite:** dropdown funcional, carrega modelos ativos

- [ ] **2.2.20 — Componente: Formulário de Preenchimento de Questionário**
  - Renderiza perguntas dinamicamente conforme o tipo:
    - ESCALA_1_5: radio buttons ou slider (1 a 5)
    - SIM_NAO: toggle ou radio (Sim=1, Não=0)
    - MULTIPLA_ESCOLHA: radio ou checkbox com opções
    - TEXTO_LIVRE: textarea
  - Indicador de progresso (pergunta X de Y)
  - Botões: Cancelar e Finalizar
  - **Aceite:** renderiza qualquer tipo de pergunta, coleta respostas corretamente

- [ ] **2.2.21 — Componente: Resultado do Questionário**
  - Exibe após finalizar: somatório numérico + texto de interpretação
  - Destaque visual (cor/ícone) baseado na faixa (ex: verde = normal, amarelo = atenção, vermelho = alerta)
  - Botão para ver respostas detalhadas
  - **Aceite:** resultado exibido imediatamente após preenchimento

- [ ] **2.2.22 — Componente: Sidebar de Resultados de Questionários**
  - Posicionada à direita na tela de atendimento (como na referência)
  - Dropdown para selecionar o questionário
  - Tabela compacta: Data, Somatório, Resultado, link "Ver Resultado"
  - Clique em "Ver Resultado" abre modal com detalhes
  - **Aceite:** sidebar funcional, exibe histórico de resultados do paciente

- [ ] **2.2.23 — Componente: Comparativo de Questionários**
  - Botão "Ver Comparativo" abre modal ou página
  - Gráfico de linha mostrando somatório ao longo do tempo
  - Tabela comparativa: data | somatório | interpretação (lado a lado)
  - Ideal para mostrar evolução do paciente
  - **Aceite:** gráfico de evolução funcional, tabela comparativa visível

---

### Épico 2.3 — Tela de Atendimento Unificada

**Contexto:** Unificar todos os componentes da Fase 2 numa única tela de atendimento, como na referência visual.

#### Tarefas Frontend:

- [ ] **2.3.1 — Refatorar layout do ProntuarioPage**
  - Layout de 3 colunas:
    - Esquerda (sidebar estreita): navegação — Medidas, Exames (como na referência)
    - Centro (conteúdo principal): dados do paciente + estado clínico + exames + questionários
    - Direita (sidebar): resultados de questionários
  - Responsivo: em telas menores, sidebars viram tabs ou colapsam
  - **Aceite:** layout 3 colunas funcional, responsivo

- [ ] **2.3.2 — Seção: Dados do Paciente (header)**
  - No topo da coluna central
  - Exibir: nome, profissão, nascimento, email, telefone, endereço, bairro
  - Botão "Alterar dados Paciente" (link para edição)
  - **Aceite:** dados do paciente exibidos de forma compacta e clara

- [ ] **2.3.3 — Seção: Exames (botões de ação)**
  - Abaixo dos dados do paciente
  - 4 botões coloridos: Solicitar, Solicitados, Outros, Resultados
  - Cada botão abre modal ou expande seção correspondente
  - **Aceite:** botões funcionais, abrem conteúdo correto

- [ ] **2.3.4 — Seção: Questionários (botões de ação)**
  - Botões: "Ver Todos" (lista todas as respostas), "Ver Comparativo" (abre comparativo)
  - Dropdown ou botão para aplicar novo questionário
  - **Aceite:** navegação para questionários funcional

- [ ] **2.3.5 — Seção: Estado Clínico (timeline)**
  - Integrar o componente EstadoClinicoTimeline (tarefa 2.1.6) na coluna central
  - Botão para adicionar nova evolução
  - Scroll infinito ou paginação para histórico longo
  - **Aceite:** timeline integrada, scroll funcional

- [ ] **2.3.6 — Integrar sidebar de Resultados de Questionários**
  - Posicionar o componente da tarefa 2.2.22 na coluna direita
  - Fixo durante scroll da coluna central
  - **Aceite:** sidebar fixa, exibe resultados, funcional

- [ ] **2.3.7 — Criar rota e navegação**
  - Rota: `/pacientes/:id` (já existe, refatorar)
  - Breadcrumb: Início > Ver Paciente
  - Navbar superior deve ter: Início, Calendário, Pacientes, Exames, Relatórios, Usuários
  - **Aceite:** navegação funcional, breadcrumb correto

- [ ] **2.3.8 — Estilos SCSS da tela de atendimento**
  - SCSS Module dedicado para o layout de atendimento
  - Cards com bordas suaves, espaçamento consistente
  - Cores por seção (ícones coloridos na timeline)
  - Botões coloridos estilo badges (verde, laranja, vermelho, azul)
  - **Aceite:** visual limpo e profissional, consistente com o design system

---

## Fase 3 — Polimento & UX

---

### Épico 3.1 — Máscaras de Input

- [ ] **3.1.1 — Instalar biblioteca de máscaras**
  - Instalar `react-input-mask` ou `react-imask` no apps/web
  - **Aceite:** dependência instalada

- [ ] **3.1.2 — Criar componente MaskedInput reutilizável**
  - Componente wrapper que aceita prop `mask` e integra com react-hook-form
  - **Aceite:** componente funcional, compatível com react-hook-form

- [ ] **3.1.3 — Aplicar máscara de CPF**
  - Formato: 000.000.000-00
  - Aplicar em: form de paciente (campo CPF)
  - Salvar sem máscara no banco (apenas números)
  - Exibir com máscara na listagem/prontuário
  - **Aceite:** CPF com máscara no form, salvo sem máscara, exibido com máscara

- [ ] **3.1.4 — Aplicar máscara de Telefone**
  - Formato: (00) 0000-0000 ou (00) 00000-0000 (celular)
  - Aplicar em: form de paciente (campos telefone e whatsapp), form da clínica
  - **Aceite:** máscara funcional, detecta fixo vs celular

- [ ] **3.1.5 — Aplicar máscara de CEP**
  - Formato: 00000-000
  - Aplicar em: form de paciente (campo CEP)
  - Bonus: integrar com API ViaCEP para auto-completar endereço
  - **Aceite:** máscara funcional, preenchimento automático de endereço (bonus)

- [ ] **3.1.6 — Aplicar máscara de CNPJ**
  - Formato: 00.000.000/0000-00
  - Aplicar em: form de onboarding da clínica
  - **Aceite:** máscara funcional no cadastro de clínica

---

### Épico 3.2 — Upload de Logomarca

- [ ] **3.2.1 — Configurar Cloudflare R2 (bucket + credentials)**
  - Criar bucket no R2 para uploads
  - Gerar access keys
  - Adicionar variáveis de ambiente: R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET
  - **Aceite:** bucket criado, variáveis configuradas

- [ ] **3.2.2 — Backend: provider de upload para R2**
  - Criar `shared/providers/storage.ts`
  - Funções: upload(file, path) → url, delete(path) → void
  - Usar AWS SDK v3 com endpoint do R2
  - **Aceite:** upload e delete funcionais para R2

- [ ] **3.2.3 — Backend: endpoint de upload de logo**
  - POST `/clinica/logo` (multipart/form-data)
  - Validar: tipo de arquivo (png, jpg, svg), tamanho máximo (2MB)
  - Salvar URL no campo `logo` da tabela Clinica
  - Deletar logo anterior se existir
  - Permissão: ADMIN only
  - **Aceite:** upload funciona, URL salva no banco, arquivo anterior removido

- [ ] **3.2.4 — Adicionar campo logo no model Clinica**
  - Campo `logo` (String, opcional) no Prisma schema
  - Migration
  - **Aceite:** campo adicionado, migration aplicada

- [ ] **3.2.5 — Frontend: componente de upload de logo**
  - Na página de configurações da clínica
  - Preview da imagem atual
  - Drag & drop ou clique para selecionar
  - Crop/resize antes do upload (opcional)
  - Feedback de progresso
  - **Aceite:** upload funcional com preview

- [ ] **3.2.6 — Frontend: exibir logo no sidebar/header**
  - Buscar logo da clínica no endpoint `/clinica`
  - Exibir no topo do sidebar ou header
  - Fallback: nome da clínica em texto se não tiver logo
  - **Aceite:** logo visível em todas as páginas, fallback funcional

---

### Épico 3.3 — Identidade da Clínica

- [ ] **3.3.1 — Exibir nome da clínica no sidebar**
  - Buscar dados da clínica no login (incluir no token ou endpoint dedicado)
  - Exibir nome da clínica no topo do sidebar
  - **Aceite:** nome visível em todas as páginas logadas

- [ ] **3.3.2 — Página de configurações da clínica**
  - Rota: `/configuracoes`
  - Form: nome, CNPJ, telefone, email, endereço da clínica
  - Upload de logo (componente da tarefa 3.2.5)
  - Permissão: ADMIN only
  - **Aceite:** edição de dados da clínica funcional

---

### Épico 3.4 — Notificações In-App

- [ ] **3.4.1 — Backend: criar model Notificacao no Prisma**
  - Campos: id, clinicaId, usuarioId (destinatário), tipo (enum), titulo, mensagem, lida (boolean), criadoEm
  - Tipos: LEMBRETE_CONSULTA, PACIENTE_CHEGOU, SISTEMA
  - **Aceite:** model criado, migration aplicada

- [ ] **3.4.2 — Backend: endpoints de notificação**
  - GET `/notificacoes` (listar do usuário logado, paginado)
  - PATCH `/notificacoes/:id/lida` (marcar como lida)
  - PATCH `/notificacoes/ler-todas` (marcar todas como lidas)
  - GET `/notificacoes/nao-lidas/count` (para badge)
  - **Aceite:** CRUD de notificações funcional

- [ ] **3.4.3 — Backend: emitir notificação via Socket.io**
  - Quando agendamento é criado → notificar nutricionista
  - Quando status muda para PRESENTE → notificar nutricionista ("paciente chegou")
  - Evento: `notificacao:nova`
  - **Aceite:** notificações emitidas em tempo real

- [ ] **3.4.4 — Frontend: ícone de sino com badge no header**
  - Ícone de sino no header/navbar
  - Badge com count de não lidas
  - Atualiza em tempo real via Socket.io
  - **Aceite:** ícone com badge funcional, atualiza em real-time

- [ ] **3.4.5 — Frontend: dropdown/painel de notificações**
  - Clicar no sino abre dropdown com lista de notificações
  - Itens: ícone por tipo, título, mensagem, tempo relativo ("há 5 min")
  - Não lidas com destaque visual
  - Botão "Marcar todas como lidas"
  - Link para ação (ex: clicar no lembrete abre a agenda)
  - **Aceite:** painel funcional, marcação de lida, navegação

---

### Épico 3.5 — Responsividade Mobile

- [ ] **3.5.1 — Sidebar colapsável**
  - Em telas < 768px: sidebar vira hamburguer menu
  - Overlay ao abrir, fecha ao clicar fora
  - **Aceite:** sidebar funcional em mobile

- [ ] **3.5.2 — Tabelas responsivas**
  - Tabelas de pacientes, agenda, relatórios: scroll horizontal ou layout de cards em mobile
  - **Aceite:** tabelas legíveis em telas pequenas

- [ ] **3.5.3 — Forms responsivos**
  - Grids de forms adaptam para 1 coluna em mobile
  - Botões full-width em mobile
  - **Aceite:** todos os formulários usáveis em celular

- [ ] **3.5.4 — Dashboard responsivo**
  - KPI cards empilham em mobile
  - Tabela de agenda do dia vira cards
  - **Aceite:** dashboard legível e funcional em celular

---

### Épico 3.6 — Tema Claro/Escuro

- [ ] **3.6.1 — Definir variáveis CSS para tema**
  - Criar arquivo de variáveis SCSS com tokens de cor para light e dark
  - Cores: background, surface, text, primary, secondary, border, etc.
  - **Aceite:** variáveis definidas para ambos os temas

- [ ] **3.6.2 — Implementar toggle de tema**
  - Botão no header ou configurações
  - Salvar preferência no localStorage
  - Respeitar preferência do SO (prefers-color-scheme) como default
  - **Aceite:** toggle funcional, persistente, respeita preferência do SO

- [ ] **3.6.3 — Aplicar variáveis em todos os componentes**
  - Substituir cores hardcoded por variáveis de tema
  - Testar todos os módulos em ambos os temas
  - **Aceite:** todos os componentes funcionam visualmente em ambos os temas

---

## Fase 4 — Funcionalidades Clínicas Avançadas

---

### Épico 4.1 — Plano Alimentar

- [ ] **4.1.1 — Criar models no Prisma**
  - PlanoAlimentar: id, pacienteId, clinicaId, usuarioId, titulo, observacoes, criadoEm, atualizadoEm
  - PlanoRefeicao: id, planoId, nome (ex: "Café da manhã"), horario, ordem
  - PlanoAlimento: id, refeicaoId, alimento, quantidade, unidade (g, ml, colher, etc), calorias, proteinas, carboidratos, gorduras, observacao
  - **Aceite:** models criados, migration aplicada

- [ ] **4.1.2 — Backend: CRUD de plano alimentar**
  - POST `/planos-alimentares/paciente/:pacienteId` — criar plano com refeições e alimentos
  - GET `/planos-alimentares/paciente/:pacienteId` — listar planos do paciente
  - GET `/planos-alimentares/:id` — buscar plano completo
  - PUT `/planos-alimentares/:id` — editar plano
  - DELETE `/planos-alimentares/:id` — excluir plano
  - **Aceite:** CRUD completo funcional

- [ ] **4.1.3 — Backend: geração de PDF do plano alimentar**
  - Endpoint: GET `/planos-alimentares/:id/pdf`
  - Usar biblioteca como `pdfkit` ou `puppeteer` para gerar PDF
  - Layout: header com logo da clínica, dados do paciente, tabela de refeições com alimentos e macros, totais diários, observações, assinatura do profissional
  - **Aceite:** PDF gerado com layout profissional, download funcional

- [ ] **4.1.4 — Frontend: página de montagem de plano alimentar**
  - Interface drag & drop para organizar refeições
  - Adicionar/remover refeições (Café, Lanche, Almoço, etc.)
  - Dentro de cada refeição: buscar e adicionar alimentos
  - Campos: alimento, quantidade, unidade, macros (auto-calculados se usar tabela TACO)
  - Totais por refeição e total diário de calorias/macros
  - **Aceite:** montagem visual funcional, cálculos automáticos

- [ ] **4.1.5 — Frontend: visualização e download do plano**
  - Preview do plano completo
  - Botão "Gerar PDF" para download
  - Botão "Enviar para paciente" (futuro — Fase 5)
  - **Aceite:** preview e download funcional

---

### Épico 4.2 — Tabela TACO / Cálculo de Macros

- [ ] **4.2.1 — Importar tabela TACO para o banco**
  - Criar model Alimento: id, codigo, nome, grupo, calorias, proteinas, carboidratos, gorduras, fibra (por 100g)
  - Script de seed que importa dados da tabela TACO (disponível em CSV/JSON público)
  - ~600 alimentos
  - **Aceite:** tabela importada, busca funcional

- [ ] **4.2.2 — Backend: endpoint de busca de alimentos**
  - GET `/alimentos?busca=arroz`
  - Busca por nome (insensitive), paginada
  - Retornar com macros por 100g
  - **Aceite:** busca funcional, retorna macros

- [ ] **4.2.3 — Frontend: autocomplete de alimentos no plano**
  - Campo de busca com autocomplete que consulta endpoint de alimentos
  - Ao selecionar, preenche macros automaticamente baseado na quantidade
  - Permite alimentos customizados (não obriga usar tabela)
  - **Aceite:** autocomplete funcional, cálculo automático de macros

---

### Épico 4.3 — Receitas e Orientações

- [ ] **4.3.1 — Criar model Receita no Prisma**
  - Campos: id, clinicaId, titulo, descricao, ingredientes (text), modoPreparo (text), categoria, criadoEm
  - **Aceite:** model criado

- [ ] **4.3.2 — Backend: CRUD de receitas**
  - CRUD completo com filtro por categoria
  - **Aceite:** CRUD funcional

- [ ] **4.3.3 — Frontend: biblioteca de receitas**
  - Listagem com filtro por categoria
  - Criar/editar receita com editor de texto
  - Vincular receita ao plano alimentar do paciente
  - **Aceite:** CRUD visual funcional, vinculação com plano

---

### Épico 4.4 — Guia TISS

- [ ] **4.4.1 — Backend: gerar guia TISS em PDF**
  - Modelo de guia de consulta TISS (padrão ANS)
  - Preencher com dados: paciente, convênio, número carteira, profissional, procedimento, CID
  - Gerar PDF no formato padrão TISS
  - **Aceite:** PDF gerado no padrão TISS

- [ ] **4.4.2 — Frontend: formulário de geração de guia TISS**
  - Selecionar paciente, convênio, procedimento
  - Campos adicionais: CID, observações
  - Botão "Gerar Guia" → download do PDF
  - **Aceite:** formulário funcional, PDF gerado corretamente

---

### Épico 4.5 — Fotos de Evolução

- [ ] **4.5.1 — Criar model FotoEvolucao no Prisma**
  - Campos: id, pacienteId, clinicaId, url, tipo (FRENTE, COSTAS, LATERAL_E, LATERAL_D), data, observacao
  - **Aceite:** model criado

- [ ] **4.5.2 — Backend: upload de fotos**
  - POST `/pacientes/:id/fotos` (multipart)
  - Upload para R2, salvar URL no banco
  - Validar: tipo de arquivo (jpg, png), tamanho (max 5MB)
  - **Aceite:** upload funcional

- [ ] **4.5.3 — Frontend: galeria de fotos before/after**
  - Grid de fotos organizadas por data
  - Comparação lado a lado (selecionar 2 datas)
  - Slider before/after
  - **Aceite:** galeria funcional, comparação visual

---

## Fase 5 — Comunicação & Engajamento

---

### Épico 5.1 — WhatsApp

- [ ] **5.1.1 — Integrar API de WhatsApp**
  - Escolher provider: Evolution API (self-hosted), Z-API, ou WhatsApp Business API
  - Configurar credenciais
  - Criar provider `shared/providers/whatsapp.ts`
  - **Aceite:** integração configurada, envio de mensagem teste funcional

- [ ] **5.1.2 — Backend: envio de lembrete de consulta**
  - Job agendado (cron): 24h antes da consulta, enviar lembrete
  - Template: "Olá {nome}, lembramos da sua consulta amanhã às {hora} na {clínica}. Confirma presença?"
  - Registrar envio no banco (log)
  - **Aceite:** lembrete enviado automaticamente, log registrado

- [ ] **5.1.3 — Backend: envio de plano alimentar**
  - Endpoint: POST `/planos-alimentares/:id/enviar-whatsapp`
  - Enviar PDF do plano como documento no WhatsApp
  - **Aceite:** PDF enviado com sucesso via WhatsApp

- [ ] **5.1.4 — Frontend: botão de envio manual**
  - Na agenda: botão para enviar lembrete individual
  - No plano alimentar: botão para enviar via WhatsApp
  - Feedback visual de sucesso/erro
  - **Aceite:** botões funcionais com feedback

---

### Épico 5.2 — E-mail Transacional

- [ ] **5.2.1 — Configurar serviço de e-mail**
  - Provider: Resend, SendGrid ou AWS SES
  - Criar provider `shared/providers/email.ts`
  - Templates HTML para: confirmação de cadastro, recuperação de senha, lembrete de consulta
  - **Aceite:** envio funcional, templates renderizados

- [ ] **5.2.2 — Backend: recuperação de senha**
  - POST `/auth/esqueci-senha` — envia e-mail com token
  - POST `/auth/resetar-senha` — valida token e altera senha
  - Token expira em 1h, uso único
  - **Aceite:** fluxo completo de recuperação funcional

- [ ] **5.2.3 — Frontend: telas de recuperação de senha**
  - Tela "Esqueci minha senha" (input de e-mail)
  - Tela "Redefinir senha" (nova senha + confirmação)
  - Mensagens de sucesso/erro
  - **Aceite:** fluxo visual completo

---

### Épico 5.3 — Portal do Paciente

- [ ] **5.3.1 — Backend: auth separada para pacientes**
  - Login por e-mail + código enviado por WhatsApp/e-mail (passwordless)
  - JWT com perfil PACIENTE, scoped ao próprio pacienteId
  - **Aceite:** paciente consegue logar e acessar apenas seus dados

- [ ] **5.3.2 — Backend: endpoints read-only para paciente**
  - GET `/portal/planos-alimentares` — seus planos
  - GET `/portal/exames` — seus exames e resultados
  - GET `/portal/agendamentos` — seus agendamentos futuros
  - **Aceite:** endpoints retornam apenas dados do paciente logado

- [ ] **5.3.3 — Frontend: interface do portal do paciente**
  - Layout simplificado, mobile-first
  - Telas: Meu Plano Alimentar, Meus Exames, Meus Agendamentos
  - Download de PDFs
  - **Aceite:** portal funcional, read-only, mobile-friendly

---

### Épico 5.4 — App Mobile do Paciente

- [ ] **5.4.1 — Definir abordagem: PWA vs React Native**
  - PWA: menor custo, usa o próprio portal web com service worker
  - React Native: experiência nativa, push notifications
  - Recomendação: começar com PWA
  - **Aceite:** decisão tomada e documentada

- [ ] **5.4.2 — Implementar PWA**
  - Adicionar manifest.json, service worker, ícones
  - Configurar cache offline para plano alimentar
  - Prompt de instalação "Adicionar à tela inicial"
  - **Aceite:** app instalável, plano alimentar disponível offline

---

## Fase 6 — Monetização & Escala

---

### Épico 6.1 — Planos de Assinatura

- [ ] **6.1.1 — Definir planos**
  - Free: 1 nutricionista, 20 pacientes, sem relatórios avançados
  - Pro: 3 usuários, pacientes ilimitados, relatórios, WhatsApp
  - Premium: usuários ilimitados, portal do paciente, API, suporte prioritário
  - Criar model Plano e Assinatura no Prisma
  - **Aceite:** models criados, planos definidos

- [ ] **6.1.2 — Backend: middleware de limites por plano**
  - Verificar limites antes de criar recursos (pacientes, usuários)
  - Retornar erro 403 com mensagem "Limite do plano atingido, faça upgrade"
  - **Aceite:** limites respeitados, mensagens claras

- [ ] **6.1.3 — Frontend: página de planos e upgrade**
  - Exibir planos com features e preços
  - Botão de upgrade que redireciona para checkout
  - Indicador do plano atual nas configurações
  - **Aceite:** página de planos funcional

---

### Épico 6.2 — Pagamentos

- [ ] **6.2.1 — Integrar gateway de pagamento**
  - Provider: Stripe (internacional) ou Asaas (brasileiro, boleto + pix)
  - Configurar webhooks para eventos de pagamento
  - **Aceite:** integração configurada, webhook recebendo eventos

- [ ] **6.2.2 — Backend: gerenciamento de assinaturas**
  - Criar assinatura ao fazer upgrade
  - Webhook: atualizar status ao receber pagamento/cancelamento
  - Período de trial (14 dias)
  - **Aceite:** ciclo completo de assinatura funcional

- [ ] **6.2.3 — Frontend: checkout e gestão de assinatura**
  - Tela de checkout (cartão, pix, boleto)
  - Tela de gerenciamento: ver plano atual, próximo pagamento, cancelar
  - Histórico de faturas
  - **Aceite:** checkout e gestão funcional

---

### Épico 6.3 — Landing Page

- [ ] **6.3.1 — Criar landing page de vendas**
  - Hero section com proposta de valor
  - Features com screenshots
  - Planos e preços
  - Depoimentos
  - FAQ
  - CTA para cadastro (onboarding)
  - SEO otimizado
  - **Aceite:** landing page publicada, responsiva, com CTA funcional

---

### Épico 6.4 — Infraestrutura & DevOps

- [ ] **6.4.1 — Configurar Redis em produção (Railway)**
  - Criar instância Redis no Railway
  - Atualizar REDIS_URL no ambiente de produção
  - **Aceite:** Redis funcional em prod, blacklist e refresh tokens usando Redis

- [ ] **6.4.2 — Testes automatizados**
  - Configurar Vitest (frontend) e Jest (backend)
  - Testes unitários para use-cases críticos (auth, agendamento, plano alimentar)
  - Testes de integração para endpoints da API
  - Testes de componentes React (React Testing Library)
  - Cobertura mínima: 60% dos use-cases
  - **Aceite:** suíte de testes rodando, CI passa

- [ ] **6.4.3 — CI/CD com GitHub Actions**
  - Pipeline: lint → build → test → deploy
  - Deploy automático para Railway (API) e Vercel/Cloudflare Pages (Web)
  - Rodar em PRs e merges para main
  - **Aceite:** pipeline funcional, deploy automático

- [ ] **6.4.4 — Rate limiting e segurança**
  - Rate limiting por IP e por usuário (express-rate-limit)
  - Helmet para headers de segurança
  - CORS configurado para domínios específicos
  - Sanitização de inputs (XSS protection)
  - **Aceite:** rate limiting ativo, headers seguros, CORS restrito

---

## Fase 7 — Expansão

---

### Épico 7.1 — App Desktop (Tauri)

- [ ] **7.1.1 — Scaffoldar projeto Tauri**
  - Criar `apps/desktop` no monorepo
  - Configurar Tauri para usar o build do `apps/web`
  - **Aceite:** app desktop abre e carrega o frontend

- [ ] **7.1.2 — Build e distribuição**
  - Gerar .dmg (macOS) e .exe (Windows)
  - Auto-updater para novas versões
  - **Aceite:** instaladores gerados, auto-update funcional

---

### Épico 7.2 — Multi-idioma (i18n)

- [ ] **7.2.1 — Configurar i18n no frontend**
  - Instalar react-i18next
  - Extrair todas as strings para arquivos de tradução
  - Idiomas: pt-BR (default), en, es
  - **Aceite:** troca de idioma funcional

- [ ] **7.2.2 — Traduzir interface**
  - Traduzir todos os arquivos de locale para en e es
  - **Aceite:** 100% das strings traduzidas

---

### Épico 7.3 — Marketplace de Templates

- [ ] **7.3.1 — Backend: compartilhamento de modelos de questionário**
  - Endpoint para publicar modelo como template público
  - Endpoint para buscar templates do marketplace
  - Endpoint para importar template para a clínica
  - **Aceite:** publicação e importação funcional

- [ ] **7.3.2 — Frontend: tela de marketplace**
  - Listagem de templates com busca e filtros
  - Preview do template
  - Botão "Importar para minha clínica"
  - **Aceite:** marketplace funcional

---

### Épico 7.4 — API Pública

- [ ] **7.4.1 — Criar API key system**
  - Model ApiKey: id, clinicaId, nome, key (hash), scopes, criadoEm, ativo
  - Middleware de autenticação por API key
  - **Aceite:** API keys geráveis e funcionais

- [ ] **7.4.2 — Documentação OpenAPI/Swagger**
  - Gerar spec OpenAPI para endpoints públicos
  - UI Swagger em `/api/docs`
  - **Aceite:** documentação acessível e atualizada

- [ ] **7.4.3 — Endpoints públicos**
  - Pacientes, Agendamentos, Planos Alimentares (CRUD)
  - Rate limiting por API key
  - Versionamento: `/api/v1/`
  - **Aceite:** endpoints funcionais com rate limiting
