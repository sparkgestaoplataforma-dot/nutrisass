# Regra 02 — Regras de Negócio, Multi-Tenancy, RBAC e Segurança Clínica

## 1. Isolamento Multi-Tenant (`clinicaId`) — Recurso Principal e FKs
- Toda consulta ou mutação no banco de dados deve ser restrita ao `clinicaId` do usuário autenticado (`getClinicaId(req)`).
- **Recurso Principal e Entidades Filhas**:
  - Na criação/listagem por `pacienteId`: verificar se `prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId } })` existe (lançando `AppError(..., 404)` caso contrário).
  - Na edição/exclusão por `id`: buscar antes com `findFirst({ where: { id, clinicaId } })` ou `findFirst({ where: { id, paciente: { clinicaId } } })`. **Nunca** executar `update` ou `delete` pelo `id` sem antes confirmar pertença à `clinicaId` do token.
- **Validação Obrigatória de Chaves Estrangeiras (FKs) do Payload (Anti-IDOR Cross-Tenant)**:
  - Jamais confie em IDs secundários enviados em `req.body` ou `req.query`. Antes de gravar, valide no Service:
    - `nutricionistaId`: deve existir em `Usuario` com `{ id: nutricionistaId, clinicaId, ativo: true, perfil: { in: ['NUTRICIONISTA', 'ADMIN'] } }`.
    - `convenioId`: deve existir em `Convenio` com `{ id: convenioId, clinicaId }`.
    - `alimentoId` e `medidaCaseiraId`: o `Alimento` deve ter `clinicaId: null` (TACO global) **ou** `clinicaId` igual ao da clínica; a `MedidaCaseira` deve pertencer ao respectivo `alimentoId`.
    - `perguntaId` (inclusive em rotas públicas de resposta): deve pertencer a um `Modulo` cujo `questionarioId` seja exatamente o do questionário sendo respondido.
    - `exameBaseId`: deve pertencer à `clinicaId` (ou item base válido da clínica).

## 2. Controle de Acesso por Perfil (RBAC) e `clinicalGuard`
- Existem dois modos de operação de clínica (`TipoClinica`):
  - `CLINICA`: Múltiplos usuários (`ADMIN`, `NUTRICIONISTA`, `SECRETARIA`).
  - `AUTONOMO`: Consultório individual (`roleGuard` e `clinicalGuard` liberam acesso à própria clínica).
- **Matriz Obrigatória em `TipoClinica.CLINICA`**:
  1. **Rotas Clínicas (`clinicalGuard` — `ADMIN` e `NUTRICIONISTA` apenas; `SECRETARIA` recebe `403`)**:
     - `/api/prontuario/*` (evoluções e medidas)
     - `/api/planos-alimentares/*`
     - `/api/avaliacoes/*` e `/api/pacientes/:id/avaliacoes`
     - `/api/exames/paciente/*`, `/api/exames/resultado` e `DELETE /api/exames/:id`
     - Em `GET /api/pacientes/:id`, `GET /api/agendamentos`, `GET /api/relatorios` e `GET /api/dashboard`, **jamais** inclua relações clínicas (`evolucoes`, `medidas`, `planosAlimentares`, `avaliacoesQuestionarios`) para `SECRETARIA`.
  2. **Gestão Administrativa e Financeira (`roleGuard('ADMIN')` obrigatório)**:
     - CRUD de `usuarios` (exceto leitura/atualização do próprio perfil em `/api/usuarios/me`). `SECRETARIA` **nunca** pode criar, editar, excluir usuários ou alterar `perfil`.
     - Edição de dados organizacionais e transição de modo em `/api/clinica/*`.
     - Gestão de planos, add-ons e faturas em `/api/assinaturas/*`.
     - Criação, edição e exclusão de `/api/convenios/*` (`SECRETARIA` possui apenas leitura `GET` para agendar/emitir guia).
  3. **Catálogos Clínicos da Clínica (`roleGuard('ADMIN', 'NUTRICIONISTA')` para escrita)**:
     - Criação, edição e exclusão de `alimentos` customizados, `exames` base e estrutura de `questionarios`/`modulos` são restritos a `ADMIN` e `NUTRICIONISTA` (`SECRETARIA` não pode criar, editar ou excluir).

## 3. Autenticação, Status de Conta, Validação Zod e Transações
1. **Bloqueio de Contas Inativas**:
   - `/api/auth/login` e `/api/auth/refresh` devem verificar no banco se `clinica.ativa === true` e `usuario.ativo === true`. Caso qualquer um esteja inativo, recusar autenticação (`403` / `401`) e invalidar refresh token.
   - Sempre que novos tokens (`accessToken` + `refreshToken`) forem emitidos (login, refresh, onboarding, mudança de modo da clínica), o novo `refreshToken` **deve** ser persistido no Redis (`refresh:${userId}`).
2. **Proibição de Mass Assignment (Zod Obrigatório)**:
   - Toda rota `POST`, `PUT` ou `PATCH` que receba corpo (`req.body`) **deve** possuir middleware `validate(schema)` com schema definido em `@nutricao/shared`. É proibido passar `req.body` não validado para Services/Prisma.
3. **Integridade, Transações e Erros do Prisma**:
   - Validações seguidas de escrita sujeitas a condição de corrida (ex.: checagem de conflito de horário em `Agendamento` ou checagem de limite de cota `assertQuota`) devem executar dentro de `prisma.$transaction`.
   - CPF de paciente deve ser normalizado (apenas dígitos) e único por clínica (`@@unique([clinicaId, cpf])` quando informado).
   - O `errorHandler` global deve capturar `PrismaClientKnownRequestError` (`P2002` → `409 Conflito`, `P2003` → `400/409 Vínculo inválido`, `P2025` → `404 Não encontrado`) sem expor stack/SQL ao cliente.

## 4. Regras de Negócio Nutricionais e Datas
1. **Medidas Caseiras no Plano Alimentar**:
   - Valores nutricionais na tabela `Alimento` (TACO) referem-se sempre a **100g** (`_basePer100`).
   - Com medida caseira ativa (`medidaCaseiraId`), a quantidade em gramas real é `quantidade * medidaCaseira.quantidadeEmGramas`.
   - Medidas redundantes (`"g"`, `"grama"`, `"gramas"`) devem ser filtradas na UI.
2. **Classificação de IMC por Faixa Etária**:
   - Adultos (`< 60` anos): **OMS** (Eutrofia: `18.5` a `24.9 kg/m²`).
   - Idosos (`>= 60` anos): **Lipschitz / OPAS** (Baixo peso `< 22`, Eutrofia `22` a `27`, Excesso de peso `> 27 kg/m²`).
3. **Resumo do Plano Alimentar**:
   - Builder e View do nutricionista somam a **Opção Principal (`opcoes[0]`)** de cada refeição; no PDF do paciente, respeita-se a escolha de exibição do profissional.
4. **Datas sem Deslocamento de Fuso Horário**:
   - Datas puras (`dataNascimento`, `data` da medida, `dataResultado` de exame) devem ser formatadas com `{ timeZone: 'UTC' }` ou ISO `YYYY-MM-DD`.
