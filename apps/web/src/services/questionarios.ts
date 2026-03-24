import axios from "axios";
import type { ApiResponse } from "@nutricao/shared";

const publicApi = axios.create({
  baseURL: "/api",
});

export interface QuestionarioPergunta {
  id: string;
  descricao: string;
  ordem: number;
  moduloId: string;
}

export interface QuestionarioModulo {
  id: string;
  nome: string;
  ordem: number;
  questionarioId: string;
  perguntas: QuestionarioPergunta[];
}

export interface QuestionarioDetalhe {
  id: string;
  clinicaId: string;
  nome: string;
  versao: number;
  ativo: boolean;
  modulos: QuestionarioModulo[];
}

export interface RespostaPayload {
  perguntaId: string;
  nota: number;
}

export async function buscarQuestionario(questionarioId: string) {
  const { data } = await publicApi.get<ApiResponse<QuestionarioDetalhe>>(
    `/questionarios/${questionarioId}`,
  );

  return data.data as QuestionarioDetalhe;
}

export async function enviarRespostasQuestionario(
  pacienteId: string,
  questionarioId: string,
  respostas: RespostaPayload[],
) {
  const { data } = await publicApi.post<ApiResponse<unknown>>(
    `/pacientes/${pacienteId}/questionarios/${questionarioId}/avaliacoes`,
    {
      respostas,
    },
  );

  return data;
}
