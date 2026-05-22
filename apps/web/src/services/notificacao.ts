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

export async function marcarNotificacaoLida(id: string): Promise<void> {
  await api.patch(`/notificacoes/usuario/${id}/lida`);
}

export async function excluirNotificacao(id: string): Promise<void> {
  await api.delete(`/notificacoes/usuario/${id}`);
}

export async function marcarTodasNotificacoesLidas(): Promise<void> {
  await api.patch("/notificacoes/usuario/lidas");
}
