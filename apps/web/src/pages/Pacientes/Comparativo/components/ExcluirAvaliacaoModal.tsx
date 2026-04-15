import styles from "../ComparativoPage.module.scss";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

interface ExcluirAvaliacaoModalProps {
  deleteAvaliacaoMutation: UseMutationResult<
    AxiosResponse<any>,
    Error,
    string,
    { previousData: any }
  >;
  closeModal: () => void;
  avaliacaoIdParaExcluir: string;
}

export function ExcluirAvaliacaoModal({
  deleteAvaliacaoMutation,
  closeModal,
  avaliacaoIdParaExcluir,
}: ExcluirAvaliacaoModalProps) {
  return (
    <div className={styles.excluirOverlay} onClick={closeModal}>
      <div
        className={styles.excluirModal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.excluirHeader}>
          <div className={styles.excluirHeaderTitle}>
            <div className={styles.excluirIcon}>!</div>
            <h3>Excluir Avaliação</h3>
          </div>

          <button className={styles.excluirCloseBtn} onClick={closeModal}>
            ✕
          </button>
        </div>

        <div className={styles.excluirBody}>
          <p className={styles.excluirDescricao}>
            Tem certeza que deseja excluir esta avaliação?
          </p>

          <p className={styles.excluirAviso}>
            Essa ação <strong>não pode ser desfeita</strong>.
          </p>
        </div>

        <div className={styles.excluirFooter}>
          <button
            type="button"
            className={styles.excluirCancelBtn}
            onClick={closeModal}
            disabled={deleteAvaliacaoMutation.isPending}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={styles.excluirDeleteBtn}
            disabled={deleteAvaliacaoMutation.isPending}
            onClick={() =>
              deleteAvaliacaoMutation.mutate(avaliacaoIdParaExcluir)
            }
          >
            {deleteAvaliacaoMutation.isPending
              ? "Excluindo..."
              : "Confirmar Exclusão"}
          </button>
        </div>
      </div>
    </div>
  );
}