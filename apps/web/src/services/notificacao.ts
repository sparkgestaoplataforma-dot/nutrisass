import { api } from './api';

export interface Notification {
  id: string;
  clinicaId: string;
  usuarioId: string;
  tipo: 'LEMBRETE_CONSULTA' | 'PACIENTE_CHEGOU' | 'SISTEMA';
  titulo: string;
  mensagemLida: boolean;
  createAt: string;
  updatedAt: string;
}

export const ListarTodasNotificacoesNaoLidas = async (clinicaId: string, usuarioId: string) => {
    const { data } = await api.get(`/notificacao/clinica/${clinicaId}/usuario/${usuarioId}`);
    return data.data;
  };
  
//   async markAsRead(id: string): Promise<void> {
//     await api.put(`/notificacao/${id}`);
//   },

//   async markAllAsRead(clinicaId: string, usuarioId: string): Promise<void> {
//     await api.put(`/notificacao/clinica/${clinicaId}/usuario/${usuarioId}`);
//   }
// };
