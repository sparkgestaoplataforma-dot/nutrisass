import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LuArrowLeft, LuPencil } from 'react-icons/lu';
import { api } from '@/services/api';
import { EvolucaoTab } from './components/EvolucaoTab';
import { MedidasTab } from './components/MedidasTab';
import { ExamesTab } from './components/ExamesTab';
import styles from './ProntuarioPage.module.scss';

type Tab = 'evolucao' | 'medidas' | 'exames';

export function ProntuarioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('evolucao');

  const { data: paciente, isLoading } = useQuery({
    queryKey: ['paciente', id],
    queryFn: async () => {
      const { data } = await api.get(`/pacientes/${id}`);
      return data.data;
    },
  });

  if (isLoading) return <p>Carregando...</p>;
  if (!paciente) return <p>Paciente não encontrado.</p>;

  return (
    <div>
      <div className={styles.header}>
        <button className={styles.voltarBtn} onClick={() => navigate('/pacientes')}>
          <LuArrowLeft /> Voltar
        </button>
        <div className={styles.headerActions}>
          <button
            className={styles.editarBtn}
            onClick={() => navigate(`/pacientes/${id}/editar`)}
          >
            <LuPencil /> Editar Dados
          </button>
        </div>
      </div>

      <div className={styles.perfil}>
        <div className={styles.perfilNome}>
          <h2>{paciente.nome}</h2>
        </div>
        <div className={styles.perfilItem}>
          <label>Nascimento</label>
          <span>
            {paciente.dataNascimento
              ? new Date(paciente.dataNascimento).toLocaleDateString('pt-BR')
              : '-'}
          </span>
        </div>
        <div className={styles.perfilItem}>
          <label>E-mail</label>
          <span>{paciente.email || '-'}</span>
        </div>
        <div className={styles.perfilItem}>
          <label>Telefone</label>
          <span>{paciente.telefone || '-'}</span>
        </div>
        <div className={styles.perfilItem}>
          <label>WhatsApp</label>
          <span>{paciente.whatsapp || '-'}</span>
        </div>
        <div className={styles.perfilItem}>
          <label>Endereço</label>
          <span>
            {[paciente.endereco, paciente.bairro, paciente.municipio, paciente.uf]
              .filter(Boolean)
              .join(', ') || '-'}
          </span>
        </div>
        <div className={styles.perfilItem}>
          <label>Convênio</label>
          <span>{paciente.convenio?.nome || 'Particular'}</span>
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'evolucao' ? styles.active : ''}`}
          onClick={() => setTab('evolucao')}
        >
          Evolução Clínica
        </button>
        <button
          className={`${styles.tab} ${tab === 'medidas' ? styles.active : ''}`}
          onClick={() => setTab('medidas')}
        >
          Medidas
        </button>
        <button
          className={`${styles.tab} ${tab === 'exames' ? styles.active : ''}`}
          onClick={() => setTab('exames')}
        >
          Exames
        </button>
      </div>

      {tab === 'evolucao' && <EvolucaoTab pacienteId={id!} />}
      {tab === 'medidas' && <MedidasTab pacienteId={id!} />}
      {tab === 'exames' && <ExamesTab pacienteId={id!} />}
    </div>
  );
}
