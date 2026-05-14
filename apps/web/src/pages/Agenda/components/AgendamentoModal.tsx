import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import { CancelCircleIcon } from '@hugeicons/core-free-icons';
import { createAgendamentoSchema, type CreateAgendamentoInput, type TokenPayload } from '@nutricao/shared';
import { listarPacientes } from '@/services/pacientes';
import { listarApenasNutricionistas } from '@/services/usuario';
import { listarConvenios } from '@/services/convenios';
import type { AgendamentoResponse } from '@/services/agenda';
import { formatarParaInputDateTime } from '@/utils/date';
import styles from './AgendamentoModal.module.scss';

interface AgendamentoModalProps {
  dataSelecionada: string;
  agendamento?: AgendamentoResponse | null;
  onSubmit: (data: CreateAgendamentoInput) => void;
  onClose: () => void;
  isPending: boolean;
  user: TokenPayload;
}

export function AgendamentoModal({
  dataSelecionada,
  agendamento,
  onSubmit,
  onClose,
  isPending,
  user
}: AgendamentoModalProps) {
  const { data: pacientesData } = useQuery({
    queryKey: ['pacientes-select'],
    queryFn: () => listarPacientes(),
  });


  const { data: nutricionistasData } = useQuery({
    queryKey: ['nutricionista-select', user?.clinicaId],
    queryFn: () => listarApenasNutricionistas(user!.clinicaId)

});


  console.log("dados do nutricionista:", nutricionistasData);

  const { data: convenios } = useQuery({
    queryKey: ['convenios-select'],
    queryFn: () => listarConvenios(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAgendamentoInput>({
    resolver: zodResolver(createAgendamentoSchema),
    defaultValues: {
      tipo: 'CONSULTA',
      status: 'AGENDADO',
      encaixe: false,
      usuarioId: user?.userId,
      nutricionistaId: user?.userId,
    },
  });

  useEffect(() => {
    if (agendamento) {
      reset({
        pacienteId: agendamento.pacienteId,
        convenioId: agendamento.convenio?.id || undefined,
        dataHora: formatarParaInputDateTime(agendamento.dataHora),
        tipo: agendamento.tipo as 'CONSULTA' | 'RETORNO',
        status: agendamento.status as any,
        encaixe: agendamento.encaixe,
        observacao: agendamento.observacao || undefined,
        usuarioId: user?.userId,
        nutricionistaId: agendamento.nutricionistaId,
      });
    } else {
      const idUnico = (nutricionistasData?.length === 1 ? nutricionistasData[0].id : undefined) || "";
      reset({
        tipo: 'CONSULTA',
        status: 'AGENDADO',
        encaixe: false,
        dataHora: `${dataSelecionada}T08:00`,
        usuarioId: user?.userId || "",
        nutricionistaId: idUnico,
      });
    }
  }, [agendamento, dataSelecionada, reset, user?.userId, nutricionistasData]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{agendamento ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <HugeiconsIcon icon={CancelCircleIcon} size={18} strokeWidth={1.8} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.body}>
            <div className={styles.field}>
              <label>Paciente</label>
              <select {...register('pacienteId')}>
                <option value="">Selecione um paciente</option>
                {pacientesData?.data.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              {errors.pacienteId && (
                <span className={styles.error}>{errors.pacienteId.message}</span>
              )}
            </div>

            <div className={styles.field}>
              <label>Nutricionista</label>
              <select {...register('nutricionistaId')}>
                <option value="" >Selecione um nutricionista</option>
                {nutricionistasData?.map((profissional) => (
                  <option key={profissional.id} value={profissional.id}>
                        {profissional.nome}
                  </option>
                ))}
              </select>
              {errors.nutricionistaId && (
                <span className={styles.error}>{errors.nutricionistaId.message}</span>
              )}
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Data e Hora</label>
                <input type="datetime-local" {...register('dataHora')} />
                {errors.dataHora && (
                  <span className={styles.error}>{errors.dataHora.message}</span>
                )}
              </div>

              <div className={styles.field}>
                <label>Tipo</label>
                <select {...register('tipo')}>
                  <option value="CONSULTA">Consulta</option>
                  <option value="RETORNO">Retorno</option>
                </select>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Convênio</label>
                <select {...register('convenioId')}>
                  <option value="">Particular</option>
                  {convenios?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Status</label>
                <select {...register('status')}>
                  <option value="AGENDADO">Agendado</option>
                  <option value="CONFIRMOU">Confirmou</option>
                  <option value="PRESENTE">Presente</option>
                  <option value="ENCAIXE">Encaixe</option>
                  <option value="CANCELADO">Cancelado</option>
                  <option value="NAO_COMPARECEU">Não Compareceu</option>
                  <option value="REALIZADO">Realizado</option>
                  <option value="DESISTIU">Desistiu</option>
                  <option value="REMARCOU">Remarcou</option>
                </select>
              </div>
            </div>

            <div className={styles.checkField}>
              <input type="checkbox" id="encaixe" {...register('encaixe')} />
              <label htmlFor="encaixe">Encaixe</label>
            </div>

            <div className={styles.field}>
              <label>Observação</label>
              <textarea
                placeholder="Observações sobre o agendamento..."
                {...register('observacao')}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isPending}>
              {isPending ? 'Salvando...' : agendamento ? 'Salvar' : 'Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
