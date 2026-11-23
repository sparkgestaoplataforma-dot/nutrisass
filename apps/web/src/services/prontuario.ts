import { api } from './api';
import type {
  CreateEvolucaoInput,
  CreateMedidaInput,
  UpdateMedidaInput,
  ProtocoloComposicao,
} from '@nutricao/shared';

export interface MedidaAPI {
  id: string;
  pacienteId: string;
  data: string;
  peso: number | null;
  altura: number | null;
  cintura: number | null;
  abdomen: number | null;
  quadril: number | null;
  bracoDireito: number | null;
  bracoEsquerdo: number | null;
  coxaDireita: number | null;
  coxaEsquerda: number | null;
  culote: number | null;
  protocoloComposicao: ProtocoloComposicao | null;
  dobraTriceps: number | null;
  dobraSubescapular: number | null;
  dobraPeitoral: number | null;
  dobraAxilarMedia: number | null;
  dobraSuprailiaca: number | null;
  dobraAbdominal: number | null;
  dobraCoxa: number | null;
  percentualGordura: number | null;
  massaMagraKg: number | null;
  massaGordaKg: number | null;
  massaMuscularKg: number | null;
  aguaCorporalPct: number | null;
  gorduraVisceral: number | null;
  taxaMetabolicaBia: number | null;
  idadeMetabolica: number | null;
  observacoes: string | null;
  criadoEm: string;
}

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

export async function listarMedidas(pacienteId: string): Promise<MedidaAPI[]> {
  const { data } = await api.get(`/prontuario/${pacienteId}/medidas`);
  return data.data;
}

export async function criarMedida(pacienteId: string, payload: CreateMedidaInput) {
  const { data } = await api.post(`/prontuario/${pacienteId}/medidas`, {
    ...payload,
    pacienteId,
  });
  return data.data as MedidaAPI;
}

export async function editarMedida(id: string, payload: UpdateMedidaInput) {
  const { data } = await api.put(`/prontuario/medidas/${id}`, payload);
  return data.data as MedidaAPI;
}

export async function excluirMedida(id: string) {
  const { data } = await api.delete(`/prontuario/medidas/${id}`);
  return data;
}

