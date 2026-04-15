import { api } from "./api";
import type { ApiResponse } from "@nutricao/shared";

export interface RegraInterpretacao {
  id: string;
  pontuacaoMin: number;
  pontuacaoMax: number;
  classificacao: string;
  questionarioId: string;
}

export interface Avaliacao {
  id: string;
  dataRealizacao: string;
  scoreTotal: number;
  pacienteId: string;
  questionarioId: string;
  regraInterpretacao?: string | null;
  questionario?: {
    regras: RegraInterpretacao[];
  };
}

export type AvaliacaoComRespostas = Avaliacao & {
  questionario: {
    regras: RegraInterpretacao[];
    modulos: any[];
    labelEscolha: any[];
  };
};

export interface Avaliacoes {
  id: string;
  dataRealizacao: string;
  scoreTotal: number;
  pacienteId: string;
  questionarioId: string;
}

export async function getAvaliacoesPorId(Id: string) {
  const response = await api.get<ApiResponse<Avaliacao>>(`/avaliacoes/${Id}`);
  return response.data;
}

export async function getAvaliacaoComRespostas(Id: string) {
  const response = await api.get<ApiResponse<AvaliacaoComRespostas>>(
    `/avaliacoes/${Id}/questionario`,
  );
  return response.data;
}

export async function getAvaliacoesPorPacienteId(PacienteId: string) {
  const response = await api.get<ApiResponse<Avaliacao[]>>(
    `/avaliacoes/paciente/${PacienteId}`,
  );
  return response.data;
}

export async function DeleteAvaliacao(Id: string) {
  const response = await api.delete(`/avaliacoes/${Id}`);
  return response;
}
