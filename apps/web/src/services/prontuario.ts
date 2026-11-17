import { api } from './api';
import type { CreateEvolucaoInput, CreateMedidaInput } from '@nutricao/shared';

// ==========================================
// Evolução Clínica
// ==========================================

export async function listarEvolucoes(pacienteId: string) {
  const { data } = await api.get(`/prontuario/${pacienteId}/evolucoes`);
  return data.data;
}

export async function criarEvolucao(pacienteId: string, payload: CreateEvolucaoInput) {
  const { data } = await api.post(`/prontuario/${pacienteId}/evolucoes`, {
    ...payload,
    pacienteId,
  });
  return data.data;
}

export async function editarEvolucao(id: string, payload: Partial<CreateEvolucaoInput>) {
  const { data } = await api.put(`/prontuario/evolucoes/${id}`, payload);
  return data.data;
}

export async function excluirEvolucao(id: string) {
  const { data } = await api.delete(`/prontuario/evolucoes/${id}`);
  return data;
}

// ==========================================
// Medidas Antropométricas
// ==========================================

export async function listarMedidas(pacienteId: string) {
  const { data } = await api.get(`/prontuario/${pacienteId}/medidas`);
  return data.data;
}

export async function criarMedida(pacienteId: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/prontuario/${pacienteId}/medidas`, {
    ...payload,
    pacienteId,
  });
  return data.data;
}

export async function editarMedida(id: string, payload: Partial<CreateMedidaInput> | Record<string, unknown>) {
  const { data } = await api.put(`/prontuario/medidas/${id}`, payload);
  return data.data;
}

export async function excluirMedida(id: string) {
  const { data } = await api.delete(`/prontuario/medidas/${id}`);
  return data;
}

