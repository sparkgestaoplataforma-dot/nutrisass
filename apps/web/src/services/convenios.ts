import { api } from './api';
import type { ApiResponse } from '@nutricao/shared';

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
