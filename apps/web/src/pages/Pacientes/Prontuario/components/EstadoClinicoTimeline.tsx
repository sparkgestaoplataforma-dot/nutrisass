import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  PlusSignIcon,
  StethoscopeIcon,
  HeartCheckIcon,
  Shield01Icon,
  PillIcon,
  ClipboardIcon,
  PencilEdit01Icon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';
import {
  listarEvolucoes,
  criarEvolucao,
  editarEvolucao,
  excluirEvolucao,
} from '@/services/prontuario';
import type { CreateEvolucaoInput } from '@nutricao/shared';
import styles from '../ProntuarioPage.module.scss';

interface Props {
  pacienteId: string;
}

const secoes = [
  {
    key: 'estadoClinico',
    label: 'Sintomas',
    icon: StethoscopeIcon,
    colorClass: 'timelineIconGray',
  },
  {
    key: 'aparelhoDigestivo',
    label: 'Aparelho Digestivo',
    icon: HeartCheckIcon,
    colorClass: 'timelineIconRed',
  },
  {
    key: 'antecedentesMorbidos',
    label: 'Antecedentes Mórbidos',
    icon: Shield01Icon,
    colorClass: 'timelineIconBlue',
  },
  {
    key: 'medicamentos',
    label: 'Medicamentos',
    icon: PillIcon,
    colorClass: 'timelineIconYellow',
  },
  {
    key: 'outros',
    label: 'Outros',
    icon: ClipboardIcon,
    colorClass: 'timelineIconTeal',
  },
] as const;

export function EstadoClinicoTimeline({ pacienteId }: Props) {
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: evolucoes = [] } = useQuery({
    queryKey: ['evolucoes', pacienteId],
    queryFn: () => listarEvolucoes(pacienteId),
  });

  const { register, handleSubmit, reset } = useForm<CreateEvolucaoInput>();

  const salvarMutation = useMutation({
    mutationFn: async (data: CreateEvolucaoInput) => {
      if (editandoId) {
        return editarEvolucao(editandoId, data);
      }
      return criarEvolucao(pacienteId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolucoes', pacienteId] });
      setFormAberto(false);
      setEditandoId(null);
      reset();
    },
  });

  const excluirMutation = useMutation({
    mutationFn: async (id: string) => excluirEvolucao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolucoes', pacienteId] });
    },
  });

  function iniciarNovaEvolucao() {
    setEditandoId(null);
    reset({
      estadoClinico: '',
      aparelhoDigestivo: '',
      antecedentesMorbidos: '',
      medicamentos: '',
      outros: '',
    });
    setFormAberto(true);
  }

  function iniciarEdicao(ev: any) {
    setEditandoId(ev.id);
    reset({
      estadoClinico: ev.estadoClinico || '',
      aparelhoDigestivo: ev.aparelhoDigestivo || '',
      antecedentesMorbidos: ev.antecedentesMorbidos || '',
      medicamentos: ev.medicamentos || '',
      outros: ev.outros || '',
    });
    setFormAberto(true);
  }

  // Agrupar evoluções por seção preservando data e referência ao registro original
  const secaoData = secoes.map((secao) => {
    const registros = evolucoes
      .filter((ev: any) => ev[secao.key] && String(ev[secao.key]).trim())
      .map((ev: any) => ({
        id: ev.id as string,
        texto: ev[secao.key] as string,
        dataFormatada: new Date(ev.criadoEm || ev.data || Date.now()).toLocaleDateString('pt-BR'),
        evolucao: ev,
      }));
    return {
      ...secao,
      registros,
      hasContent: registros.length > 0,
    };
  });

  return (
    <div>
      <button
        className={styles.novaEvolucaoBtn}
        onClick={() => {
          if (formAberto && !editandoId) {
            setFormAberto(false);
          } else {
            iniciarNovaEvolucao();
          }
        }}
      >
        <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />
        Nova Evolução
      </button>

      {formAberto && (
        <form
          className={styles.evolucaoForm}
          onSubmit={handleSubmit((data) => salvarMutation.mutate(data))}
          style={{ marginBottom: '1.75rem' }}
        >
          <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 700 }}>
            {editandoId ? 'Editar Evolução Clínica' : 'Nova Evolução Clínica'}
          </h4>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Sintomas / Estado Clínico</label>
              <textarea rows={4} {...register('estadoClinico')} placeholder="Descreva os sintomas do paciente..." />
            </div>
            <div className={styles.field}>
              <label>Aparelho Digestivo</label>
              <textarea rows={4} {...register('aparelhoDigestivo')} placeholder="Estado do aparelho digestivo..." />
            </div>
            <div className={styles.field}>
              <label>Antecedentes Mórbidos</label>
              <textarea rows={4} {...register('antecedentesMorbidos')} placeholder="Histórico de doenças..." />
            </div>
            <div className={styles.field}>
              <label>Medicamentos</label>
              <textarea rows={4} {...register('medicamentos')} placeholder="Medicamentos em uso..." />
            </div>
            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
              <label>Outros</label>
              <textarea rows={3} {...register('outros')} placeholder="Atividade física, acompanhamento profissional..." />
            </div>
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => {
                setFormAberto(false);
                setEditandoId(null);
                reset();
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={salvarMutation.isPending}
            >
              {salvarMutation.isPending
                ? 'Salvando...'
                : editandoId
                  ? 'Salvar Alterações'
                  : 'Salvar Evolução'}
            </button>
          </div>
        </form>
      )}

      {evolucoes.length === 0 && !formAberto ? (
        <div className={styles.empty}>
          Nenhuma evolução clínica registrada.
        </div>
      ) : (
        <div className={styles.timeline}>
          {secaoData.map((secao) => (
            <div key={secao.key} className={styles.timelineItem}>
              <div
                className={`${styles.timelineIcon} ${styles[secao.colorClass]}`}
              >
                <HugeiconsIcon icon={secao.icon} size={15} strokeWidth={2} />
              </div>
              <h4 className={styles.timelineLabel}>{secao.label}</h4>
              <div
                className={`${styles.timelineContent} ${!secao.hasContent ? styles.timelineContentEmpty : ''
                  }`}
              >
                {secao.hasContent ? (
                  secao.registros.map((reg: any) => (
                    <div key={`${secao.key}-${reg.id}`} className={styles.timelineEntry}>
                      <div className={styles.timelineEntryHeader}>
                        <span className={styles.timelineEntryDate}>{reg.dataFormatada}</span>
                        <div className={styles.timelineEntryActions}>
                          <button
                            type="button"
                            className={styles.medidaEditBtn}
                            title="Editar esta evolução"
                            onClick={() => iniciarEdicao(reg.evolucao)}
                          >
                            <HugeiconsIcon icon={PencilEdit01Icon} size={14} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            className={styles.medidaActionBtn}
                            title="Excluir esta evolução"
                            onClick={() => {
                              if (confirm('Excluir este registro de evolução clínica?')) {
                                excluirMutation.mutate(reg.id);
                              }
                            }}
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                      <p>{reg.texto}</p>
                    </div>
                  ))
                ) : (
                  <p>Nenhum registro</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
