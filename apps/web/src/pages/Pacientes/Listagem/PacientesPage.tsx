import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  PencilEdit01Icon,
  Delete02Icon,
  CheckListIcon,
  ClipboardIcon,
  ArrowRight01Icon,
  FileValidationIcon,
} from "@hugeicons/core-free-icons";
import { listarPacientes } from "@/services/pacientes";
import {
  listarQuestionarios,
  criarQuestionarioDefault,
} from "@/services/questionarios";
import { api } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/stores/authStore";
import styles from "./PacientesPage.module.scss";

type PacienteSelecionado = {
  id: string;
  nome: string;
};

export function PacientesPage() {
  const [busca, setBusca] = useState("");
  const [modalQuestionariosAberto, setModalQuestionariosAberto] =
    useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] =
    useState<PacienteSelecionado | null>(null);
  const [questionarioCopiadoId, setQuestionarioCopiadoId] = useState<
    string | null
  >(null);
  const buscaDebounced = useDebounce(busca);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const perfil = (user?.perfil || "").toUpperCase();
  const podeCadastrarDefault = perfil === "ADMIN" || perfil === "NUTRICIONISTA";
  const isSecretaria = perfil === "SECRETARIA";

  const { data, isLoading } = useQuery({
    queryKey: ["pacientes", buscaDebounced],
    queryFn: () => listarPacientes(buscaDebounced || undefined),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/pacientes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    },
  });

  const {
    data: questionarios = [],
    isLoading: isLoadingQuestionarios,
    refetch: refetchQuestionarios,
  } = useQuery({
    queryKey: ["questionarios-modal"],
    queryFn: listarQuestionarios,
    enabled: modalQuestionariosAberto,
  });

  const cadastrarDefaultMutation = useMutation({
    mutationFn: criarQuestionarioDefault,
    onSuccess: async () => {
      await refetchQuestionarios();
    },
  });

  function handleDelete(id: string) {
    if (confirm("Deseja realmente excluir este paciente?")) {
      excluirMutation.mutate(id);
    }
  }

  function handleAbrirQuestionarios(paciente: PacienteSelecionado) {
    setPacienteSelecionado(paciente);
    setModalQuestionariosAberto(true);
  }

  function handleFecharModalQuestionarios() {
    setModalQuestionariosAberto(false);
    setPacienteSelecionado(null);
    setQuestionarioCopiadoId(null);
  }

  async function handleCopiarUrl(questionarioId: string) {
    if (!pacienteSelecionado) return;

    const url = `${window.location.origin}/questionarios/${questionarioId}/pacientes/${pacienteSelecionado.id}/responder`;

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

  const pacientes = data?.data || [];

  return (
    <div>
      <div className={styles.header}>
        <input
          type="text"
          className={styles.searchBox}
          placeholder="Buscar por nome, e-mail ou telefone..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button
          className={styles.novoBtn}
          onClick={() => navigate("/pacientes/novo")}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} /> Novo
          Paciente
        </button>
      </div>

      <div className={styles.container}>
        {isLoading ? (
          <div className={styles.empty}>Carregando...</div>
        ) : pacientes.length === 0 ? (
          <div className={styles.empty}>Nenhum paciente encontrado.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Convênio</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span
                      className={styles.nomeLink}
                      onClick={() => navigate(`/pacientes/${p.id}`)}
                    >
                      {p.nome}
                    </span>
                  </td>
                  <td>{p.email || "-"}</td>
                  <td>{p.telefone || "-"}</td>
                  <td>{p.convenio?.nome || "Particular"}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={`${styles.actionBtn} ${styles.shortcutBtn}`}
                        onClick={() =>
                          handleAbrirQuestionarios({ id: p.id, nome: p.nome })
                        }
                        title="Aplicar questionário"
                      >
                        <HugeiconsIcon
                          icon={CheckListIcon}
                          size={14}
                          strokeWidth={2}
                        />
                        {/* Questionários */}
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => navigate(`/pacientes/${p.id}/editar`)}
                        title="Editar"
                      >
                        <HugeiconsIcon
                          icon={PencilEdit01Icon}
                          size={16}
                          strokeWidth={2}
                        />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.danger}`}
                        onClick={() => handleDelete(p.id)}
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
        )}
      </div>

      {modalQuestionariosAberto && pacienteSelecionado && (
        <div
          className={styles.overlay}
          onClick={handleFecharModalQuestionarios}
        >
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
              <button
                className={styles.closeBtn}
                onClick={handleFecharModalQuestionarios}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalSubtitulo}>
                Paciente: <strong>{pacienteSelecionado.nome}</strong>
              </p>

              <div className={styles.modalInfoText}>
                <p>
                  Selecione o questionário que deseja aplicar. Assim que o
                  paciente finalizar o preenchimento, o resultado é gerado
                  automaticamente e fica disponível no sistema.
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
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
                      Não há questionários cadastrados. Informe a um
                      nutricionista para realizar o cadastro.
                    </p>
                  ) : (
                    <p>Não há questionários cadastrados.</p>
                  )}
                </div>
              ) : (
                <ul className={styles.questionariosList}>
                  {questionarios.map((questionario) => {
                    const path = `/questionarios/${questionario.id}/pacientes/${pacienteSelecionado.id}/responder`;
                    const foiCopiado =
                      questionarioCopiadoId === questionario.id;

                    return (
                      <li
                        key={questionario.id}
                        className={styles.questionarioItem}
                      >
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
      )}
    </div>
  );
}
