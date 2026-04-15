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
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Excluir Avaliação</h3>

          <button className={styles.closeBtn} onClick={closeModal}>
            ✕
          </button>
        </div>

        <div className={styles.bodyModal}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={closeModal}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleDeleteAvaliacao}
          >
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
}
