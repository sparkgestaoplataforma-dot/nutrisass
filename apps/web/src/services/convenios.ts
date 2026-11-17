import { api } from './api';
import type { ApiResponse, CreateConvenioInput } from '@nutricao/shared';

export interface ConvenioItem {
  id: string;
  nome: string;
  registroANS: string | null;
  logomarca?: string | null;
}

export interface ListarConveniosParams {
  search?: string;
  busca?: string;
  page?: number;
  limit?: number;
}

export async function listarConvenios(params?: ListarConveniosParams) {
  const { data: res } = await api.get<ApiResponse<ConvenioItem[]>>('/convenios', {
    params: { limit: 100, ...params },
  });
  return res.data!;
}

export async function listarConveniosPaginado(params: {
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
  const { data } = await api.get(`/convenios?${query}`);
  return data;
}

export async function criarConvenio(
  payload: CreateConvenioInput & { logomarca?: string | null },
) {
  const { data } = await api.post('/convenios', payload);
  return data.data;
}

export async function editarConvenio(
  id: string,
  payload: Partial<CreateConvenioInput> & { logomarca?: string | null },
) {
  const { data } = await api.put(`/convenios/${id}`, payload);
  return data.data;
}

export async function excluirConvenio(id: string) {
  const { data } = await api.delete(`/convenios/${id}`);
  return data;
}
