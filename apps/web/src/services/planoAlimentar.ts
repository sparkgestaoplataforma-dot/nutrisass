import { api } from "./api";
import type { ApiResponse } from "@nutricao/shared";
import type { CreatePlanoAlimentarInput, UpdatePlanoAlimentarInput } from "@nutricao/shared";

// ==========================================
// Types
// ==========================================

export interface MedidaCaseira {
  id: string;
  nome: string;
  quantidadeEmGramas: number;
}

export interface AlimentoAPI {
  id: string;
  clinicaId: string | null;
  codigo: string | null;
  nome: string;
  grupo: string | null;
  calorias: number | null;
  proteinas: number | null;
  carboidratos: number | null;
  gorduras: number | null;
  fibra: number | null;
  medidasCaseiras: MedidaCaseira[];
}

export interface PlanoAlimentoAPI {
  id: string;
  alimentoId: string | null;
  medidaCaseiraId: string | null;
  alimento: string;
  quantidade: number;
  unidade: string;
  calorias: number | null;
  proteinas: number | null;
  carboidratos: number | null;
  gorduras: number | null;
  fibra?: number | null;
  observacao: string | null;
  alimentoRel?: {
    calorias?: number | null;
    proteinas?: number | null;
    carboidratos?: number | null;
    gorduras?: number | null;
    fibra?: number | null;
    medidasCaseiras: MedidaCaseira[];
  } | null;
}

export interface PlanoOpcaoRefeicaoAPI {
  id: string;
  nome: string | null;
  ordem: number;
  alimentos: PlanoAlimentoAPI[];
}

export interface PlanoRefeicaoAPI {
  id: string;
  nome: string;
  horario: string;
  ordem: number;
  opcoes: PlanoOpcaoRefeicaoAPI[];
}

export interface PlanoAlimentarAPI {
  id: string;
  clinicaId: string;
  pacienteId: string;
  usuarioId: string;
  titulo: string;
  objetivo: string | null;
  metaCalorias: number | null;
  metaProteinas: number | null;
  metaCarboidratos: number | null;
  metaGorduras: number | null;
  recomendacaoAguaMl: number | null;
  observacoes: string | null;
  criadoEm: string;
  atualizadoEm: string;
  clinica?: { nome: string; logomarca: string | null };
  usuario?: { nome: string; email: string };
  paciente?: { id: string; nome: string; dataNascimento?: string | Date | null };
  refeicoes: PlanoRefeicaoAPI[];
}

export interface AlimentosListResponse {
  data: AlimentoAPI[];
  total: number;
  page: number;
  totalPages: number;
}

// ==========================================
// Planos Alimentares
// ==========================================

export async function listarPlanos(pacienteId: string) {
  const response = await api.get<ApiResponse<PlanoAlimentarAPI[]>>("/planos-alimentares", {
    params: { pacienteId },
  });
  return response.data;
}

export async function buscarPlano(id: string) {
  const response = await api.get<ApiResponse<PlanoAlimentarAPI>>(`/planos-alimentares/${id}`);
  return response.data;
}

export async function criarPlano(data: CreatePlanoAlimentarInput) {
  const response = await api.post<ApiResponse<PlanoAlimentarAPI>>("/planos-alimentares", data);
  return response.data;
}

export async function atualizarPlano(id: string, data: UpdatePlanoAlimentarInput) {
  const response = await api.put<ApiResponse<PlanoAlimentarAPI>>(`/planos-alimentares/${id}`, data);
  return response.data;
}

export async function deletarPlano(id: string) {
  const response = await api.delete<ApiResponse<void>>(`/planos-alimentares/${id}`);
  return response.data;
}

// ==========================================
// Alimentos
// ==========================================

export async function buscarAlimentos(q?: string, page = 1, limit = 20) {
  const response = await api.get<ApiResponse<AlimentosListResponse>>("/alimentos", {
    params: { q, page, limit },
  });
  // A API retorna { success, data: [...], total, page, totalPages } em nível plano
  // Vamos normalizar
  const raw = response.data as any;
  return {
    data: raw.data as AlimentoAPI[],
    total: raw.total as number,
    page: raw.page as number,
    totalPages: raw.totalPages as number,
  };
}

export async function buscarAlimentoPorId(id: string) {
  const response = await api.get<ApiResponse<AlimentoAPI>>(`/alimentos/${id}`);
  return response.data;
}
