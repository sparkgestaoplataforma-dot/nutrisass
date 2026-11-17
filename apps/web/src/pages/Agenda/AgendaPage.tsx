import { useState, useCallback, useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  PlusSignIcon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
} from '@hugeicons/core-free-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listarApenasNutricionistas } from '@/services/usuario';
import {
  useAgendaDia,
  useCriarAgendamento,
  useEditarAgendamento,
  useAlterarStatus,
  useExcluirAgendamento,
} from './hooks/useAgenda';
import { useSocket, useSocketEvent } from '@/hooks/useSocket';
import { SOCKET_EVENTS } from '@nutricao/shared';
import { TabelaAgenda } from './components/TabelaAgenda';
import { AgendamentoModal } from './components/AgendamentoModal';
import { ConflictConfirmModal } from '@/components/ConflictConfirmModal/ConflictConfirmModal';
import type { AgendamentoResponse } from '@/services/agenda';
import type { CreateAgendamentoInput } from '@nutricao/shared';
import styles from './AgendaPage.module.scss';
import { useAuthStore } from "@/stores/authStore";
import { useIsAutonomo } from "@/hooks/useIsAutonomo";

function formatDate(date: Date) {
  return date.toLocaleDateString('sv-SE');
}
export function AgendaPage() {
  const { user } = useAuthStore();
  const isAutonomo = useIsAutonomo();

  const [dataSelecionada, setDataSelecionada] = useState(formatDate(new Date()));
  const [nutricionistaId, setNutricionistaId] = useState(
    (user?.perfil === 'SECRETARIA' || user?.perfil === 'ADMIN') ? "" : (user?.userId || "")
  );
  const [modalAberto, setModalAberto] = useState(false);
  const [agendamentoEditando, setAgendamentoEditando] =
    useState<AgendamentoResponse | null>(null);
  const [toastSucesso, setToastSucesso] = useState<string | null>(null);

  useEffect(() => {
    if (!toastSucesso) return;
    const timer = setTimeout(() => {
      setToastSucesso(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toastSucesso]);

  // States for conflict modal
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictTitle, setConflictTitle] = useState("");
  const [conflictDescription, setConflictDescription] = useState("");
  const [onConfirmConflict, setOnConfirmConflict] = useState<() => void>(() => { });

  const { data: nutricionistas = [] } = useQuery({
    queryKey: ['nutricionistas-list', user?.clinicaId],
    queryFn: () => listarApenasNutricionistas(user!.clinicaId),
    enabled: !!user?.clinicaId,
  });

  const { data: agendamentos = [], isLoading } = useAgendaDia(dataSelecionada, nutricionistaId);
  const criarMutation = useCriarAgendamento(dataSelecionada);
  const editarMutation = useEditarAgendamento(dataSelecionada);
  const statusMutation = useAlterarStatus(dataSelecionada);
  const excluirMutation = useExcluirAgendamento(dataSelecionada);

  const queryClient = useQueryClient();
  const { socketRef } = useSocket();

  const handleSocketUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['agenda', dataSelecionada] });
  }, [queryClient, dataSelecionada]);

  useSocketEvent(socketRef, SOCKET_EVENTS.AGENDA_NOVO, handleSocketUpdate);
  useSocketEvent(socketRef, SOCKET_EVENTS.AGENDA_ATUALIZADO, handleSocketUpdate);
  useSocketEvent(socketRef, SOCKET_EVENTS.AGENDA_STATUS, handleSocketUpdate);
  useSocketEvent(socketRef, SOCKET_EVENTS.AGENDA_EXCLUIDO, handleSocketUpdate);

  function navigateDate(days: number) {
    const d = new Date(dataSelecionada + 'T12:00:00');
    d.setDate(d.getDate() + days);
    setDataSelecionada(formatDate(d));
  }

  function handleSubmit(
    data: CreateAgendamentoInput,
    pacienteCriado?: { id: string; nome: string }
  ) {
    const handleMutationError = (error: any, variables: any, isEdit: boolean) => {
      if (pacienteCriado?.nome) {
        setToastSucesso(`Paciente "${pacienteCriado.nome}" cadastrado com sucesso!`);
      }
      const errorMessage = error.response?.data?.message || error.message || "";
      if (errorMessage.includes("Já existe um agendamento ativo")) {
        const targetNutriId = isEdit
          ? (variables.nutricionistaId || agendamentoEditando?.nutricionistaId)
          : variables.nutricionistaId;
        const nutricionistaNome = nutricionistas.find((n: any) => n.id === targetNutriId)?.nome || "o nutricionista";

        let horaFormatada = "";
        try {
          const date = new Date(variables.dataHora);
          horaFormatada = new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
          }).format(date);
        } catch {
          horaFormatada = variables.dataHora;
        }

        setConflictTitle("Conflito de Horário");
        setConflictDescription(
          `O(A) nutricionista ${nutricionistaNome} já possui um agendamento ativo para o horário ${horaFormatada}.`
        );
        setOnConfirmConflict(() => () => {
          setConflictModalOpen(false);
          const inputComEncaixe = { ...variables, encaixe: true };
          if (isEdit) {
            editarMutation.mutate(
              { id: agendamentoEditando!.id, input: inputComEncaixe },
              {
                onSuccess: () => {
                  setModalAberto(false);
                  setAgendamentoEditando(null);
                  setToastSucesso('Agendamento atualizado com sucesso!');
                },
                onError: (err: any) => {
                  alert(err.response?.data?.message || "Ocorreu um erro ao salvar o encaixe.");
                }
              }
            );
          } else {
            criarMutation.mutate(inputComEncaixe, {
              onSuccess: () => {
                setModalAberto(false);
                if (pacienteCriado?.nome) {
                  setToastSucesso(`Paciente "${pacienteCriado.nome}" cadastrado e agendamento confirmado com sucesso!`);
                } else {
                  setToastSucesso('Agendamento realizado com sucesso!');
                }
              },
              onError: (err: any) => {
                alert(err.response?.data?.message || "Ocorreu um erro ao criar o encaixe.");
              }
            });
          }
        });
        setConflictModalOpen(true);
      } else {
        alert(errorMessage || "Ocorreu um erro ao processar o agendamento.");
      }
    };

    if (agendamentoEditando) {
      editarMutation.mutate(
        { id: agendamentoEditando.id, input: data },
        {
          onSuccess: () => {
            setModalAberto(false);
            setAgendamentoEditando(null);
            setToastSucesso('Agendamento atualizado com sucesso!');
          },
          onError: (error, variables) => {
            handleMutationError(error, variables.input, true);
          }
        },
      );
    } else {
      criarMutation.mutate(data, {
        onSuccess: () => {
          setModalAberto(false);
          if (pacienteCriado?.nome) {
            setToastSucesso(`Paciente "${pacienteCriado.nome}" cadastrado e agendamento confirmado com sucesso!`);
          } else {
            setToastSucesso('Agendamento realizado com sucesso!');
          }
        },
        onError: (error, variables) => {
          handleMutationError(error, variables, false);
        }
      });
    }
  }

  function handleChangeStatus(id: string, status: string) {
    statusMutation.mutate(
      { id, input: { status: status as any } },
      {
        onError: (err: any) => {
          alert(err.response?.data?.message || "Ocorreu um erro ao alterar o status do agendamento.");
        },
      }
    );
  }

  function handleEdit(ag: AgendamentoResponse) {
    setAgendamentoEditando(ag);
    setModalAberto(true);
  }

  function handleDelete(id: string) {
    if (confirm('Deseja realmente excluir este agendamento?')) {
      excluirMutation.mutate(id);
    }
  }

  const totalAgendados = agendamentos.length;
  const totalPresentes = agendamentos.filter(
    (a) => a.status === 'PRESENTE' || a.status === 'REALIZADO',
  ).length;
  const totalCancelados = agendamentos.filter(
    (a) => a.status === 'CANCELADO' || a.status === 'DESISTIU',
  ).length;

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.dateNav}>
          <button className={styles.dateBtn} onClick={() => navigateDate(-1)}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={1.8} />
          </button>
          <input
            type="date"
            className={styles.dateInput}
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
          />
          <button className={styles.dateBtn} onClick={() => navigateDate(1)}>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={1.8} />
          </button>
          <button
            className={styles.todayBtn}
            onClick={() => setDataSelecionada(formatDate(new Date()))}
          >
            Hoje
          </button>

          {!isAutonomo && (
            <div className={styles.nutriFilter}>
              <select
                id="nutricionista-filter"
                className={styles.nutriSelect}
                value={nutricionistaId}
                onChange={(e) => setNutricionistaId(e.target.value)}
              >
                {(user?.perfil === 'SECRETARIA' || user?.perfil === 'ADMIN') && <option value="">Todos os Nutricionistas</option>}
                {nutricionistas.map((n: any) => (
                  <option key={n.id} value={n.id}>{n.nome}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          className={styles.agendarBtn}
          onClick={() => {
            setAgendamentoEditando(null);
            setModalAberto(true);
          }}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} /> Agendar
        </button>
      </div>

      {toastSucesso && (
        <div className={styles.toastSucesso}>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} className={styles.toastIcon} />
          <span>{toastSucesso}</span>
          <button
            type="button"
            className={styles.toastCloseBtn}
            onClick={() => setToastSucesso(null)}
            title="Fechar"
          >
            <HugeiconsIcon icon={CancelCircleIcon} size={16} />
          </button>
        </div>
      )}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <strong>{totalAgendados}</strong>
          <span>Agendados</span>
        </div>
        <div className={styles.stat}>
          <strong>{totalPresentes}</strong>
          <span>Presentes</span>
        </div>
        <div className={styles.stat}>
          <strong>{totalCancelados}</strong>
          <span>Cancelados</span>
        </div>
      </div>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <TabelaAgenda
          agendamentos={agendamentos}
          onChangeStatus={handleChangeStatus}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {modalAberto && user && (
        <AgendamentoModal
          dataSelecionada={dataSelecionada}
          agendamento={agendamentoEditando}
          onSubmit={handleSubmit}
          onClose={() => {
            setModalAberto(false);
            setAgendamentoEditando(null);
          }}
          isPending={criarMutation.isPending || editarMutation.isPending}
          user={user}
        />
      )}

      <ConflictConfirmModal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        onConfirm={onConfirmConflict}
        title={conflictTitle}
        description={conflictDescription}
        isPending={criarMutation.isPending || editarMutation.isPending}
      />
    </div>
  );
}
