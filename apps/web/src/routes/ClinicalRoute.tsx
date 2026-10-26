import { Navigate, Outlet } from 'react-router-dom';
import { useClinicalAccess } from '@/hooks/useClinicalAccess';

/**
 * Guarda de rota para páginas de acesso estritamente clínico.
 * Se o usuário não tiver permissão clínica (ex: SECRETARIA em clínica do tipo CLINICA),
 * redireciona de forma segura para a listagem cadastral de pacientes (/pacientes).
 */
export function ClinicalRoute() {
  const hasClinicalAccess = useClinicalAccess();

  if (!hasClinicalAccess) {
    return <Navigate to="/pacientes" replace />;
  }

  return <Outlet />;
}
