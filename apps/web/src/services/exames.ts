import { api } from './api';

// ==========================================
// Exames Base (Catálogo e Personalizados)
// ==========================================

export async function listarExamesBase(tipo?: 'base' | 'custom') {
  const { data } = await api.get('/exames/base', {
    params: tipo ? { tipo } : undefined,
  });
  return data.data;
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

