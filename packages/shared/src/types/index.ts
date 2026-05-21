export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TokenPayload {
  userId: string;
  clinicaId: string;
  email: string;
  perfil: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type NotificationType = "AGENDAMENTO" | "SISTEMA" | "USUARIO";

export interface Notificacao {
  id: string;
  tipo: NotificationType;
  titulo: string;
  mensagem: string;
  agendamentoId?: string;
  pacienteId?: string;
  createdAt: string;
  lida?: boolean;
}
