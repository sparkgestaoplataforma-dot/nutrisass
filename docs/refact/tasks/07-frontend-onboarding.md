# Task 07 — Frontend: Onboarding com seletor de tipo

## Objetivo
Adicionar ao formulário de onboarding a escolha entre "Autônomo" e "Clínica", adaptando o formulário conforme a opção selecionada.

## Dependências
- Task 02 (onboardingSchema com campo `tipo`)
- Task 05 (backend aceita `tipo` no onboarding)

## Arquivos Impactados
- `apps/web/src/pages/Onboarding/OnboardingPage.tsx`
- `apps/web/src/pages/Onboarding/OnboardingPage.module.scss`

## Detalhamento

### UX Proposta

**Step 1 — Escolha do tipo** (novo):
Dois cards clicáveis lado a lado:
- **Sou Autônomo(a)** — "Trabalho sozinho(a) e quero gerenciar meus pacientes"
- **Tenho uma Clínica** — "Tenho uma equipe e quero gerenciar minha clínica"

**Step 2 — Formulário** (adaptado):
- Se **Autônomo**:
  - Título: "Cadastre seu consultório"
  - Subtítulo da seção: "Seu Acesso" (sem "(Administrador)")
  - Campo CNPJ: oculto
  - Campo "Nome da Clínica": label muda para "Nome do Consultório"
- Se **Clínica**: 
  - Comportamento atual inalterado

### Implementação

Adicionar um `useState` para controlar o tipo selecionado:
```typescript
const [tipoSelecionado, setTipoSelecionado] = useState<'AUTONOMO' | 'CLINICA' | null>(null);
```

Ao submeter, incluir `tipo` no payload:
```typescript
mutation.mutate({ ...data, tipo: tipoSelecionado! });
```

## Critérios de Aceite
- [ ] Cards de seleção de tipo são exibidos antes do formulário
- [ ] Formulário autônomo esconde CNPJ e adapta labels
- [ ] Formulário clínica permanece igual ao atual
- [ ] Payload enviado ao backend inclui `tipo`
- [ ] Design dos cards segue o padrão visual do sistema (verde primário, bordas arredondadas)

## Riscos / Observações
- O botão de submit deve refletir o tipo: "Cadastrar Consultório" vs "Cadastrar Clínica"
