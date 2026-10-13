import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, ViewIcon } from "@hugeicons/core-free-icons";
import styles from "./../ComparativoPage.module.scss";
import { Avaliacao } from "@/services/avaliacao";
import { NavigateFunction } from "react-router-dom";
import { UseMutationResult } from "@tanstack/react-query";
interface TabelaComparativoProps {
  pacienteId: string;
  resultadosFiltrados: Avaliacao[];
  formatarData: (dataISO: string) => string;
  navigate: NavigateFunction;
  handleAbrirModalExcluirAvaliacao: (id: string) => void;
}
export function TabelaComparativo({
  pacienteId,
  resultadosFiltrados,
  formatarData,
  navigate,
  handleAbrirModalExcluirAvaliacao,
}: TabelaComparativoProps) {
  return (
    <>
      {/* Tabela para Desktop */}
      <div className={styles.medidasTable}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Evolução</th>
              <th>Observação</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {resultadosFiltrados?.map((item) => (
              <tr key={item.id}>
                <td>{formatarData(item.dataRealizacao)}</td>
                <td>{item.scoreTotal}</td>
                <td>{item.regraInterpretacao}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={`${styles.actionBtn} ${styles.shortcutBtn}`}
                      onClick={() =>
                        navigate(`/avaliacoes/${item.id}/${pacienteId}`)
                      }
                      title="Ver detalhes"
                    >
                      <HugeiconsIcon icon={ViewIcon} size={16} strokeWidth={2} />
                    </button>

                    <button
                      className={`${styles.actionBtn} ${styles.danger}`}
                      onClick={() => handleAbrirModalExcluirAvaliacao(item.id)}
                      title="Excluir"
                    >
                      <HugeiconsIcon
                        icon={Delete02Icon}
                        size={16}
                        strokeWidth={2}
                      />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards para Mobile */}
      <div className={styles.mobileCards}>
        {resultadosFiltrados?.map((item) => (
          <div key={item.id} className={styles.mobileCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardDate}>
                {formatarData(item.dataRealizacao)}
              </span>
              <div className={styles.cardScoreBadge}>
                <span className={styles.cardScoreLabel}>Score</span>
                <strong className={styles.cardScoreValue}>{item.scoreTotal}</strong>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.cardObservation}>
                <span className={styles.cardLabel}>Classificação</span>
                <p className={styles.cardText}>{item.regraInterpretacao || 'Nenhuma classificação'}</p>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <button
                className={styles.cardPrimaryBtn}
                onClick={() => navigate(`/avaliacoes/${item.id}/${pacienteId}`)}
              >
                <HugeiconsIcon icon={ViewIcon} size={16} strokeWidth={2} />
                <span>Ver Detalhes</span>
              </button>
              <button
                className={styles.cardDeleteBtn}
                onClick={() => handleAbrirModalExcluirAvaliacao(item.id)}
                aria-label="Excluir avaliação"
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
