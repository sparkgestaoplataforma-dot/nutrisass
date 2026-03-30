import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  ClipboardIcon,
  FileValidationIcon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import {
  listarQuestionarios,
  criarQuestionarioDefault,
} from "@/services/questionarios";
import { useAuthStore } from "@/stores/authStore";
import styles from "./AplicarQuestionarioModal.module.scss";

type PacienteModal = {
  id: string;
  nome: string;
};

type AplicarQuestionarioModalProps = {
  isOpen: boolean;
  paciente: PacienteModal | null;
  onClose: () => void;
};

export function AplicarQuestionarioModal({
  isOpen,
  paciente,
  onClose,
}: AplicarQuestionarioModalProps) {
  const [questionarioCopiadoId, setQuestionarioCopiadoId] = useState<
    string | null
  >(null);
  const user = useAuthStore((state) => state.user);

  const perfil = (user?.perfil || "").toUpperCase();
  const podeCadastrarDefault = perfil === "ADMIN" || perfil === "NUTRICIONISTA";
  const isSecretaria = perfil === "SECRETARIA";

  const {
    data: questionarios = [],
    isLoading: isLoadingQuestionarios,
    refetch: refetchQuestionarios,
  } = useQuery({
    queryKey: ["questionarios-modal"],
    queryFn: listarQuestionarios,
    enabled: isOpen,
  });

  const cadastrarDefaultMutation = useMutation({
    mutationFn: criarQuestionarioDefault,
    onSuccess: async () => {
      await refetchQuestionarios();
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setQuestionarioCopiadoId(null);
    }
  }, [isOpen]);

  async function handleCopiarUrl(questionarioId: string) {
    if (!paciente) return;

    const url = `${window.location.origin}/questionarios/${questionarioId}/pacientes/${paciente.id}/responder`;

    try {
      await navigator.clipboard.writeText(url);
      setQuestionarioCopiadoId(questionarioId);
      setTimeout(() => {
        setQuestionarioCopiadoId((current) =>
          current === questionarioId ? null : current,
        );
      }, 1600);
    } catch {
      alert("Não foi possível copiar a URL.");
    }
  }

  if (!isOpen || !paciente) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>
            <HugeiconsIcon
              icon={FileValidationIcon}
              size={18}
              strokeWidth={2}
            />
            Selecionar Questionário
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalSubtitulo}>
            Paciente: <strong>{paciente.nome}</strong>
          </p>

          <div className={styles.modalInfoText}>
            <p>
              Selecione o questionário que deseja aplicar. Assim que o paciente
              finalizar o preenchimento, o resultado é gerado automaticamente e
              fica disponível no sistema.
            </p>
            <p>
              Você também pode copiar o link para compartilhar por WhatsApp,
              e-mail ou outro canal de atendimento.
            </p>
          </div>

          {isLoadingQuestionarios ? (
            <div className={styles.empty}>Carregando questionários...</div>
          ) : questionarios.length === 0 ? (
            <div className={styles.emptyQuestionarios}>
              {podeCadastrarDefault ? (
                <div className={styles.emptyQuestionariosAction}>
                  <p>
                    Ainda não há questionários cadastrados. Você pode usar o
                    questionário de hipersensibilidade padrão.
                  </p>
                  <button
                    className={styles.novoBtn}
                    onClick={() => cadastrarDefaultMutation.mutate()}
                    disabled={cadastrarDefaultMutation.isPending}
                  >
                    <HugeiconsIcon
                      icon={PlusSignIcon}
                      size={16}
                      strokeWidth={2}
                    />
                    {cadastrarDefaultMutation.isPending
                      ? "Cadastrando..."
                      : "Cadastrar questionário padrão"}
                  </button>
                </div>
              ) : isSecretaria ? (
                <p className={styles.emptyMessageWithIcon}>
                  <HugeiconsIcon
                    icon={FileValidationIcon}
                    size={16}
                    strokeWidth={2}
                  />
                  Não há questionários cadastrados. Informe a um nutricionista
                  para realizar o cadastro.
                </p>
              ) : (
                <p>Não há questionários cadastrados.</p>
              )}
            </div>
          ) : (
            <ul className={styles.questionariosList}>
              {questionarios.map((questionario) => {
                const path = `/questionarios/${questionario.id}/pacientes/${paciente.id}/responder`;
                const foiCopiado = questionarioCopiadoId === questionario.id;

                return (
                  <li key={questionario.id} className={styles.questionarioItem}>
                    <div className={styles.questionarioInfo}>
                      <strong>{questionario.nome}</strong>
                      <span>Versão {questionario.versao}</span>
                    </div>

                    <div className={styles.questionarioActions}>
                      <button
                        className={`${styles.actionBtn} ${styles.openBtn}`}
                        onClick={() => window.open(path, "_blank")}
                      >
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={14}
                          strokeWidth={2}
                        />
                        Abrir
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.copyBtn} ${foiCopiado ? styles.successBtn : ""}`}
                        onClick={() => handleCopiarUrl(questionario.id)}
                      >
                        <HugeiconsIcon
                          icon={ClipboardIcon}
                          size={14}
                          strokeWidth={2}
                        />
                        {foiCopiado ? "✓ Copiado" : "Copiar URL"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
