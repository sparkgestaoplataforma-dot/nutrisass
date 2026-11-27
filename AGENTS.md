# NutriSaaS — Diretrizes Oficiais de Arquitetura, Regras de Negócio e TDD

Este documento é a **fonte única da verdade (Single Source of Truth)** para desenvolvedores e agentes de IA (**Gemini / Antigravity** e **Claude Code**) que trabalham no monorepo **NutriSaaS**.

---

## 1. Visão do Produto e Princípios de UX
O **NutriSaaS** é uma plataforma SaaS para nutricionistas e clínicas de nutrição, projetada para substituir sistemas legados complexos (como o WebDiet) com **máxima agilidade clínica e baixíssima carga cognitiva**:
- **Simplicidade para todas as idades**: Interfaces limpas, tipografia legível, botões com rótulos claros e automação de cálculos (um atendimento completo deve exigir poucos cliques).
- **Precisão Científica**: Fórmulas nutricionais e antropométricas seguem referências consagradas (Mifflin-St Jeor, Harris-Benedict, FAO/OMS, Cunningham, Tinsley, Pollock 3 e 7 dobras, Equação de Siri, IMC OMS Adulto vs. Lipschitz Idoso $\ge 60$ anos, RCQ, RCE e Tabela TACO).

---

## 2. Arquitetura do Monorepo (Clean Architecture Pragmática)

O projeto utiliza **Turborepo** com 3 pacotes principais:

```text
nutrisass/
├── packages/shared/       # (@nutricao/shared) Contratos Zod, tipos DTO, Enums e Constantes
├── apps/api/              # (@nutricao/api) Backend Node.js + Express + Prisma + Socket.IO + Redis
└── apps/web/              # (@nutricao/web) Frontend React 19 + TypeScript + Vite + TanStack Query + SCSS Modules
```

### 2.1. Regras de Camadas no Backend (`apps/api`)
Cada módulo em `apps/api/src/modules/<modulo>/` deve respeitar estritamente a separação de responsabilidades:
1. **`routes.ts` (Roteamento e Middlewares)**:
   - Define os endpoints Express, aplica autenticação (`authMiddleware`), guarda clínica (`clinicalGuard` quando aplicável) e validação de schema Zod (`validate(...)`).
2. **`controller.ts` (Camada HTTP / Adaptação)**:
   - **PROIBIDO importar `prisma` dentro de `*.controller.ts`**.
   - O Controller apenas extrai dados do `Request` (`getClinicaId(req)`, `getUsuarioId(req)`, `req.params`, `req.query`, `req.body`), chama o `Service` (ou `UseCase`) correspondente e formata o `Response` (`res.status(...).json({ success: true, data })`).
3. **`service.ts` / `usecase.ts` (Camada de Aplicação e Negócio)**:
   - Contém toda a lógica de negócio, validações de domínio, cálculos e chamadas ao `prisma` / `redis`.
   - Recebe tipos puros (ex.: `clinicaId: string`, `dto: CreateMedidaInput`) — **nunca** objetos `req` ou `res` do Express.
4. **Padrão de Imports no Backend**:
   - Utilize sempre o path alias `@/` (ex.: `import { prisma } from '@/shared/providers/prisma'` e `import { AppError } from '@/shared/middlewares/errorHandler'`). Não utilize caminhos relativos profundos (`../../../`).

### 2.2. Regras de Camadas no Frontend (`apps/web`)
1. **`src/services/<modulo>.ts` (Camada de Acesso a Dados)**:
   - **PROIBIDO chamar `api.get`, `api.post`, `api.put` ou `api.delete` diretamente dentro de componentes React (`.tsx`)**.
   - Toda comunicação HTTP deve residir em `apps/web/src/services/<modulo>.ts` com funções tipadas retornando tipos de `@nutricao/shared` ou interfaces explícitas.
2. **`src/utils/nutricaoCalculos.ts` (Motor Clínico Puro)**:
   - Funções puras de cálculo nutricional e antropométrico, 100% cobertas por testes unitários (`nutricaoCalculos.spec.ts`), sem dependência de React ou DOM.
3. **Componentes e Páginas (`src/pages/` e `src/components/`)**:
   - Utilizam **TanStack Query (`useQuery` / `useMutation`)** consumindo `src/services/*`.
   - Estilização via **SCSS Modules (`*.module.scss`)** usando as variáveis e mixins globais (`src/styles/variables.scss` e `src/styles/mixins.scss`).

---

## 3. Regras de Negócio e Segurança Inegociáveis

1. **Isolamento Multi-Tenant Obrigatório (`clinicaId` e FKs do Payload)**:
   - Todo recurso pertence a uma clínica (`clinicaId`).
   - Toda leitura, atualização ou exclusão no Prisma **DEVE** validar o `clinicaId` do token JWT (seja diretamente no `where: { id, clinicaId }` ou via relação `where: { id, paciente: { clinicaId } }`), além de comprovar que toda FK secundária enviada em `req.body` (`nutricionistaId`, `convenioId`, `alimentoId`, `medidaCaseiraId`, `perguntaId`, `exameBaseId`) pertence à mesma clínica (ou TACO global).
   - Caso o recurso não exista ou pertença a outra clínica, lance `new AppError('... não encontrado', 404)`.
