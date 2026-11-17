import { api } from '@/services/api';
import type {
  OnboardingInput,
  ApiResponse,
  AuthTokens,
  TokenPayload,
  UpdateClinicaInput,
} from '@nutricao/shared';

export interface OnboardingResult {
  clinica: unknown;
  tokens: AuthTokens;
}

export interface Clinica {
  id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  logomarca: string | null;
}

export async function postOnboarding(input: OnboardingInput): Promise<OnboardingResult> {
  const { data } = await api.post<ApiResponse<OnboardingResult>>(
    '/clinica/onboarding',
    input,
  );
  return data.data!;
}

export async function getMe(): Promise<TokenPayload> {
  const { data } = await api.get<ApiResponse<TokenPayload>>('/auth/me');
  return data.data!;
}

export async function getClinica(): Promise<Clinica> {
  const { data } = await api.get<ApiResponse<Clinica>>('/clinica');
  return data.data!;
}

export async function atualizarClinica(input: UpdateClinicaInput): Promise<Clinica> {
  const { data } = await api.put<ApiResponse<Clinica>>('/clinica', input);
  return data.data!;
}

export async function alterarTipoClinica(tipo: 'AUTONOMO' | 'CLINICA') {
  const { data } = await api.put('/clinica/tipo', { tipo });
  return data.data as {
    tipo: 'AUTONOMO' | 'CLINICA';
    perfil: string;
    tokens: AuthTokens;
  };
}
