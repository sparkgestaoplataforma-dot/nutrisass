# NutriSaaS - Contexto da Aplicação

## Visão Geral
O **NutriSaaS** é um sistema de gestão completo, no modelo SaaS (Software as a Service), desenvolvido especificamente para **clínicas de nutrição**. A aplicação adota uma arquitetura **Multi-tenant**, garantindo que cada clínica (tenant) tenha isolamento completo e seguro de seus dados.

O objetivo do sistema é facilitar o dia a dia de nutricionistas, secretárias e administradores de clínicas, oferecendo ferramentas para gestão de pacientes, controle de agendas, acompanhamento clínico por meio de prontuários, além da gestão administrativa da clínica.

## Perfis de Acesso e Permissões
O sistema é estruturado para atender diferentes papéis dentro da clínica de nutrição, cada um com níveis de acesso específicos:

- 👑 **Administrador (Admin):** Possui acesso total ao sistema. Pode gerenciar usuários da clínica, convênios, configurações gerais, agenda de todos os profissionais e dados de pacientes.
- 🍏 **Nutricionista:** Foco no atendimento clínico. Tem acesso à sua própria agenda, gestão completa de pacientes sob seus cuidados, prontuários, prescrição e avaliação de exames, além de relatórios pertinentes ao seu trabalho.
- 👩‍💼 **Secretária:** Foco no fluxo de atendimento. Pode gerenciar a agenda dos profissionais, listar pacientes para marcação de consultas e emitir relatórios administrativos.

## Principais Features (Funcionalidades)

### 1. Gestão de Clínica e Autenticação
- **Autenticação Segura:** Login, logout e controle de sessão via JWT com refresh token e blacklist usando Redis.
- **Onboarding de Clínica:** Cadastro e configuração inicial da clínica na plataforma.
- **Gestão de Usuários:** CRUD de colaboradores (nutricionistas e secretárias) gerenciado pelo administrador.

### 2. Dashboard
- **Painel de Controle (KPIs):** Visão geral e métricas importantes da clínica.
- **Visão do Dia:** Resumo da agenda do dia para acesso rápido pelos profissionais.

### 3. Agenda e Atendimentos
- **Agendamentos:** Marcação, edição e cancelamento de consultas.
- **Atualização em Tempo Real (Real-time):** Sincronização de alterações na agenda usando Socket.io, permitindo que a secretária e o nutricionista vejam atualizações instantaneamente.

### 4. Gestão de Pacientes
- **Cadastro e Listagem:** Sistema de busca paginada e filtros para fácil localização de pacientes.
- **Gestão de Convênios:** Cadastro de planos de saúde/convênios (apenas admin) que são vinculados aos atendimentos dos pacientes.

### 5. Prontuário Clínico (Core Nutricional)
- **Evolução Clínica:** Registro detalhado de cada consulta, sintomas e conduta tomada.
- **Medidas e Avaliações:** Registro de antropometria e outras medidas corporais.
- **Comparativo de Resultados:** Funcionalidade visual para comparar a evolução das medidas do paciente ao longo das consultas, permitindo filtros por período e data.

### 6. Gestão de Exames
- **Solicitação:** Emissão de pedidos de exames laboratoriais.
- **Resultados:** Registro e acompanhamento dos resultados dos exames solicitados.

### 7. Questionários (Hipersensibilidade)
- **Questionário de Hipersensibilidade:** Envio e resposta de questionários para identificar intolerâncias, hipersensibilidades alimentares e rastreamento metabólico dos pacientes.
- **Gestão e Versionamento:** Criação, edição, clonagem automática de versões (quando existem avaliações vinculadas) e validação de regras de interpretação de resultados.

### 8. Relatórios
- Geração de relatórios com filtros avançados.
- Funcionalidade de impressão de dados relevantes para a gestão e acompanhamento da clínica.

## Stack Tecnológica

O sistema foi construído em um ecossistema moderno utilizando um **Monorepo (Turborepo)**, que compartilha tipagens e validações (Zod) entre o Frontend e o Backend.

- **Frontend:** React 19, Vite 6, SCSS Modules para estilização, React Router 7 para rotas, Zustand (gerenciamento de estado local/auth) e TanStack Query (estado de servidor).
- **Backend:** Node.js com Express 4, seguindo os princípios de Clean Architecture e DDD (Domain-Driven Design).
- **Banco de Dados & ORM:** PostgreSQL hospedado na Railway, gerenciado através do Prisma ORM 6.
- **Mensageria / Cache:** Redis e Socket.io para cache de sessões e atualizações em tempo real.
