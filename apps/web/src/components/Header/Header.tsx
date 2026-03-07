import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useAuth';
import styles from './Header.module.scss';

const pageTitles: Record<string, string> = {
  '/': 'Início',
  '/agenda': 'Agenda',
  '/pacientes': 'Pacientes',
  '/exames': 'Exames',
  '/relatorios': 'Relatórios',
  '/configuracoes': 'Configurações',
};

export function Header() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const { mutate: logout } = useLogout();

  const title = pageTitles[location.pathname] || 'Nutrição';

  return (
    <header className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.actions}>
        {user && (
          <span className={styles.userInfo}>{user.email}</span>
        )}
        <button className={styles.logoutBtn} onClick={() => logout()}>
          Sair
        </button>
      </div>
    </header>
  );
}
