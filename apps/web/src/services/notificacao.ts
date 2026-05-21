import { api } from "@/services/api";
import type { ApiResponse } from "@nutricao/shared";

export interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  agendamentoId: string;
  createdAt: string;
}

export async function getNotificacoesUsuario(): Promise<Notificacao[]> {
  const { data } = await api.get<ApiResponse<Notificacao[]>>("/notificacoes/usuario");
  return data.data!;
}

export async function limparNotificacoesUsuario(): Promise<void> {
  await api.delete("/notificacoes/usuario");
}
