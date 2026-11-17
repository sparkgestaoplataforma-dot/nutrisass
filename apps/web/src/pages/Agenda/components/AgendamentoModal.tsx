import { useEffect, useState, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CancelCircleIcon,
  UserAdd01Icon,
  Search01Icon,
  ArrowDown01Icon,
  Tick01Icon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';
import { createAgendamentoSchema, type CreateAgendamentoInput, type TokenPayload } from '@nutricao/shared';
import { listarPacientes, criarPaciente } from '@/services/pacientes';
import { listarApenasNutricionistas } from '@/services/usuario';
import { listarConvenios } from '@/services/convenios';
import type { AgendamentoResponse } from '@/services/agenda';
import { formatarParaInputDateTime } from '@/utils/date';
import { formatarTelefone, limparTelefone, obterMascaraTelefone } from '@/utils/phone';
import { PatternFormat } from 'react-number-format';
import styles from './AgendamentoModal.module.scss';
import { useIsAutonomo } from '@/hooks/useIsAutonomo';

interface NovoPacienteForm {
  nome: string;
  cpf: string;
  telefone: string;
  whatsapp: string;
  dataNascimento: string;
  numeroCarteira: string;
}

const NOVO_PACIENTE_VAZIO: NovoPacienteForm = {
  nome: '',
  cpf: '',
  telefone: '',
  whatsapp: '',
  dataNascimento: '',
  numeroCarteira: '',
};

interface AgendamentoModalProps {
  dataSelecionada: string;
  agendamento?: AgendamentoResponse | null;
  onSubmit: (data: CreateAgendamentoInput, pacienteCriado?: { id: string; nome: string }) => void;
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
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [pacienteRecemCadastrado, setPacienteRecemCadastrado] = useState<{ id: string; nome: string } | null>(null);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setDropdownAberto(false);
        setBuscaPaciente('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // Garante que o paciente selecionado continue na lista mesmo quando a busca o filtra
  const pacientesOpcoes = useMemo(() => {
    const lista = pacientesData?.data ?? [];
    const resultado = [...lista];
    if (agendamento && !resultado.some((p) => p.id === agendamento.pacienteId)) {
      resultado.unshift({ id: agendamento.pacienteId, nome: agendamento.paciente.nome } as any);
    }
    if (pacienteRecemCadastrado && !resultado.some((p) => p.id === pacienteRecemCadastrado.id)) {
      resultado.unshift({ id: pacienteRecemCadastrado.id, nome: pacienteRecemCadastrado.nome } as any);
    }
    return resultado;
  }, [pacientesData?.data, agendamento, pacienteRecemCadastrado]);

  const pacienteSelecionado = useMemo(() => {
    if (!pacienteIdSelecionado) return null;
    const encontrado = pacientesOpcoes.find((p) => p.id === pacienteIdSelecionado);
    if (encontrado) return encontrado;
    if (agendamento && agendamento.pacienteId === pacienteIdSelecionado) {
      return agendamento.paciente;
    }
    if (pacienteRecemCadastrado && pacienteRecemCadastrado.id === pacienteIdSelecionado) {
      return pacienteRecemCadastrado;
    }
    return null;
  }, [pacienteIdSelecionado, pacientesOpcoes, agendamento, pacienteRecemCadastrado]);

  function atualizarNovoPaciente<K extends keyof NovoPacienteForm>(campo: K, valor: string) {
    setNovoPaciente((prev) => ({ ...prev, [campo]: valor }));
  }

  async function cadastrarPacienteRapido(): Promise<{ id: string; nome: string } | null> {
    const nome = novoPaciente.nome.trim();
    if (nome.length < 2) {
      setErroNovoPaciente('Informe o nome do paciente (mínimo 2 caracteres).');
      return null;
    }

    const cpfDigits = (novoPaciente.cpf || '').replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      setErroNovoPaciente('Informe um CPF válido com 11 dígitos.');
      return null;
    }

    const zapDigits = limparTelefone(novoPaciente.whatsapp);
    if (zapDigits.length < 10) {
      setErroNovoPaciente('Informe o WhatsApp com DDD (mínimo 10 dígitos).');
      return null;
    }

    const telDigits = limparTelefone(novoPaciente.telefone);
    if (telDigits.length > 0 && telDigits.length < 10) {
      setErroNovoPaciente('Telefone incompleto (informe DDD + número).');
      return null;
    }

    const payload: Record<string, string> = {
      nome,
      cpf: novoPaciente.cpf.trim(),
      whatsapp: formatarTelefone(zapDigits),
    };
    if (telDigits) payload.telefone = formatarTelefone(telDigits);
    if (novoPaciente.dataNascimento) payload.dataNascimento = novoPaciente.dataNascimento;
    // Vincula o convênio escolhido no agendamento ao cadastro do paciente
    if (convenioIdSelecionado) {
      payload.convenioId = convenioIdSelecionado;
      if (novoPaciente.numeroCarteira.trim()) payload.numeroCarteira = novoPaciente.numeroCarteira.trim();
    }

    try {
      setSalvandoPaciente(true);
      setErroNovoPaciente(null);
      const criado = (await criarPaciente(payload)) as { id: string; nome: string };

      // Deixa o paciente recém-criado selecionado; se o agendamento falhar, não duplica o cadastro
      queryClient.setQueryData(['pacientes-select', ''], (prev: any) =>
        prev ? { ...prev, data: [criado, ...prev.data] } : prev,
      );
      queryClient.invalidateQueries({ queryKey: ['pacientes-select'] });
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      setBuscaPaciente('');
      setCadastrandoPaciente(false);
      setNovoPaciente(NOVO_PACIENTE_VAZIO);
      setPacienteRecemCadastrado(criado);
      setValue('pacienteId', criado.id, { shouldValidate: true });
      return criado;
    } catch (err: any) {
      setErroNovoPaciente(err?.response?.data?.message || 'Erro ao cadastrar paciente.');
      return null;
    } finally {
      setSalvandoPaciente(false);
    }
  }

  async function handleApenasCadastrarPaciente() {
    await cadastrarPacienteRapido();
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    let criado: { id: string; nome: string } | null = null;
    if (cadastrandoPaciente) {
      criado = await cadastrarPacienteRapido();
      if (!criado) return;
    }
    handleSubmit((data) => {
      onSubmit(data, criado || pacienteRecemCadastrado || undefined);
    })();
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
                      if (!cadastrandoPaciente && buscaPaciente) {
                        setNovoPaciente((prev) => ({ ...prev, nome: buscaPaciente }));
                      }
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

              {pacienteRecemCadastrado && !cadastrandoPaciente && (
                <div className={styles.sucessoCadastroBox}>
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className={styles.sucessoIcon} />
                  <div className={styles.sucessoTexto}>
                    <strong>Paciente cadastrado com sucesso!</strong>
                    <span>"{pacienteRecemCadastrado.nome}" já está selecionado para o agendamento.</span>
                  </div>
                  <button
                    type="button"
                    className={styles.sucessoCloseBtn}
                    onClick={() => setPacienteRecemCadastrado(null)}
                    title="Dispensar aviso"
                  >
                    <HugeiconsIcon icon={CancelCircleIcon} size={14} />
                  </button>
                </div>
              )}

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
                      <label className={styles.miniLabel}>CPF *</label>
                      <PatternFormat
                        placeholder="000.000.000-00"
                        format="###.###.###-##"
                        value={novoPaciente.cpf}
                        onValueChange={(values) => {
                          atualizarNovoPaciente('cpf', values.value);
                        }}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.miniLabel}>WhatsApp *</label>
                      <PatternFormat
                        placeholder="(00) 00000-0000"
                        format={obterMascaraTelefone(novoPaciente.whatsapp)}
                        value={novoPaciente.whatsapp}
                        onValueChange={(values) => {
                          atualizarNovoPaciente('whatsapp', limparTelefone(values.value));
                        }}
                      />
                    </div>
                  </div>
                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label className={styles.miniLabel}>Telefone</label>
                      <PatternFormat
                        placeholder="(00) 0000-0000"
                        format={obterMascaraTelefone(novoPaciente.telefone)}
                        value={novoPaciente.telefone}
                        onValueChange={(values) => {
                          atualizarNovoPaciente('telefone', limparTelefone(values.value));
                        }}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.miniLabel}>Data de nascimento</label>
                      <input
                        type="date"
                        value={novoPaciente.dataNascimento}
                        onChange={(e) => atualizarNovoPaciente('dataNascimento', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.row}>
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
                  <div className={styles.novoPacienteFooter}>
                    <span className={styles.novoPacienteHint}>
                      Os demais dados podem ser completados depois na ficha do paciente.
                    </span>
                    <button
                      type="button"
                      className={styles.salvarPacienteBtn}
                      onClick={handleApenasCadastrarPaciente}
                      disabled={salvandoPaciente}
                      title="Cadastra apenas o paciente e já o deixa selecionado"
                    >
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                      {salvandoPaciente ? 'Cadastrando...' : 'Cadastrar paciente'}
                    </button>
                  </div>
                  {erroNovoPaciente && <span className={styles.error}>{erroNovoPaciente}</span>}
                </div>
              ) : (
                <div className={styles.comboboxWrapper} ref={comboboxRef}>
                  <div
                    className={`${styles.comboboxInput} ${dropdownAberto ? styles.focused : ''} ${errors.pacienteId ? styles.hasError : ''}`}
                    onClick={() => {
                      setDropdownAberto(true);
                      inputRef.current?.focus();
                    }}
                  >
                    <HugeiconsIcon icon={Search01Icon} size={16} className={styles.searchIcon} />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={pacienteSelecionado ? pacienteSelecionado.nome : "Buscar ou selecionar paciente..."}
                      value={dropdownAberto ? buscaPaciente : (pacienteSelecionado?.nome || '')}
                      onChange={(e) => {
                        setBuscaPaciente(e.target.value);
                        if (!dropdownAberto) setDropdownAberto(true);
                      }}
                      onFocus={() => {
                        setDropdownAberto(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setDropdownAberto(false);
                          setBuscaPaciente('');
                        } else if (e.key === 'Enter') {
                          if (dropdownAberto && pacientesOpcoes.length > 0) {
                            e.preventDefault();
                            const primeiro = pacientesOpcoes[0];
                            setValue('pacienteId', primeiro.id, { shouldValidate: true });
                            setBuscaPaciente('');
                            setDropdownAberto(false);
                          }
                        }
                      }}
                    />
                    <div className={styles.comboboxActions}>
                      {pacienteIdSelecionado && (
                        <button
                          type="button"
                          className={styles.clearBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setValue('pacienteId', '', { shouldValidate: true });
                            setBuscaPaciente('');
                            inputRef.current?.focus();
                          }}
                          title="Limpar seleção"
                        >
                          <HugeiconsIcon icon={CancelCircleIcon} size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        className={`${styles.chevronBtn} ${dropdownAberto ? styles.rotated : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDropdownAberto((prev) => !prev);
                        }}
                        tabIndex={-1}
                      >
                        <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
                      </button>
                    </div>
                  </div>

                  {dropdownAberto && (
                    <div className={styles.dropdownList}>
                      {pacientesOpcoes.length > 0 ? (
                        pacientesOpcoes.map((p) => {
                          const isSelected = p.id === pacienteIdSelecionado;
                          return (
                            <div
                              key={p.id}
                              className={`${styles.dropdownItem} ${isSelected ? styles.selected : ''}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setValue('pacienteId', p.id, { shouldValidate: true });
                                setBuscaPaciente('');
                                setDropdownAberto(false);
                              }}
                            >
                              <div className={styles.dropdownItemContent}>
                                <span className={styles.dropdownItemNome}>{p.nome}</span>
                                {(p.telefone || p.email) && (
                                  <span className={styles.dropdownItemMeta}>
                                    {p.telefone || p.email}
                                  </span>
                                )}
                              </div>
                              {isSelected && (
                                <HugeiconsIcon icon={Tick01Icon} size={16} className={styles.itemCheck} />
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className={styles.dropdownEmpty}>
                          <p>Nenhum paciente encontrado{buscaPaciente ? ` para "${buscaPaciente}"` : ''}.</p>
                          <button
                            type="button"
                            className={styles.dropdownNovoPacienteBtn}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setNovoPaciente((prev) => ({ ...prev, nome: buscaPaciente }));
                              setCadastrandoPaciente(true);
                              setDropdownAberto(false);
                            }}
                          >
                            <HugeiconsIcon icon={UserAdd01Icon} size={14} />
                            Cadastrar "{buscaPaciente || 'Novo paciente'}"
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hidden select to preserve form registration and e2e test compatibility */}
                  <select
                    {...register('pacienteId')}
                    value={pacienteIdSelecionado ?? ''}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <option value="">Selecione um paciente</option>
                    {pacientesOpcoes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>

                  {errors.pacienteId && (
                    <span className={styles.error}>{errors.pacienteId.message}</span>
                  )}
                </div>
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
