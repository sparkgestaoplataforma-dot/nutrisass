import styles from "../AvaliacaoDetalhesPage.module.scss";

interface ExcluirAvaliacaoModalProps {
  handleDeleteAvaliacao: () => void;
  closeModal: () => void;
}

export function ExcluirAvaliacaoModal({
  handleDeleteAvaliacao,
  closeModal,
}: ExcluirAvaliacaoModalProps) {
  return (
    <div className={styles.excluirOverlay} onClick={closeModal}>
      <div className={styles.excluirModal} onClick={(e) => e.stopPropagation()}>
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
          >
            Cancelar
          </button>

          <button
            type="button"
            className={styles.excluirDeleteBtn}
            onClick={handleDeleteAvaliacao}
          >
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
}
