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
  regrasInterpretacao: RegraInterpretacao[];
}

export async function getAvaliacoesPorId(Id: string) {
  const response = await api.get<ApiResponse<Avaliacao>>(`/avaliacoes/${Id}`);
  return response.data;
}

export async function getAvaliacaoComRespostas(Id: string) {
  const response = await api.get<ApiResponse<Avaliacao>>(
    `/avaliacoes/${Id}/questionario/respostas`,
  );
  return response.data;
}
