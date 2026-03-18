import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { PencilEdit01Icon, Delete02Icon } from '@hugeicons/core-free-icons';
import { StatusBadge } from './StatusBadge';
import type { AgendamentoResponse } from '@/services/agenda';
import styles from './TabelaAgenda.module.scss';

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

  if (agendamentos.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Nenhum agendamento para esta data.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Hora</th>
            <th>Paciente</th>
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
                {new Date(ag.dataHora).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
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
              <td>{ag.convenio?.nome || 'Particular'}</td>
              <td>{ag.paciente.telefone || '-'}</td>
              <td>{ag.tipo === 'CONSULTA' ? 'Consulta' : 'Retorno'}</td>
              <td>
                <span className={styles.observacao}>{ag.observacao || '-'}</span>
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
