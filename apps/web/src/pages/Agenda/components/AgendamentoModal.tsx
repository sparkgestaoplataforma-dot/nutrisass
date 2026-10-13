import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import { CancelCircleIcon, UserAdd01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { createAgendamentoSchema, type CreateAgendamentoInput, type TokenPayload } from '@nutricao/shared';
import { listarPacientes } from '@/services/pacientes';
import { listarApenasNutricionistas } from '@/services/usuario';
import { listarConvenios } from '@/services/convenios';
import { api } from '@/services/api';
import type { AgendamentoResponse } from '@/services/agenda';
import { formatarParaInputDateTime } from '@/utils/date';
import styles from './AgendamentoModal.module.scss';
import { useIsAutonomo } from '@/hooks/useIsAutonomo';

interface NovoPacienteForm {
  nome: string;
  telefone: string;
  whatsapp: string;
  dataNascimento: string;
  numeroCarteira: string;
}

const NOVO_PACIENTE_VAZIO: NovoPacienteForm = {
  nome: '',
  telefone: '',
  whatsapp: '',
  dataNascimento: '',
  numeroCarteira: '',
};

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
  const isAutonomo = useIsAutonomo();
  const queryClient = useQueryClient();
  const [buscaPaciente, setBuscaPaciente] = useState('');
  const [cadastrandoPaciente, setCadastrandoPaciente] = useState(false);
  const [novoPaciente, setNovoPaciente] = useState<NovoPacienteForm>(NOVO_PACIENTE_VAZIO);
  const [erroNovoPaciente, setErroNovoPaciente] = useState<string | null>(null);
  const [salvandoPaciente, setSalvandoPaciente] = useState(false);

  const { data: pacientesData } = useQuery({
    queryKey: ['pacientes-select', buscaPaciente],
    queryFn: () => listarPacientes(buscaPaciente || undefined),
    placeholderData: (prev) => prev,
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
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateAgendamentoInput>({
    resolver: zodResolver(createAgendamentoSchema),
    defaultValues: {
      tipo: 'CONSULTA',
      status: 'AGENDADO',
      encaixe: false,
      criadoPorUsuarioId: user?.userId,
      nutricionistaId: user?.userId,
    },
  });

  const pacienteIdSelecionado = watch('pacienteId');
  const convenioIdSelecionado = watch('convenioId');

  // Garante que o paciente selecionado continue no <select> mesmo quando a busca o filtra
  const pacientesOpcoes = (() => {
    const lista = pacientesData?.data ?? [];
    if (agendamento && !lista.some((p) => p.id === agendamento.pacienteId)) {
      return [{ id: agendamento.pacienteId, nome: agendamento.paciente.nome } as any, ...lista];
    }
    return lista;
  })();

  function atualizarNovoPaciente<K extends keyof NovoPacienteForm>(campo: K, valor: string) {
    setNovoPaciente((prev) => ({ ...prev, [campo]: valor }));
  }

  async function cadastrarPacienteRapido(): Promise<string | null> {
    const nome = novoPaciente.nome.trim();
    if (nome.length < 2) {
      setErroNovoPaciente('Informe o nome do paciente (mínimo 2 caracteres).');
      return null;
    }

    const payload: Record<string, string> = { nome };
    if (novoPaciente.telefone.trim()) payload.telefone = novoPaciente.telefone.trim();
    if (novoPaciente.whatsapp.trim()) payload.whatsapp = novoPaciente.whatsapp.trim();
    if (novoPaciente.dataNascimento) payload.dataNascimento = novoPaciente.dataNascimento;
    // Vincula o convênio escolhido no agendamento ao cadastro do paciente
    if (convenioIdSelecionado) {
      payload.convenioId = convenioIdSelecionado;
      if (novoPaciente.numeroCarteira.trim()) payload.numeroCarteira = novoPaciente.numeroCarteira.trim();
    }

    try {
      setSalvandoPaciente(true);
      setErroNovoPaciente(null);
      const { data } = await api.post('/pacientes', payload);
      const criado = data.data as { id: string; nome: string };

      // Deixa o paciente recém-criado selecionado; se o agendamento falhar, não duplica o cadastro
      queryClient.setQueryData(['pacientes-select', ''], (prev: any) =>
        prev ? { ...prev, data: [criado, ...prev.data] } : prev,
      );
      queryClient.invalidateQueries({ queryKey: ['pacientes-select'] });
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      setBuscaPaciente('');
      setCadastrandoPaciente(false);
      setNovoPaciente(NOVO_PACIENTE_VAZIO);
      setValue('pacienteId', criado.id, { shouldValidate: true });
      return criado.id;
    } catch (err: any) {
      setErroNovoPaciente(err?.response?.data?.message || 'Erro ao cadastrar paciente.');
      return null;
    } finally {
      setSalvandoPaciente(false);
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cadastrandoPaciente) {
      const id = await cadastrarPacienteRapido();
      if (!id) return;
    }
    handleSubmit(onSubmit)();
  }

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
        criadoPorUsuarioId: user?.userId,
        nutricionistaId: agendamento.nutricionistaId,
      });
    } else {
      const idUnico = (user?.perfil === 'NUTRICIONISTA' ? user?.userId : (nutricionistasData?.length === 1 ? nutricionistasData[0].id : undefined)) || "";
      reset({
        tipo: 'CONSULTA',
        status: 'AGENDADO',
        encaixe: false,
        dataHora: `${dataSelecionada}T08:00`,
        criadoPorUsuarioId: user?.userId || "",
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

        <form onSubmit={handleFormSubmit}>
          <div className={styles.body}>
            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label>Paciente</label>
                {!agendamento && (
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => {
                      setCadastrandoPaciente((v) => !v);
                      setErroNovoPaciente(null);
                    }}
                  >
                    {cadastrandoPaciente ? (
                      'Selecionar paciente existente'
                    ) : (
                      <>
                        <HugeiconsIcon icon={UserAdd01Icon} size={14} strokeWidth={2} />
                        Novo paciente
                      </>
                    )}
                  </button>
                )}
              </div>

              {cadastrandoPaciente ? (
                <div className={styles.novoPacienteBox}>
                  <span className={styles.novoPacienteTitle}>Cadastro rápido</span>
                  <div className={styles.field}>
                    <input
                      autoFocus
                      placeholder="Nome completo *"
                      value={novoPaciente.nome}
                      onChange={(e) => atualizarNovoPaciente('nome', e.target.value)}
                    />
                  </div>
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <input
                        placeholder="Telefone"
                        value={novoPaciente.telefone}
                        onChange={(e) => atualizarNovoPaciente('telefone', e.target.value)}
                      />
                    </div>
                    <div className={styles.field}>
                      <input
                        placeholder="WhatsApp"
                        value={novoPaciente.whatsapp}
                        onChange={(e) => atualizarNovoPaciente('whatsapp', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className={styles.miniLabel}>Data de nascimento</label>
                      <input
                        type="date"
                        value={novoPaciente.dataNascimento}
                        onChange={(e) => atualizarNovoPaciente('dataNascimento', e.target.value)}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.miniLabel}>Nº da carteira</label>
                      <input
                        placeholder={convenioIdSelecionado ? 'Carteirinha do convênio' : 'Selecione um convênio'}
                        disabled={!convenioIdSelecionado}
                        value={novoPaciente.numeroCarteira}
                        onChange={(e) => atualizarNovoPaciente('numeroCarteira', e.target.value)}
                      />
                    </div>
                  </div>
                  <span className={styles.novoPacienteHint}>
                    Os demais dados podem ser completados depois na ficha do paciente.
                  </span>
                  {erroNovoPaciente && <span className={styles.error}>{erroNovoPaciente}</span>}
                </div>
              ) : (
                <>
                  {!agendamento && (
                    <div className={styles.searchInput}>
                      <HugeiconsIcon icon={Search01Icon} size={14} strokeWidth={2} />
                      <input
                        placeholder="Buscar paciente por nome, e-mail ou telefone..."
                        value={buscaPaciente}
                        onChange={(e) => setBuscaPaciente(e.target.value)}
                      />
                    </div>
                  )}
                  <select {...register('pacienteId')} value={pacienteIdSelecionado ?? ''}>
                    <option value="">
                      {pacientesOpcoes.length === 0 && buscaPaciente
                        ? 'Nenhum paciente encontrado'
                        : 'Selecione um paciente'}
                    </option>
                    {pacientesOpcoes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                  {errors.pacienteId && (
                    <span className={styles.error}>{errors.pacienteId.message}</span>
                  )}
                </>
              )}
            </div>

            {!isAutonomo && (
              <div className={styles.field}>
                <label>Nutricionista</label>
                <select
                  {...register('nutricionistaId')}
                  style={{
                    pointerEvents: user?.perfil === 'NUTRICIONISTA' ? 'none' : 'auto',
                    opacity: user?.perfil === 'NUTRICIONISTA' ? 0.7 : 1,
                    backgroundColor: user?.perfil === 'NUTRICIONISTA' ? '#f5f5f5' : 'inherit',
                  }}
                  tabIndex={user?.perfil === 'NUTRICIONISTA' ? -1 : undefined}
                >
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
            )}

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
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isPending || salvandoPaciente}
            >
              {salvandoPaciente
                ? 'Cadastrando paciente...'
                : isPending
                  ? 'Salvando...'
                  : agendamento
                    ? 'Salvar'
                    : cadastrandoPaciente
                      ? 'Cadastrar e agendar'
                      : 'Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
