---
name: especificar-task
description: >-
  Use this skill when breaking down a feature, epic, security fix, or refactor into
  atomic, self-contained AI-ready task specifications ("tasks mastigadas") for
  NutriSaaS and the DockNotes board.
---

# Skill: Especificar Task "Mastigada" para IA (`especificar-task`)

Use esta skill sempre que o usuário pedir para planejar uma feature, quebrar um épico em tarefas menores ou preparar cards cirúrgicos para execução por agentes de IA (**Antigravity** ou **Claude Code**) no **DockNotes**.

## Regras de Ouro do Fatiamento
1. **Atomicidade (1 Task = 1 PR enxuto)**:
   - Se uma entrega envolve migration grande + motor backend + múltiplas telas complexas, quebre em fatias verticais ou sequenciais claras (ex.: Task 1: Schema + Service/Testes; Task 2: Rotas/Guards + Service Web; Task 3: UI React + Testes).
2. **Zero Ambiguidade**:
   - Nunca escreva instruções vagas como *"validar segurança"* ou *"limitar pelo plano"*. Diga **quais** perfis acessam, **quais** FKs do `body` devem ser checadas contra `clinicaId`, **qual** chave de `featureGuard`/`assertQuota` usar e **quais** cenários de teste `it('deve...')` devem existir.
3. **Atribuição Padrão de Responsáveis do Time**:
   - Código (Backend, Frontend, Testes, Refatoração): **Jeffson Luiz Oliveira de Lima Santos** e/ou **Kevin Maravilha Henrique da Silva** (confirmar no prompt).
   - Infraestrutura, servidor, deploy, DNS, configuração externa de gateway/webhooks: **Talles Carrelo**.

---

## Template Obrigatório do Card (Markdown)

Ao gerar cada task, apresente os **Metadados do DockNotes** seguidos do **Corpo Markdown da Descrição**:

```markdown
### Metadados DockNotes
- **Título**: [<Escopo>] <Verbo no imperativo + entrega clara>
- **Categoria**: Tarefa | Bug | Débito Técnico | Teste | Spike | Hotfix | História | Épico
- **Prioridade**: Crítica | Alta | Média | Baixa
- **Responsáveis**: <Definido no prompt>
- **Participantes**: <Opcional: Co-autor / Revisor / QA Tester>
- **Data Início / Data Entrega**: <Definidas no prompt>

---

### Descrição do Card (Copiar para o DockNotes)

## Contexto e Objetivo
<1 parágrafo direto explicando o problema/valor e o resultado esperado.>

## Escopo Fechado de Arquivos
- **Criar/Editar**:
  - `<caminho/exato/do/arquivo>`
- **Fora do escopo**:
  - `<o que a IA NÃO deve alterar nesta task>`

## Contratos de Dados (`schema.prisma` & `@nutricao/shared`)
- **Prisma**: <Nenhuma alteração OU campos/índices/constraints exatos>
- **Zod (`@nutricao/shared`)**: <Schemas de params/query/body e tipos inferidos>

## Matriz de Segurança, Multi-Tenancy e Plano
- **Guard e Perfis permitidos**: <Ex.: `authMiddleware` + `roleGuard('ADMIN')` | `clinicalGuard` | `superAdminMiddleware`>
- **Isolamento `clinicaId` e FKs do Payload**: <Ex.: validar `id` da rota + validar `convenioId` e `nutricionistaId` pertencentes à `clinicaId` retornando `404` se inválido>
- **Entitlements / Cotas**: <Nenhuma trava OU `featureGuard('...')` / `assertQuota(tx, clinicaId, '...', count)`>
- **LGPD / Status de Conta**: <Observações de não-vazamento clínico para `SECRETARIA` ou `/backoffice`>

## Plano de Testes Obrigatórios (TDD Red -> Green)
Arquivo(s): `<modulo>.service.spec.ts` / `<arquivo>.spec.ts`
- [ ] `deve <caso feliz principal filtrando por clinicaId>` (`200`/`201`)
- [ ] `deve rejeitar payload inválido via Zod` (`400`)
- [ ] `deve retornar 404 quando recurso ou FK pertencer a outra clínica` (`404`)
- [ ] `deve retornar 403 para perfil sem permissão (ex.: SECRETARIA em CLINICA)` (`403`)
- [ ] `<se aplicável> deve retornar 402 quando atingir limite da cota ou feature bloqueada` (`402`)

## Critérios de Aceite
- [ ] Segue Clean Architecture (zero `prisma` no controller; zero `api.*` direto em `.tsx`).
- [ ] Se rota clínica nova, adicionada em `apps/api/src/test/clinical-authorization.spec.ts`.
- [ ] `npm run lint`, `npm test` e `npm run build` passando com 0 erros.
```

## Passo Final — Revisão e Envio ao DockNotes
1. Mostre a(s) task(s) especificada(s) ao usuário no chat para validação rápida (incluindo responsáveis, prioridade e datas).
2. Assim que o usuário aprovar, utilize a skill `.agents/skills/docknotes-board/SKILL.md` para cadastrar cada card diretamente no **DockNotes**.
