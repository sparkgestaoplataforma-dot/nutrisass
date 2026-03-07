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
  email: string;
  perfil: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
