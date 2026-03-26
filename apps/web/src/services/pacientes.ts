import { api } from "./api";
import type { ApiResponse, PaginatedResponse } from "@nutricao/shared";

export interface PacienteListItem {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  convenio: { id: string; nome: string } | null;
}

export interface Avaliacoes {
  id: string;
  dataRealizacao: string;
  scoreTotal: number;
  pacienteId: string;
  questionarioId: string;
}

export async function listarPacientes(busca?: string) {
  const { data: res } = await api.get<
    ApiResponse<PaginatedResponse<PacienteListItem>>
  >("/pacientes", { params: { busca, limit: 100 } });
  return res.data!;
}

export async function getPacientePorId(id: string) {
  const { data } = await api.get(`/pacientes/${id}`);
  return data.data;
}
export async function getAvaliacoesPorPacienteId(pacienteId: string) {
  const response = await api.get<ApiResponse<Avaliacoes[]>>(
    `/pacientes/${pacienteId}/avaliacoes`,
  );
  return response.data;
}
