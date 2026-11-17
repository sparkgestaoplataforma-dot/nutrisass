import { api } from './api';

export interface AlimentoPayload {
  nome: string;
  grupo?: string;
  calorias?: number;
  proteinas?: number;
  carboidratos?: number;
  gorduras?: number;
  fibra?: number;
  medidasCaseiras?: Array<{ nome: string; quantidadeEmGramas: number }>;
}

export async function listarAlimentosPaginado(params: {
  tipo: 'taco' | 'custom';
  page: number;
  limit?: number;
  q?: string;
}) {
  const { tipo, page, limit = 20, q = '' } = params;
  const { data } = await api.get('/alimentos', {
    params: { tipo, page, limit, q },
  });
  return data;
}

export async function criarAlimento(payload: AlimentoPayload) {
  const { data } = await api.post('/alimentos', payload);
  return data;
}

export async function editarAlimento(id: string, payload: AlimentoPayload) {
  const { data } = await api.put(`/alimentos/${id}`, payload);
  return data;
}

export async function excluirAlimento(id: string) {
  const { data } = await api.delete(`/alimentos/${id}`);
  return data;
}

