import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PencilEdit01Icon,
  Delete02Icon,
  CheckListIcon,
} from "@hugeicons/core-free-icons";
import { StatusBadge } from "./StatusBadge";
import type { AgendamentoResponse } from "@/services/agenda";
import { QuestionarioSelectorModal } from "@/components/QuestionarioSelectorModal/QuestionarioSelectorModal";
import { useIsAutonomo } from "@/hooks/useIsAutonomo";
import styles from "./TabelaAgenda.module.scss";

type PacienteSelecionado = {
  id: string;
  nome: string;
};

interface TabelaAgendaProps {
  agendamentos: AgendamentoResponse[];
  onChangeStatus: (id: string, status: string) => void;
  onEdit: (agendamento: AgendamentoResponse) => void;
  onDelete: (id: string) => void;
}

export function TabelaAgenda({
  agendamentos,
  onChangeStatus,
  onEdit,
  onDelete,
}: TabelaAgendaProps) {
  const navigate = useNavigate();
  const [modalQuestionariosAberto, setModalQuestionariosAberto] =
    useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] =
    useState<PacienteSelecionado | null>(null);
  const isAutonomo = useIsAutonomo();

  function handleAbrirQuestionarios(agendamento: AgendamentoResponse) {
    setPacienteSelecionado({
      id: agendamento.pacienteId,
      nome: agendamento.paciente.nome,
    });
    setModalQuestionariosAberto(true);
  }

  function handleFecharModalQuestionarios() {
    setModalQuestionariosAberto(false);
    setPacienteSelecionado(null);
  }

  if (agendamentos.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Nenhum agendamento para esta data.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Mobile view: list of cards */}
      <div className={styles.mobileList}>
        {agendamentos.map((ag) => (
          <div key={ag.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardHora}>
                {ag.dataHoraFormatada ? ag.dataHoraFormatada.split(' ')[1].slice(0, 5) : '-'}
              </span>
              <StatusBadge
                status={ag.status}
                onChangeStatus={(status) => onChangeStatus(ag.id, status)}
              />
            </div>

            <div className={styles.cardBody}>
              <div className={styles.cardPatientRow}>
                <span
                  className={styles.pacienteLink}
                  onClick={() => navigate(`/pacientes/${ag.pacienteId}`)}
                >
                  {ag.paciente.nome}
                </span>
                {ag.encaixe && <span className={styles.encaixe}>Encaixe</span>}
              </div>

              <div className={styles.cardMetaGrid}>
                {!isAutonomo && ag.nutricionista?.nome && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Nutri:</span>
                    <span className={styles.metaValue}>{ag.nutricionista.nome}</span>
                  </div>
                )}
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Convênio:</span>
                  <span className={styles.metaValue}>{ag.convenio?.nome || "Particular"}</span>
                </div>
                {ag.paciente.telefone && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Tel:</span>
                    <span className={styles.metaValue}>{ag.paciente.telefone}</span>
                  </div>
                )}
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Tipo:</span>
                  <span className={styles.metaValue}>{ag.tipo === "CONSULTA" ? "Consulta" : "Retorno"}</span>
                </div>
              </div>

              {ag.observacao && (
                <div className={styles.cardObservacao}>
                  <strong>Obs:</strong> {ag.observacao}
                </div>
              )}
            </div>

            <div className={styles.cardActions}>
              <button
                className={`${styles.actionBtn} ${styles.shortcutBtn}`}
                onClick={() => handleAbrirQuestionarios(ag)}
                title="Aplicar questionário"
              >
                <HugeiconsIcon icon={CheckListIcon} size={14} strokeWidth={2} />
                <span>Questionário</span>
              </button>
              <div className={styles.rightActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => onEdit(ag)}
                  title="Editar"
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} size={16} strokeWidth={2} />
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.danger}`}
                  onClick={() => onDelete(ag.id)}
                  title="Excluir"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view: table */}
      <div className={styles.desktopTable}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Paciente</th>
              {!isAutonomo && <th>Nutricionista</th>}
              <th>Convênio</th>
              <th>Telefone</th>
              <th>Tipo</th>
              <th>Observação</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {agendamentos.map((ag) => (
              <tr key={ag.id}>
                <td className={styles.hora}>
                  {ag.dataHoraFormatada ? ag.dataHoraFormatada.split(' ')[1].slice(0, 5) : '-'}
                </td>
                <td>
                  <span
                    className={styles.pacienteLink}
                    onClick={() => navigate(`/pacientes/${ag.pacienteId}`)}
                  >
                    {ag.paciente.nome}
                  </span>
                  {ag.encaixe && <span className={styles.encaixe}>Encaixe</span>}
                </td>
                {!isAutonomo && <td>{ag.nutricionista?.nome || "-"}</td>}
                <td>{ag.convenio?.nome || "Particular"}</td>
                <td>{ag.paciente.telefone || "-"}</td>
                <td>{ag.tipo === "CONSULTA" ? "Consulta" : "Retorno"}</td>
                <td>
                  <span className={styles.observacao}>
                    {ag.observacao || "-"}
                  </span>
                </td>
                <td>
                  <StatusBadge
                    status={ag.status}
                    onChangeStatus={(status) => onChangeStatus(ag.id, status)}
                  />
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={`${styles.actionBtn} ${styles.shortcutBtn}`}
                      onClick={() => handleAbrirQuestionarios(ag)}
                      title="Aplicar questionário"
                    >
                      <HugeiconsIcon
                        icon={CheckListIcon}
                        size={14}
                        strokeWidth={2}
                      />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => onEdit(ag)}
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
                      onClick={() => onDelete(ag.id)}
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

      <QuestionarioSelectorModal
        open={modalQuestionariosAberto}
        paciente={pacienteSelecionado}
        onClose={handleFecharModalQuestionarios}
      />
    </div>
  );
}