2. **Proteção de Dados Clínicos (`clinicalGuard`), RBAC e Contas Ativas**:
   - Dados clínicos (Prontuário, Evolução Clínica, Medidas Antropométricas, Planos Alimentares, Exames e Avaliações/Questionários respondidos) são exclusivos de profissionais de saúde.
   - Em clínicas (`TipoClinica.CLINICA`), usuários com perfil `SECRETARIA` **NÃO TÊM ACESSO** a rotas clínicas (`403 Forbidden`), não podem receber dados clínicos aninhados em rotas cadastrais (`/pacientes`, `/agendamentos`, `/relatorios`, `/dashboard`) e **não podem gerenciar** `usuarios`, `clinica`, `assinaturas`, `convenios` (escrita) ou `alimentos`/`exames`/`questionarios` (escrita).
   - Toda rota `POST`/`PUT`/`PATCH` com payload exige `validate(schema)` do Zod. Clínicas ou usuários inativos (`ativa = false` / `ativo = false`) são bloqueados na autenticação/renovação.
   - Em consultórios individuais (`TipoClinica.AUTONOMO`), o acesso é permitido conforme regra do `clinicalGuard`.
3. **Motor de Planos (*Entitlements*) e Isolamento do `/backoffice`**:
   - Proibido checar nomes de planos (`if (plano === 'PRO')`); utilize `featureGuard` nas rotas, `assertQuota` em `$transaction` nos services e `useEntitlements()` no frontend (ver `.agents/rules/05-saas-planos-e-backoffice.md`).
   - O Super Admin (`/api/backoffice/*`) usa tabela `SuperAdmin` e JWT dedicados, com `BackofficeAuditLog` e zero exposição de prontuários nominais (LGPD/CFN).
4. **Datas sem Deslocamento de Fuso Horário**:
   - Datas puras (como `dataNascimento`, `data` da medida ou `dataResultado` de exame) devem ser formatadas com `{ timeZone: 'UTC' }` ou ISO `YYYY-MM-DD` para evitar recuo de 1 dia no fuso `America/Sao_Paulo` (`-03:00`).

---

## 4. Metodologia TDD e Qualidade Obrigatória

Todo desenvolvimento de feature ou correção de bug segue o ciclo **Red → Green → Refactor**:
1. Escreva ou atualize o teste unitário primeiro (`*.spec.ts`).
2. Implemente o código mínimo necessário para o teste passar.
3. Se criar um novo endpoint clínico na API, adicione-o obrigatoriamente na matriz `clinicalEndpoints` em `apps/api/src/test/clinical-authorization.spec.ts`.
4. Antes de finalizar qualquer tarefa, execute e garanta `0` erros em:
   - `npm run lint` (TypeScript `tsc --noEmit` em todos os pacotes)
   - `npm test` (Vitest em `@nutricao/api` e `@nutricao/web`)
   - `npm run build` (Build completo via Turborepo)

---

## 5. Convenções de Git, Branches (GitFlow) e Commits
- **Branches (GitFlow)**:
  - `main`: Branch de produção protegida (só aceita PRs vindos de `develop` ou `hotfix/*`, validado pelo CI).
  - `develop`: Branch de integração contínua. Toda nova branch de desenvolvimento deve sair da `develop` e fazer merge na `develop`.
  - `feat/<modulo>-<descricao>`: Novas funcionalidades (PR para `develop`).
  - `fix/<modulo>-<descricao>`: Correções de bugs (PR para `develop`).
  - `refactor/<modulo>-<descricao>`: Refatorações arquiteturais sem mudança de comportamento externo (PR para `develop`).
  - `hotfix/<descricao>`: Correções emergenciais em produção (única que pode abrir PR direto para `main` além da `develop`).
- **Conventional Commits**:
  - Formato: `<tipo>(<escopo>): <descrição curta no imperativo>`
  - Exemplos: `feat(plano-alimentar): adiciona calculadora de GET por g/kg`, `refactor(prontuario): extrai prontuario.service do controller`.

---

## 6. Regras e Skills Disponíveis no Repositório
- Regras detalhadas: `.agents/rules/` (`01` a `05`) e plano mestre em `plan/ordem-de-guerra-nutrisaas.md`
- Skills passo a passo (para Gemini/Antigravity e Claude Code):
  - `.agents/skills/especificar-task/SKILL.md` (Quebra ideias/épicos em tasks mastigadas para IA)
  - `.agents/skills/docknotes-board/SKILL.md` (Criação e leitura remota de cards no DockNotes via Chrome)
  - `.agents/skills/executar-task/SKILL.md` (Fluxo ponta a ponta para implementar uma issue `SAASN-XX`)
  - `.agents/skills/criar-modulo-api/SKILL.md`
  - `.agents/skills/criar-calculo-nutricional/SKILL.md`
  - `.agents/skills/padronizar-modulo/SKILL.md`
  - `.agents/skills/pre-pr-check/SKILL.md`
  - `.agents/skills/gerar-descricao-pr/SKILL.md`

