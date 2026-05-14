import { api } from './api';
import type { ApiResponse } from '@nutricao/shared';

export interface DashboardData {
  totalPacientes: number;
  pacientesMes: number;
  agendaHoje: number;
  agendamentosMes: number;
  realizadosMes: number;
  canceladosMes: number;
  naoCompareceuMes: number;
  proximosAgendamentos: Array<{
    id: string;
    dataHora: string;
    tipo: string;
    status: string;
    paciente: {
      id: string;
      nome: string;
      telefone: string | null;
    };
    convenio?: {
      id: string;
      nome: string;
    } | null;
  }>;
}

export async function pegarDadosDashboard(nutricionistaId: string) {
  const { data: res } = await api.get<ApiResponse<DashboardData>>(
    `/dashboard/nutricionistaId/${nutricionistaId}`
  );
  
  return res.data!;
}
