import { NavLink } from 'react-router-dom';
import {
  LuLayoutDashboard,
  LuCalendar,
  LuUsers,
  LuFileText,
  LuChartBar,
  LuSettings,
} from 'react-icons/lu';
import styles from './Sidebar.module.scss';

const navItems = [
  { to: '/', label: 'Início', icon: LuLayoutDashboard },
  { to: '/agenda', label: 'Agenda', icon: LuCalendar },
  { to: '/pacientes', label: 'Pacientes', icon: LuUsers },
  { to: '/exames', label: 'Exames', icon: LuFileText },
  { to: '/relatorios', label: 'Relatórios', icon: LuChartBar },
  { to: '/configuracoes', label: 'Configurações', icon: LuSettings },
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h1>Nutrição</h1>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <item.icon />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
