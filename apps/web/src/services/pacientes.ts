import { api } from './api';
import type { ApiResponse, PaginatedResponse } from '@nutricao/shared';

export interface PacienteListItem {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  convenio: { id: string; nome: string } | null;
}

export async function listarPacientes(busca?: string) {
  const { data: res } = await api.get<ApiResponse<PaginatedResponse<PacienteListItem>>>(
    '/pacientes',
    { params: { busca, limit: 100 } },
  );
  return res.data!;
}
