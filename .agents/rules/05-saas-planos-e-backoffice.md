# Regra 05 — Motor de Planos (Entitlements), Add-ons e Painel Super Admin

## 1. Motor de *Entitlements* (Proibido `if (plano === 'PRO')`)
- O código de aplicação **jamais** deve verificar nomes de planos diretamente (`if (clinica.plano === 'GRATUITO')`).
- Todo controle comercial é resolvido em um objeto efetivo `ClinicaEntitlements` (`Plano Base + Add-ons Ativos + Overrides do SuperAdmin`), cacheado no Redis (`entitlements:${clinicaId}`):
  1. **Feature Flag (`boolean`)**: Verificada nas rotas via middleware `featureGuard('chave')` → retorna HTTP `402` (`code: 'FEATURE_LOCKED'`) quando desabilitada.
  2. **Quota (`number | null`, onde `null` = ilimitado)**: Verificada dentro de `prisma.$transaction` nos Services via `assertQuota(tx, clinicaId, 'chave', totalAtual)` → retorna HTTP `402` (`code: 'QUOTA_EXCEEDED'`) quando atingida.
- **Nome do Módulo**: Use `apps/api/src/modules/assinaturas/` (o diretório `modulos/` já pertence às seções de questionários).
- **Frontend**: Componentes consultam limites e uso via hook `useEntitlements()` e disparam modal de upgrade ao receber `402`.

## 2. Matriz Oficial do Plano Gratuito e Add-ons
- **Liberado / Ilimitado no Gratuito**: Escolha entre modo `AUTONOMO`/`CLINICA`, cadastro de `Pacientes`, `Agendamentos`, `Evoluções`, `Medidas`, `Planos Alimentares de pacientes`, `Exames` e `Convênios/TISS`.
- **Controlado por Cota ou Feature no Gratuito**:
  - `max_profissionais_clinicos`: `1` grátis (`ADMIN` + `NUTRICIONISTA` ativos somados); expansível por pacotes multiplicáveis.
  - `max_secretarias`: `1` grátis (`SECRETARIA` ativa); expansível por pacotes multiplicáveis.
  - `max_templates_plano`: `2` modelos (`isTemplate = true`) grátis; *add-on* destrava ilimitado.
  - `max_questionarios`: `1` questionário grátis; *add-on* destrava ilimitado.
  - `max_alimentos_custom`: `10` alimentos próprios (`clinicaId != null`) grátis; *add-on* destrava ilimitado.
  - `relatorios_completos`: no Gratuito restrito aos últimos `30 dias`; *add-on* destrava histórico completo/impressão.
- **Psicologia de Vitrine (Ancoragem Reversa)**: A tela de planos destaca a economia mensal do plano Personalizável (*"Você economiza R$ X/mês"*) frente ao Plano Completo/VIP (âncora) e aplica *Teto Inteligente* caso a soma de *add-ons* alcance o Plano Completo.

## 3. Cobrança Consolidada, Tolerância e Downgrade sem Perda de Dados
1. **Fatura Mensal Única e `PaymentProvider` Desacoplado**:
   - Todos os *add-ons* ativos da clínica são consolidados em uma única fatura mensal (`Fatura` + `FaturaItem`), integrada via interface `PaymentProvider` (Asaas/Stripe).
   - Adição de *add-on* no meio do ciclo cobra valor proporcional (*pro-rata*); remoção agenda `removerNoFimDoCiclo = true` mantendo o acesso até o fim do período já pago.
   - Reajustes de preço no catálogo preservam o valor contratado dos assinantes atuais (*grandfathering*).
2. **Tolerância (`EM_TOLERANCIA`) e Congelamento Suave (CFN/LGPD)**:
   - Vencimento em atraso entra em `EM_TOLERANCIA` (padrão `3 dias`) com alerta visual ao `ADMIN`, sem cortar recursos imediatamente.
   - Expirada a tolerância, a assinatura cai para `GRATUITO` **sem jamais apagar registros**:
     - Usuários ativos excedentes recebem `Usuario.ativo = false` (preservando o proprietário ativo e todo o histórico de consultas/planos).
     - Templates, questionários e alimentos antigos continuam visíveis/usáveis, bloqueando apenas **novas criações** acima da cota gratuita.

## 4. Isolamento do Super Admin (`/backoffice`) e Fronteira LGPD
- **Segurança Separada**:
  - Credenciais do dono do SaaS ficam na tabela `SuperAdmin` (nunca em `Usuario` de clínica).
  - Rotas em `/api/backoffice/*` usam `superAdminMiddleware` validando `JWT_BACKOFFICE_SECRET` e claim `aud: 'backoffice'`.
  - Toda ação administrativa gera registro obrigatório em `BackofficeAuditLog`.
  - No frontend (`apps/web`), as telas `/backoffice/*` devem usar `React.lazy` e store de sessão separada (`backofficeAuthStore`).
- **Proibição LGPD / CFN**:
  - Endpoints de `/api/backoffice/*` **JAMAIS** podem retornar dados clínicos nominais de pacientes (`Paciente` individual, `EvolucaoClinica`, `Medida`, `SolicitacaoExame`, `PlanoAlimentar` de paciente ou `Avaliacao`). Retorne exclusivamente contadores agregados (`_count`) e dados cadastrais/financeiros da clínica.
