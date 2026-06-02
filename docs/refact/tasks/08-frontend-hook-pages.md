# Task 08 — Frontend: Hook useIsAutonomo + adaptação das páginas

## Objetivo
Criar um hook centralizado `useIsAutonomo()` e aplicá-lo em todas as páginas para esconder/simplificar elementos desnecessários no modo autônomo.

## Dependências
- Task 03 (tipoClinica no TokenPayload/JWT)

## Arquivos Impactados

### Novo arquivo:
- `apps/web/src/hooks/useIsAutonomo.ts`

### Páginas adaptadas:
- `apps/web/src/pages/Agenda/AgendaPage.tsx`
- `apps/web/src/pages/Agenda/components/AgendamentoModal.tsx`
- `apps/web/src/pages/Agenda/components/TabelaAgenda.tsx`
- `apps/web/src/pages/Dashboard/DashboardPage.tsx`
- `apps/web/src/pages/Configuracoes/ConfigPage.tsx`

## Detalhamento

### 1. Hook `useIsAutonomo`
```typescript
import { useAuthStore } from '@/stores/authStore';

export function useIsAutonomo(): boolean {
  const user = useAuthStore((s) => s.user);
  return user?.tipoClinica === 'AUTONOMO';
}
```

### 2. AgendaPage.tsx — esconder filtro de nutricionista
```tsx
const isAutonomo = useIsAutonomo();

// No estado inicial, autônomo sempre filtra por si mesmo:
const [nutricionistaId, setNutricionistaId] = useState(
  isAutonomo || (user?.perfil !== 'SECRETARIA' && user?.perfil !== 'ADMIN')
    ? (user?.userId || "")
    : ""
);

// Na renderização, esconder o select de nutricionista:
{!isAutonomo && (
  <div className={styles.nutriFilter}>
    <select ...>
      {(user?.perfil === 'SECRETARIA' || user?.perfil === 'ADMIN') && 
        <option value="">Todos os Nutricionistas</option>
      }
      {nutricionistas.map(...)}
    </select>
  </div>
)}
```

### 3. AgendamentoModal.tsx — esconder campo nutricionista
```tsx
// Esconder o <select> de nutricionista e auto-preencher:
{!isAutonomo && (
  <div className={styles.field}>
    <label>Nutricionista</label>
    <select {...register('nutricionistaId')} ...>
      ...
    </select>
  </div>
)}
```
No autônomo, `nutricionistaId` é sempre `user.userId` (setado via `defaultValues`/`reset`).

### 4. TabelaAgenda.tsx — esconder coluna "Nutricionista"
```tsx
// Receber prop isAutonomo ou usar hook:
{!isAutonomo && <th>Nutricionista</th>}
// ... na célula:
{!isAutonomo && <td>{ag.nutricionista?.nome || "-"}</td>}
```

### 5. DashboardPage.tsx — esconder filtro e badge de nutricionista
- Esconder bloco de filtro por nutricionista (L147-170)
- Esconder badge com nome do nutricionista nos cards de agendamento (L325-329)

### 6. ConfigPage.tsx — esconder tab "Usuários"
```tsx
const isAutonomo = useIsAutonomo();

// Esconder tab de usuários:
{!isAutonomo && (
  <button className={...} onClick={() => setTab('usuarios')}>
    Usuários
  </button>
)}

// Não renderizar o componente:
{tab === 'usuarios' && !isAutonomo && <UsuariosConfig />}
```

## Critérios de Aceite
- [ ] Hook `useIsAutonomo` funciona e reflete o valor do token
- [ ] Agenda autônoma não mostra filtro de nutricionista
- [ ] Modal de agendamento autônomo não mostra seletor de nutricionista
- [ ] Tabela de agenda autônoma não mostra coluna "Nutricionista"
- [ ] Dashboard autônomo não mostra filtro de nutricionista
- [ ] Dashboard autônomo não mostra badge de nome do nutricionista
- [ ] Configurações autônomas não mostram tab "Usuários"
- [ ] **Modo clínica continua funcionando exatamente como antes**

## Riscos / Observações
- **Gap Identificado**: O `AgendamentoModal` recebe `user` como prop (não do store). O hook `useIsAutonomo` precisa estar disponível tanto para leitura do store quanto ser passável como prop. Alternativa: passar `isAutonomo` como prop para componentes filhos.
- **Gap Identificado**: O `TabelaAgenda` não recebe props de user atualmente. Duas opções: (a) usar o hook direto no componente, ou (b) passar `isAutonomo` como prop desde o `AgendaPage`.
