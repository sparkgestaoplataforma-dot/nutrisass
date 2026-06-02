import React from "react";
import styles from "./ConflictConfirmModal.module.scss";

interface ConflictConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  isPending?: boolean;
}

export function ConflictConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar Encaixe",
  isPending = false,
}: ConflictConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.conflictOverlay} onClick={onClose}>
      <div
        className={styles.conflictModal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.conflictHeader}>
          <div className={styles.conflictHeaderTitle}>
            <div className={styles.conflictIcon}>!</div>
            <h3>{title}</h3>
          </div>

          <button 
            className={styles.conflictCloseBtn} 
            onClick={onClose}
            disabled={isPending}
          >
            ✕
          </button>
        </div>

        <div className={styles.conflictBody}>
          <p className={styles.conflictDescricao}>{description}</p>

          <p className={styles.conflictAviso}>
            Ao confirmar, esse agendamento será marcado como <strong>Encaixe</strong> e não ocupará um horário normal livre.
          </p>
        </div>

        <div className={styles.conflictFooter}>
          <button
            type="button"
            className={styles.conflictCancelBtn}
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={styles.conflictConfirmBtn}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Salvando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
