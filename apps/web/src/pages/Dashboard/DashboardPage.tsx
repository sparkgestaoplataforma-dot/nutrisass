import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  CalendarIcon,
  TickIcon,
  CancelCircleIcon,
  PlusSignIcon,
  ArrowRightIcon,
  PlayCircleIcon,
  ClockIcon,
} from "@hugeicons/core-free-icons";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/services/api";
import { alterarStatus } from "@/services/agenda";
import type { UpdateStatusInput } from "@nutricao/shared";
import { pegarDadosDashboard } from "@/services/dashboard";
import styles from "./DashboardPage.module.scss";

const statusLabels: Record<string, string> = {
  AGENDADO: "Agendado",
  CONFIRMOU: "Confirmou",
  PRESENTE: "Presente",
  ENCAIXE: "Encaixe",
  CANCELADO: "Cancelado",
  NAO_COMPARECEU: "Faltou",
  REALIZADO: "Realizado",
  DESISTIU: "Desistiu",
  REMARCOU: "Remarcou",
};

const statusColors: Record<string, string> = {
  AGENDADO: "blue",
  CONFIRMOU: "green",
  PRESENTE: "green",
  ENCAIXE: "orange",
  CANCELADO: "red",
  NAO_COMPARECEU: "red",
  REALIZADO: "teal",
  DESISTIU: "red",
  REMARCOU: "orange",
};

const tipoLabels: Record<string, string> = {
  CONSULTA: "Consulta",
  RETORNO: "Retorno",
};

