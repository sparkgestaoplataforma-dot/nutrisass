import { useAuthStore } from '@/stores/authStore';

export function useIsAutonomo(): boolean {
  const user = useAuthStore((s) => s.user);
  return user?.tipoClinica === 'AUTONOMO';
}
