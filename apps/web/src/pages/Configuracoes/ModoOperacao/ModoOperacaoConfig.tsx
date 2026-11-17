import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { getMe, alterarTipoClinica } from '@/services/clinica';
import { useIsAutonomo } from '@/hooks/useIsAutonomo';
import styles from './ModoOperacaoConfig.module.scss';
import { HugeiconsIcon } from '@hugeicons/react';
import { Building04Icon, UserMultipleIcon, Alert02Icon } from '@hugeicons/core-free-icons';

export function ModoOperacaoConfig() {
  const { setTokens, setUser } = useAuthStore();
  const isAutonomo = useIsAutonomo();
  const [errorMsg, setErrorMsg] = useState('');

  const mutation = useMutation({
    mutationFn: (tipo: 'AUTONOMO' | 'CLINICA') => alterarTipoClinica(tipo),
    onSuccess: async (res) => {
      setTokens(res.tokens.accessToken, res.tokens.refreshToken);
      const user = await getMe();
      setUser(user);
      window.location.reload();
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Erro ao alterar modo de operação.');
    }
  });

  function handleMigrar(novoTipo: 'AUTONOMO' | 'CLINICA') {
    if (confirm(`Deseja realmente migrar para o modo ${novoTipo === 'AUTONOMO' ? 'Autônomo' : 'Clínica'}?`)) {
      setErrorMsg('');
      mutation.mutate(novoTipo);
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Modo de Operação</h2>
      <p className={styles.description}>
        Altere o modo de operação do seu sistema. Atualmente você está no modo <strong>{isAutonomo ? 'Autônomo' : 'Clínica'}</strong>.
      </p>

      {errorMsg && (
        <div className={styles.alert}>
          <HugeiconsIcon icon={Alert02Icon} size={18} />
          {errorMsg}
        </div>
      )}

      <div className={styles.cardsGrid}>
        <div className={`${styles.card} ${isAutonomo ? styles.active : ''}`}>
          <div className={styles.cardHeader}>
            <HugeiconsIcon icon={UserMultipleIcon} size={28} />
            <h3>Autônomo</h3>
          </div>
          <p>Ideal para nutricionistas que trabalham sozinhos. Filtros simplificados e agenda direta.</p>
          {!isAutonomo && (
            <button
              className={styles.actionBtn}
              onClick={() => handleMigrar('AUTONOMO')}
              disabled={mutation.isPending}
            >
              Mudar para Autônomo
            </button>
          )}
          {isAutonomo && <span className={styles.currentBadge}>Modo Atual</span>}
        </div>

        <div className={`${styles.card} ${!isAutonomo ? styles.active : ''}`}>
          <div className={styles.cardHeader}>
            <HugeiconsIcon icon={Building04Icon} size={28} />
            <h3>Clínica</h3>
          </div>
          <p>Ideal para clínicas com múltiplos profissionais, secretárias e gestão avançada.</p>
          {isAutonomo && (
            <button
              className={styles.actionBtn}
              onClick={() => handleMigrar('CLINICA')}
              disabled={mutation.isPending}
            >
              Mudar para Clínica
            </button>
          )}
          {!isAutonomo && <span className={styles.currentBadge}>Modo Atual</span>}
        </div>
      </div>
    </div>
  );
}
