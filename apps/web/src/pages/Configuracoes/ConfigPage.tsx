import { useState } from 'react';
import { ConveniosConfig } from './Convenios/ConveniosConfig';
import { ModoOperacaoConfig } from './ModoOperacao/ModoOperacaoConfig';
import { ExamesBaseConfig } from './ExamesBase/ExamesBaseConfig';
import { UsuariosConfig } from './Usuarios/UsuariosConfig';
import { ClinicaConfig } from './Clinica/ClinicaConfig';
import { useIsAutonomo } from '@/hooks/useIsAutonomo';
import styles from './ConfigPage.module.scss';

type Tab = 'convenios' | 'exames' | 'usuarios' | 'modo' | 'clinica';

export function ConfigPage() {
  const [tab, setTab] = useState<Tab>('convenios');
  const isAutonomo = useIsAutonomo();

  return (
    <div>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'convenios' ? styles.active : ''}`}
          onClick={() => setTab('convenios')}
        >
          Convênios
        </button>
        <button
          className={`${styles.tab} ${tab === 'exames' ? styles.active : ''}`}
          onClick={() => setTab('exames')}
        >
          Exames Base
        </button>
        {!isAutonomo && (
          <button
            className={`${styles.tab} ${tab === 'usuarios' ? styles.active : ''}`}
            onClick={() => setTab('usuarios')}
          >
            Usuários
          </button>
        )}
        <button
          className={`${styles.tab} ${tab === 'modo' ? styles.active : ''}`}
          onClick={() => setTab('modo')}
        >
          Modo de Operação
        </button>
        <button
          className={`${styles.tab} ${tab === 'clinica' ? styles.active : ''}`}
          onClick={() => setTab('clinica')}
        >
          Clínica
        </button>
      </div>

      {tab === 'convenios' && <ConveniosConfig />}
      {tab === 'exames' && <ExamesBaseConfig />}
      {tab === 'usuarios' && !isAutonomo && <UsuariosConfig />}
      {tab === 'modo' && <ModoOperacaoConfig />}
      {tab === 'clinica' && <ClinicaConfig />}
    </div>
  );
}
