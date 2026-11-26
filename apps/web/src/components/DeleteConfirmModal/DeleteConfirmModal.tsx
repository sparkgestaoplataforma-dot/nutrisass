import React, { useEffect } from "react";
import styles from "./DeleteConfirmModal.module.scss";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  isPending?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar Exclusão",
  isPending = false,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.excluirOverlay} onClick={() => { if (!isPending) onClose(); }}>
      <div
        className={styles.excluirModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.excluirHeader}>
          <div className={styles.excluirHeaderTitle}>
            <div className={styles.excluirIcon}>!</div>
            <h3 id="delete-confirm-modal-title">{title}</h3>
          </div>

          <button
            type="button"
            className={styles.excluirCloseBtn}
            aria-label="Fechar"
            onClick={onClose}
            disabled={isPending}
          >
            ✕
          </button>
        </div>

        <div className={styles.excluirBody}>
          <p className={styles.excluirDescricao}>{description}</p>

          <p className={styles.excluirAviso}>
            Essa ação <strong>não pode ser desfeita</strong>.
          </p>
        </div>

        <div className={styles.excluirFooter}>
          <button
            type="button"
            className={styles.excluirCancelBtn}
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={styles.excluirConfirmBtn}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Excluindo..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
