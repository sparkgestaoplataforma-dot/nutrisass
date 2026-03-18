import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, Delete02Icon, TaskDone01Icon } from '@hugeicons/core-free-icons';
import { api } from '@/services/api';
import styles from '../ProntuarioPage.module.scss';

interface ExamesTabProps {
  pacienteId: string;
}

export function ExamesTab({ pacienteId }: ExamesTabProps) {
  const [solicitando, setSolicitando] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [resultadoForm, setResultadoForm] = useState<{
    itemId: string;
    resultado: string;
    dataResultado: string;
  } | null>(null);
  const queryClient = useQueryClient();

  const { data: solicitacoes = [] } = useQuery({
    queryKey: ['exames-solicitacoes', pacienteId],
    queryFn: async () => {
      const { data } = await api.get(`/exames/paciente/${pacienteId}`);
      return data.data;
    },
  });

  const { data: examesBase = [] } = useQuery({
    queryKey: ['exames-base'],
    queryFn: async () => {
      const { data } = await api.get('/exames/base');
      return data.data;
    },
  });

  const solicitarMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/exames/paciente/${pacienteId}`, {
        pacienteId,
        exameBaseIds: selecionados,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exames-solicitacoes', pacienteId] });
      setSolicitando(false);
      setSelecionados([]);
    },
  });

  const resultadoMutation = useMutation({
    mutationFn: async (data: { itemId: string; dataResultado: string; resultado: string }) => {
      return api.post('/exames/resultado', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exames-solicitacoes', pacienteId] });
      setResultadoForm(null);
    },
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/exames/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exames-solicitacoes', pacienteId] });
    },
  });

  function toggleExame(id: string) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }

  return (
    <div>
      <button
        className={styles.novaEvolucaoBtn}
        onClick={() => setSolicitando(!solicitando)}
      >
        <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} /> Solicitar Exame
      </button>

      {solicitando && (
        <div className={styles.evolucaoForm}>
          <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
            Selecione os exames:
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
            {examesBase.map((ex: any) => (
              <label key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selecionados.includes(ex.id)}
                  onChange={() => toggleExame(ex.id)}
                  style={{ accentColor: '#10b981' }}
                />
                {ex.nome}
              </label>
            ))}
          </div>
          {examesBase.length === 0 && (
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              Nenhum exame base cadastrado. Cadastre em Configurações.
            </p>
          )}
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setSolicitando(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className={styles.submitBtn}
              disabled={selecionados.length === 0 || solicitarMutation.isPending}
              onClick={() => solicitarMutation.mutate()}
            >
              {solicitarMutation.isPending ? 'Solicitando...' : `Solicitar (${selecionados.length})`}
            </button>
          </div>
        </div>
      )}

      {resultadoForm && (
        <div className={styles.evolucaoForm}>
          <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
            Registrar Resultado
          </h4>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Data do Resultado</label>
              <input
                type="date"
                value={resultadoForm.dataResultado}
                onChange={(e) => setResultadoForm({ ...resultadoForm, dataResultado: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Resultado</label>
              <input
                value={resultadoForm.resultado}
                onChange={(e) => setResultadoForm({ ...resultadoForm, resultado: e.target.value })}
                placeholder="Valor do resultado"
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setResultadoForm(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className={styles.submitBtn}
              disabled={!resultadoForm.resultado || resultadoMutation.isPending}
              onClick={() => resultadoMutation.mutate(resultadoForm)}
            >
              {resultadoMutation.isPending ? 'Salvando...' : 'Salvar Resultado'}
            </button>
          </div>
        </div>
      )}

      {solicitacoes.length === 0 ? (
        <div className={styles.empty}>Nenhum exame solicitado.</div>
      ) : (
        solicitacoes.map((sol: any) => (
          <div key={sol.id} className={styles.evolucaoCard}>
            <div className={styles.evolucaoHeader}>
              <h3>
                Solicitação — {new Date(sol.dataSolicitada).toLocaleDateString('pt-BR')}
              </h3>
              <button
                className={styles.medidaActionBtn}
                onClick={() => {
                  if (confirm('Excluir esta solicitação?')) excluirMutation.mutate(sol.id);
                }}
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
              </button>
            </div>
            <div className={styles.medidasTable}>
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Exame</th>
                    <th>Resultado</th>
                    <th>Data Resultado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sol.itens.map((item: any) => (
                    <tr key={item.id}>
                      <td>{item.exameBase.codigo}</td>
                      <td>{item.exameBase.nome}</td>
                      <td>{item.resultado || '-'}</td>
                      <td>
                        {item.dataResultado
                          ? new Date(item.dataResultado).toLocaleDateString('pt-BR')
                          : '-'}
                      </td>
                      <td>
                        {!item.resultado && (
                          <button
                            className={styles.medidaActionBtn}
                            style={{ color: '#10b981' }}
                            title="Registrar resultado"
                            onClick={() =>
                              setResultadoForm({
                                itemId: item.id,
                                resultado: '',
                                dataResultado: new Date().toISOString().split('T')[0],
                              })
                            }
                          >
                            <HugeiconsIcon icon={TaskDone01Icon} size={16} strokeWidth={2} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
