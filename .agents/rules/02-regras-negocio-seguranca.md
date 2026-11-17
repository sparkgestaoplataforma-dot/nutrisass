# Regra 02 — Regras de Negócio, Multi-Tenancy e Segurança Clínica

## 1. Isolamento Multi-Tenant (`clinicaId`)
- Toda consulta ou mutação no banco de dados deve ser restrita ao `clinicaId` do usuário autenticado (`getClinicaId(req)`).
- Para entidades filhas de `Paciente` (como `EvolucaoClinica`, `Medida`, `SolicitacaoExame`, `PlanoAlimentar`, `Avaliacao`), valide sempre:
  - Na criação/listagem por `pacienteId`: verificar se `prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId } })` existe (retornando `404` caso contrário).
  - Na edição/exclusão por `id` do recurso: buscar antes com `findFirst({ where: { id, paciente: { clinicaId } } })` (ou `where: { id, clinicaId }` quando a tabela tiver `clinicaId` direto). **Nunca** executar `update` ou `delete` pelo `id` sem antes confirmar que pertence à `clinicaId` do token.

## 2. Controle de Acesso Clínico (`clinicalGuard` e Perfis)
- Existem dois modos de operação de clínica (`TipoClinica`):
  - `CLINICA`: Múltiplos usuários (`ADMIN`, `NUTRICIONISTA`, `SECRETARIA`).
  - `AUTONOMO`: Consultório individual (1 único profissional com acesso completo).
- Em `CLINICA`, o perfil `SECRETARIA` possui acesso **estritamente administrativo/cadastral** (agenda, cadastro de pacientes, convênios, guia TISS, relatórios financeiros/agendamentos).
- O perfil `SECRETARIA` em `CLINICA` é bloqueado (`403 Forbidden`) pelo `clinicalGuard` em todos os endpoints de:
  - `/api/prontuario/*` (evoluções e medidas)
  - `/api/planos-alimentares/*`
  - `/api/avaliacoes/*` e `/api/pacientes/:id/avaliacoes`
  - `/api/exames/paciente/*`, `/api/exames/resultado` e `DELETE /api/exames/:id`
- Em `GET /api/pacientes/:id`, `GET /api/agendamentos`, `GET /api/relatorios` e `GET /api/dashboard`, jamais inclua relações clínicas (`evolucoes`, `medidas`, `planosAlimentares`, `avaliacoesQuestionarios`) quando o usuário não possuir acesso clínico.

## 3. Regras de Negócio Nutricionais
1. **Medidas Caseiras no Plano Alimentar**:
   - Os valores nutricionais na tabela `Alimento` (TACO) são sempre referentes a **100g** (`_basePer100`).
   - Quando uma medida caseira (`medidaCaseiraId`) está ativa, a quantidade em gramas real do item é `quantidade * medidaCaseira.quantidadeEmGramas`.
   - Medidas redundantes com nome `"g"`, `"grama"` ou `"gramas"` vindas do banco devem ser filtradas na UI para não duplicar a unidade padrão `"g"`.
2. **Classificação de IMC por Faixa Etária**:
   - Adultos (`< 60` anos): Critério **OMS** (Eutrofia: `18.5` a `24.9 kg/m²`).
   - Idosos (`>= 60` anos): Critério **Lipschitz / OPAS** (Baixo peso `< 22`, Eutrofia `22` a `27`, Excesso de peso `> 27 kg/m²`).
3. **Resumo do Plano Alimentar**:
   - Na tela do nutricionista (Builder e View), o resumo diário soma a **Opção Principal (`opcoes[0]`)** de cada refeição.
   - No PDF do paciente, o nutricionista pode escolher se deseja exibir ou ocultar as calorias/macros e se prefere o cálculo pela Opção Principal ou pela Média das opções.

