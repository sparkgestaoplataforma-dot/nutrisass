import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { LuUsers, LuCalendar, LuCircleCheck, LuCircleX } from 'react-icons/lu';
import { api } from '@/services/api';
import styles from './DashboardPage.module.scss';

const statusLabels: Record<string, string> = {
  AGENDADO: 'Agendado', CONFIRMOU: 'Confirmou', PRESENTE: 'Presente',
  ENCAIXE: 'Encaixe', CANCELADO: 'Cancelado', NAO_COMPARECEU: 'Não Compareceu',
  REALIZADO: 'Realizado', DESISTIU: 'Desistiu', REMARCOU: 'Remarcou',
};

const statusClass: Record<string, string> = {
  AGENDADO: styles.agendado, CONFIRMOU: styles.confirmou, PRESENTE: styles.presente,
  ENCAIXE: styles.encaixe, CANCELADO: styles.cancelado, NAO_COMPARECEU: styles.naoCompareceu,
  REALIZADO: styles.realizado, DESISTIU: styles.desistiu, REMARCOU: styles.remarcou,
};

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard');
      return data.data;
    },
  });

  if (isLoading || !data) {
    return <div className={styles.empty}>Carregando...</div>;
  }

  const {
    totalPacientes, pacientesMes, agendaHoje,
    agendamentosMes, realizadosMes, canceladosMes, naoCompareceuMes,
    proximosAgendamentos,
  } = data;

  return (
    <div>
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={`${styles.iconBox} ${styles.green}`}><LuUsers /></div>
          <div className={styles.cardInfo}>
            <strong>{totalPacientes}</strong>
            <span>Total Pacientes</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={`${styles.iconBox} ${styles.blue}`}><LuCalendar /></div>
          <div className={styles.cardInfo}>
            <strong>{agendaHoje}</strong>
            <span>Agenda Hoje</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={`${styles.iconBox} ${styles.green}`}><LuCircleCheck /></div>
          <div className={styles.cardInfo}>
            <strong>{realizadosMes}</strong>
            <span>Realizados (mês)</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={`${styles.iconBox} ${styles.red}`}><LuCircleX /></div>
          <div className={styles.cardInfo}>
            <strong>{canceladosMes}</strong>
            <span>Cancelados (mês)</span>
          </div>
        </div>
      </div>

      <div className={styles.resumoGrid}>
        <div className={styles.resumoCard}>
          <strong>{pacientesMes}</strong>
          <span>Novos Pacientes (mês)</span>
        </div>
        <div className={styles.resumoCard}>
          <strong>{agendamentosMes}</strong>
          <span>Agendamentos (mês)</span>
        </div>
        <div className={styles.resumoCard}>
          <strong>{naoCompareceuMes}</strong>
          <span>Não Compareceu (mês)</span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Agenda de Hoje</h3>
          <Link to="/agenda">Ver agenda completa</Link>
        </div>

        {proximosAgendamentos.length === 0 ? (
          <div className={styles.empty}>Nenhum agendamento para hoje.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Convênio</th>
                <th>Telefone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {proximosAgendamentos.map((ag: any) => (
                <tr key={ag.id}>
                  <td>
                    {new Date(ag.dataHora).toLocaleTimeString('pt-BR', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td>
                    <Link to={`/pacientes/${ag.paciente.id}`}>{ag.paciente.nome}</Link>
                  </td>
                  <td>{ag.convenio?.nome || 'Particular'}</td>
                  <td>{ag.paciente.telefone || '-'}</td>
                  <td>
                    <span className={`${styles.status} ${statusClass[ag.status] || ''}`}>
                      {statusLabels[ag.status] || ag.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
