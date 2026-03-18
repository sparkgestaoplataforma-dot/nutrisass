# NutriSaaS — Roadmap

## Fase 1 — Fundação (CONCLUÍDA)

- [x] Auth (JWT + Redis blacklist)
- [x] Agenda (CRUD + real-time Socket.io + stats cards)
- [x] Pacientes (CRUD + busca paginada + form completo)
- [x] Prontuário (Perfil + tabs: Evolução Clínica, Medidas, Exames)
- [x] Exames (Solicitação + registro de resultados + CRUD exames base)
- [x] Convênios (CRUD admin only)
- [x] Usuários (CRUD admin only + proteção último admin)
- [x] Relatórios (filtros por data/status + stats + tabela + impressão)
- [x] Dashboard com KPIs reais
- [x] Multi-tenancy (isolamento por clínica via clinicaId)
- [x] Onboarding de clínicas (/cadastro)

## Fase 2 — Tela de Atendimento Completa (PRIORIDADE)

A tela principal da nutricionista durante a consulta. Core do sistema.

### Estado Clínico Estruturado
- [ ] Seções dedicadas no prontuário: Sintomas, Aparelho Digestivo, Antecedentes Mórbidos, Medicamentos, Outros
- [ ] Timeline de evolução por seção (histórico com datas)
- [ ] Campos de texto rico por seção
- [ ] Salvar/editar por seção individual

### Questionários Dinâmicos
- [ ] CRUD de modelos de questionário (admin/nutri cria perguntas, pesos, opções)
- [ ] Aplicação do questionário ao paciente (preenchimento durante consulta)
- [ ] Somatório automático + interpretação de resultado
- [ ] Histórico de questionários por paciente
- [ ] Comparativo entre questionários ao longo do tempo (Ver Comparativo)

### Melhorias no Prontuário
- [ ] Visão unificada: dados do paciente + questionários + estado clínico na mesma tela
- [ ] Sidebar com resultados de questionários (somatório + resultado)
- [ ] Navegação lateral (Medidas, Exames) como na referência

## Fase 3 — Polimento & UX

- [ ] Máscaras de input (CPF, telefone, CEP, CNPJ)
- [ ] Upload de logomarca da clínica (Cloudflare R2)
- [ ] Logo/nome da clínica visível no header/sidebar
- [ ] Notificações in-app (lembretes de consulta)
- [ ] Responsividade mobile
- [ ] Tema claro/escuro

## Fase 4 — Funcionalidades Clínicas Avançadas

- [ ] Plano alimentar (montagem + geração PDF)
- [ ] Cálculo de macros/micros (tabela TACO/IBGE)
- [ ] Receitas e orientações nutricionais
- [ ] Guia TISS (PDF para convênios)
- [ ] Fotos de evolução do paciente (before/after)

## Fase 5 — Comunicação & Engajamento

- [ ] Envio de WhatsApp (lembrete de consulta, plano alimentar)
- [ ] E-mail transacional (confirmação, recuperação de senha)
- [ ] Portal do paciente (acesso read-only ao plano/exames)
- [ ] App mobile paciente (PWA ou React Native)

## Fase 6 — Monetização & Escala

- [ ] Planos de assinatura (free/pro/premium)
- [ ] Integração Stripe ou Asaas para pagamentos
- [ ] Landing page de vendas
- [ ] Redis em produção (Railway)
- [ ] Testes automatizados (unit + integration)
- [ ] CI/CD (GitHub Actions)
- [ ] Rate limiting e segurança avançada

## Fase 7 — Expansão

- [ ] App desktop (Tauri)
- [ ] Multi-idioma (i18n)
- [ ] Marketplace de templates de questionários
- [ ] API pública para integrações