// Gera slots de horário das 7h às 20h
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 7; h <= 20; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
  }
  return slots;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [nutricionistaId, setNutricionistaId] = useState<string | undefined>(
    user?.perfil === "SECRETARIA" ? undefined : user?.userId,
  );

  const { data: nutricionistas = [] } = useQuery({
    queryKey: ["nutricionistas-list", user?.clinicaId],
    queryFn: async () => {
      const { data } = await api.get(
        `/usuarios/nutricionistas/clinicaId/${user?.clinicaId}`,
      );
      return data.data;
    },
    enabled: !!user?.clinicaId && user?.perfil === "SECRETARIA",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.clinicaId, nutricionistaId],
    queryFn: () => pegarDadosDashboard(nutricionistaId),
    enabled: !!user?.clinicaId,
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UpdateStatusInput["status"] }) =>
      alterarStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["agenda"] });
    },
  });

  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
      setOpenStatusId(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  if (isLoading || !data) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  const {
    totalPacientes,
    pacientesMes,
    agendaHoje,
    realizadosMes,
    canceladosMes,
    proximosAgendamentos,
  } = data;

  const timeSlots = generateTimeSlots();
  const isNutricionista = user?.perfil === "NUTRICIONISTA";

  // Agrupar agendamentos por hora
  const agendamentosPorHora: Record<string, any[]> = {};
  proximosAgendamentos.forEach((ag: any) => {
    const hora = formatTime(ag.dataHora);
    const horaCheia = hora.split(":")[0] + ":00";
    if (!agendamentosPorHora[horaCheia]) agendamentosPorHora[horaCheia] = [];
    agendamentosPorHora[horaCheia].push(ag);
  });

  return (
    <div className={styles.page}>
      {user?.perfil === "SECRETARIA" && (
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h1>Dashboard da Clínica</h1>
            <p>Visão geral de todos os agendamentos e métricas</p>
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="nutri-select">Filtrar por Nutricionista:</label>
            <select
              id="nutri-select"
              value={nutricionistaId || ""}
              onChange={(e) => setNutricionistaId(e.target.value || undefined)}
              className={styles.nutriSelect}
            >
              <option value="">Todos os Nutricionistas</option>
              {nutricionistas.map((n: any) => (
                <option key={n.id} value={n.id}>
                  {n.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiGreen}`}>
            <HugeiconsIcon icon={UserGroupIcon} size={20} strokeWidth={1.8} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{totalPacientes}</span>
            <span className={styles.kpiLabel}>Pacientes</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiBlue}`}>
            <HugeiconsIcon icon={CalendarIcon} size={20} strokeWidth={1.8} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{agendaHoje}</span>
            <span className={styles.kpiLabel}>Hoje</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiTeal}`}>
            <HugeiconsIcon icon={TickIcon} size={20} strokeWidth={1.8} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{realizadosMes}</span>
            <span className={styles.kpiLabel}>Realizados</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiRed}`}>
            <HugeiconsIcon
              icon={CancelCircleIcon}
              size={20}
              strokeWidth={1.8}
            />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{canceladosMes}</span>
            <span className={styles.kpiLabel}>Cancelados</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIcon} ${styles.kpiPurple}`}>
            <HugeiconsIcon icon={PlusSignIcon} size={20} strokeWidth={1.8} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{pacientesMes}</span>
            <span className={styles.kpiLabel}>Novos (mês)</span>
          </div>
        </div>
      </div>

      {/* Agenda do Dia */}
      <div className={styles.agendaSection}>
        <div className={styles.agendaHeader}>
          <div>
            <h2 className={styles.agendaTitle}>Agenda do Dia</h2>
            <p className={styles.agendaSubtitle}>
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <Link to="/agenda" className={styles.agendaLink}>
            Ver agenda completa
            <HugeiconsIcon icon={ArrowRightIcon} size={14} strokeWidth={2} />
          </Link>
        </div>

        <div className={styles.timeline}>
          {timeSlots.map((slot) => {
            const agendamentos = agendamentosPorHora[slot] || [];
            const hasContent = agendamentos.length > 0;

            return (
              <div
                key={slot}
                className={`${styles.timeRow} ${hasContent ? styles.timeRowActive : ""}`}
              >
                <div className={styles.timeLabel}>
                  <span>{slot}</span>
                </div>
                <div className={styles.timeLine}>
                  <div
                    className={`${styles.timeDot} ${hasContent ? styles.timeDotActive : ""}`}
                  />
                </div>
                <div className={styles.timeContent}>
                  {agendamentos.map((ag: any) => (
                    <div key={ag.id} className={styles.appointmentCard}>
                      <div className={styles.appointmentTop}>
                        <div className={styles.appointmentInfo}>
                          <span className={styles.appointmentTime}>
                            <HugeiconsIcon
                              icon={ClockIcon}
                              size={12}
                              strokeWidth={2}
                            />
                            {formatTime(ag.dataHora)}
                          </span>
                          <h4 className={styles.appointmentName}>
                            {ag.paciente.nome}
                          </h4>
                          <div className={styles.appointmentMeta}>
                            <div className={styles.statusDropdownWrapper} ref={openStatusId === ag.id ? statusDropdownRef : undefined}>
                              <button
                                type="button"
                                className={`${styles.statusTrigger} ${styles[`badge_${statusColors[ag.status] || "blue"}`]}`}
                                onClick={() => setOpenStatusId(openStatusId === ag.id ? null : ag.id)}
                              >
                                <span className={`${styles.statusDot} ${styles[`dot_${statusColors[ag.status] || "blue"}`]}`} />
                                {statusLabels[ag.status] || ag.status}
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 2 }}>
                                  <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              {openStatusId === ag.id && (
                                <div className={styles.statusMenu}>
                                  {Object.entries(statusLabels).map(([key, label]) => (
                                    <button
                                      key={key}
                                      type="button"
                                      className={`${styles.statusMenuItem} ${ag.status === key ? styles.statusMenuItemActive : ""}`}
                                      onClick={() => {
                                        if (key !== ag.status) {
                                          updateStatus({ id: ag.id, status: key as UpdateStatusInput["status"] });
                                        }
                                        setOpenStatusId(null);
                                      }}
                                    >
                                      <span className={`${styles.statusDot} ${styles[`dot_${statusColors[key] || "blue"}`]}`} />
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className={styles.badgeType}>
                              {tipoLabels[ag.tipo] || ag.tipo}
                            </span>
                            {ag.encaixe && (
                              <span className={styles.badgeEncaixe}>
                                Encaixe
                              </span>
                            )}
                            {ag.nutricionista?.nome && (
                              <span className={styles.badgeNutri}>
                                {ag.nutricionista.nome}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={styles.appointmentActions}>
                          {isNutricionista && (
                            <button
                              className={styles.startBtn}
                              onClick={() =>
                                navigate(`/pacientes/${ag.paciente.id}`)
                              }
                              title="Iniciar atendimento"
                            >
                              <HugeiconsIcon
                                icon={PlayCircleIcon}
                                size={16}
                                strokeWidth={1.8}
                              />
                              <span>Atender</span>
                            </button>
                          )}
                        </div>
                      </div>
                      {ag.paciente.telefone && (
                        <span className={styles.appointmentPhone}>
                          {ag.paciente.telefone}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
