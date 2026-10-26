import { useAuthStore } from '@/stores/authStore';
import type { TokenPayload } from '@nutricao/shared';

/**
 * Avalia se o usuário autenticado possui permissão para acessar informações e recursos clínicos.
 *
 * Regras:
 * - Se não autenticado (user nulo/indefinido): acesso negado (false).
 * - Se a clínica for AUTONOMO: acesso total permitido a qualquer perfil (true).
 * - Se a clínica for CLINICA: apenas o perfil NUTRICIONISTA tem acesso clínico (true).
 *   Perfis ADMIN, SECRETARIA e outros têm acesso negado a dados clínicos (false).
 */
export function canAccessClinical(user: TokenPayload | null | undefined): boolean {
  if (!user || !user.tipoClinica || !user.perfil) {
    return false;
  }

  if (user.tipoClinica === 'AUTONOMO') {
    return true;
  }

  return user.perfil === 'NUTRICIONISTA';
}

/**
 * Hook para consumo reativo da permissão clínica no front-end.
 * Utiliza o seletor do Zustand para re-renderizar somente quando a permissão mudar.
 */
export function useClinicalAccess(): boolean {
  return useAuthStore((s) => canAccessClinical(s.user));
}
