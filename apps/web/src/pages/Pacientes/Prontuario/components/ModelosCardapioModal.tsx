import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, Alert01Icon } from "@hugeicons/core-free-icons";
import type { TokenPayload } from "@nutricao/shared";
import { OBJETIVO_LABELS, type PlanoAlimentarAPI } from "@/services/planoAlimentar";
import { calcularTotaisPlano } from "@/utils/nutricaoCalculos";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal/DeleteConfirmModal";
import { Skeleton } from "@/components/Loading/Skeleton";
import { podeExcluirModeloClinica } from "./planoAlimentarHelpers";
import styles from "./PlanoAlimentar.module.scss";

interface ModelosCardapioModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelos: PlanoAlimentarAPI[];
  isLoading: boolean;
  isError: boolean;
  errorMsg: string | null;
  temRefeicoesExistentes: boolean;
  onAplicarModelo: (modelo: PlanoAlimentarAPI) => void;
  onExcluirModelo: (id: string) => void;
  excluindoId: string | null;
  currentUser: Pick<TokenPayload, "userId" | "perfil" | "tipoClinica"> | null;
}

export function ModelosCardapioModal({
  isOpen,
  onClose,
  modelos,
  isLoading,
  isError,
  errorMsg,
  temRefeicoesExistentes,
  onAplicarModelo,
  onExcluirModelo,
  excluindoId,
  currentUser,
}: ModelosCardapioModalProps) {
  const [modeloPendenteConfirmacao, setModeloPendenteConfirmacao] =
    useState<PlanoAlimentarAPI | null>(null);
  const [modeloParaExcluir, setModeloParaExcluir] =
    useState<PlanoAlimentarAPI | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setModeloPendenteConfirmacao(null);
      setModeloParaExcluir(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (modeloParaExcluir && excluindoId === null) {
      // Se o modelo excluído não está mais na lista, fecha o modal de confirmação
      if (!modelos.some((m) => m.id === modeloParaExcluir.id)) {
        setModeloParaExcluir(null);
      }
    }
  }, [modelos, modeloParaExcluir, excluindoId]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (modeloParaExcluir) {
        if (!excluindoId) setModeloParaExcluir(null);
        return;
      }
      if (modeloPendenteConfirmacao) {
        setModeloPendenteConfirmacao(null);
        return;
      }
      onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, modeloParaExcluir, modeloPendenteConfirmacao, excluindoId, onClose]);

  if (!isOpen) return null;

  function handleSolicitarAplicar(modelo: PlanoAlimentarAPI) {
    if (temRefeicoesExistentes) {
      setModeloPendenteConfirmacao(modelo);
      return;
    }
    onAplicarModelo(modelo);
  }

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div
          className={`${styles.modalContent} ${styles.modalWide}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modelos-cardapio-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.modalHeader}>
            <h3 id="modelos-cardapio-modal-title">Biblioteca de Modelos de Cardápio</h3>
            <button
              type="button"
              className={styles.modalCloseBtn}
              aria-label="Fechar"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {errorMsg && (
            <div className={styles.errorBanner} role="alert">
              <HugeiconsIcon icon={Alert01Icon} size={18} strokeWidth={2} />
              <span>{errorMsg}</span>
            </div>
          )}

          {modeloPendenteConfirmacao && (
            <div className={styles.templateConfirmBox} role="region" aria-label="Confirmação de substituição">
              <p>
                Este plano já possui refeições montadas. Ao aplicar o modelo{" "}
                <strong>"{modeloPendenteConfirmacao.titulo}"</strong>, as refeições, metas e
                observações atuais serão substituídas.
              </p>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setModeloPendenteConfirmacao(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.modalSubmitBtn}
                  onClick={() => {
                    const selecionado = modeloPendenteConfirmacao;
                    setModeloPendenteConfirmacao(null);
                    onAplicarModelo(selecionado);
                  }}
                >
                  Substituir e Aplicar
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.5rem 0" }}>
              <Skeleton width="100%" height="58px" borderRadius="8px" />
              <Skeleton width="100%" height="58px" borderRadius="8px" />
            </div>
          ) : isError ? (
            <div className={styles.equivErrorBox} role="alert">
              Não foi possível carregar os modelos da clínica. Feche e tente novamente.
            </div>
          ) : modelos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem 0", color: "#6b7280" }}>
              <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>
                Nenhum modelo salvo na clínica ainda.
              </p>
              <p style={{ margin: 0, fontSize: "0.8125rem" }}>
                Monte um plano e clique em <strong>"💾 Salvar como Modelo"</strong> para
                reutilizá-lo em 1 clique em outros pacientes.
              </p>
            </div>
          ) : (
            <div className={styles.templateList}>
              {modelos.map((mod) => {
                const kcalMod = Math.round(
                  calcularTotaisPlano(mod.refeicoes || [], "principal").cal,
                );
                const objetivoFormatado = mod.objetivo
                  ? OBJETIVO_LABELS[mod.objetivo] || mod.objetivo
                  : null;
                const podeExcluir = podeExcluirModeloClinica(mod, currentUser);
                const estaExcluindo = excluindoId === mod.id;

                return (
                  <div key={mod.id} className={styles.templateItem}>
                    <div className={styles.templateItemInfo}>
                      <strong>{mod.titulo}</strong>
                      <span>
                        {kcalMod} kcal • {(mod.refeicoes || []).length} refeições
                        {objetivoFormatado ? ` • ${objetivoFormatado}` : ""}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <button
                        type="button"
                        className={styles.modalSubmitBtn}
                        style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}
                        onClick={() => handleSolicitarAplicar(mod)}
                        disabled={Boolean(excluindoId)}
                      >
                        Aplicar Modelo
                      </button>
                      <button
                        type="button"
                        className={styles.removeRefeicaoBtn}
                        disabled={!podeExcluir || Boolean(excluindoId)}
                        title={
                          !podeExcluir
                            ? "Apenas o autor ou um administrador pode excluir este modelo"
                            : estaExcluindo
                              ? "Excluindo modelo..."
                              : "Excluir modelo"
                        }
                        onClick={() => setModeloParaExcluir(mod)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={Boolean(modeloParaExcluir)}
        onClose={() => {
          if (!excluindoId) setModeloParaExcluir(null);
        }}
        onConfirm={() => {
          if (modeloParaExcluir && !excluindoId) {
            onExcluirModelo(modeloParaExcluir.id);
          }
        }}
        title="Excluir Modelo de Cardápio"
        description={`Tem certeza que deseja excluir o modelo "${modeloParaExcluir?.titulo ?? ""}" da biblioteca da clínica?`}
        confirmText="Excluir Modelo"
        isPending={Boolean(excluindoId)}
      />
    </>
  );
}
