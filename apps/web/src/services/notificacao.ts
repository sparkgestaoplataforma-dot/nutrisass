import { api } from "@/services/api";
import type { ApiResponse, Notificacao } from "@nutricao/shared";

export type { Notificacao };

export async function getNotificacoesUsuario(): Promise<Notificacao[]> {
  const { data } = await api.get<ApiResponse<Notificacao[]>>("/notificacoes/usuario");
  return data.data!;
}

export async function limparNotificacoesUsuario(): Promise<void> {
  await api.delete("/notificacoes/usuario");
}
