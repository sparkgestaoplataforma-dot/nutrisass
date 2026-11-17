import { api } from './api';
import type { CreateExameBaseInput } from '@nutricao/shared';

// ==========================================
// Exames Base (Catálogo e Personalizados)
// ==========================================

export async function listarExamesBase(tipo?: 'base' | 'custom') {
  const { data } = await api.get('/exames/base', {
    params: tipo ? { tipo } : undefined,
  });
  return data.data;
}

export async function listarExamesBasePaginado(params: {
  page: number;
  limit?: number;
  search?: string;
}) {
  const { page, limit = 10, search } = params;
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search && search.trim() ? { search: search.trim() } : {}),
  });
  const { data } = await api.get(`/exames/base?${query}`);
  return data;
}

export async function criarExameBase(payload: CreateExameBaseInput) {
  const { data } = await api.post('/exames/base', payload);
  return data.data;
}

export async function editarExameBase(id: string, payload: Partial<CreateExameBaseInput>) {
  const { data } = await api.put(`/exames/base/${id}`, payload);
  return data.data;
}

export async function excluirExameBase(id: string) {
  const { data } = await api.delete(`/exames/base/${id}`);
  return data;
}

// ==========================================
// Solicitações e Resultados de Exame do Paciente
// ==========================================

export async function listarSolicitacoesPaciente(pacienteId: string) {
  const { data } = await api.get(`/exames/paciente/${pacienteId}`);
  return data.data;
}

export async function solicitarExamePaciente(pacienteId: string, exameBaseIds: string[]) {
  const { data } = await api.post(`/exames/paciente/${pacienteId}`, {
    pacienteId,
    exameBaseIds,
  });
  return data.data;
}

export async function lancarExameExternoPaciente(
  pacienteId: string,
  payload: {
    dataResultado: string;
    itens: { exameBaseId: string; resultado: string }[];
  },
) {
  const { data } = await api.post(`/exames/paciente/${pacienteId}/externo`, payload);
  return data.data;
}

export async function registrarResultadoExame(payload: {
  itemId: string;
  dataResultado: string;
  resultado: string;
}) {
  const { data } = await api.post('/exames/resultado', payload);
  return data.data;
}

export async function excluirSolicitacaoExame(id: string) {
  const { data } = await api.delete(`/exames/${id}`);
  return data;
}
