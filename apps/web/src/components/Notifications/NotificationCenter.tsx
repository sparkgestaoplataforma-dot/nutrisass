import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification01Icon,
  Calendar01Icon,
  UserCheck01Icon,
  InformationCircleIcon,
  TickDouble01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
// import { useNotifications } from "@/hooks/useNotifications";
import { Notification } from "@/services/notification";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import styles from "./NotificationCenter.module.scss";

export function NotificationCenter() {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);




  const getIcon = (tipo: Notification["tipo"]) => {
    switch (tipo) {
      case "LEMBRETE_CONSULTA":
        return Calendar01Icon;
      case "PACIENTE_CHEGOU":
        return UserCheck01Icon;
      case "SISTEMA":
        return InformationCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const getIconColorClass = (tipo: Notification["tipo"]) => {
    switch (tipo) {
      case "LEMBRETE_CONSULTA":
        return styles.iconCalendar;
      case "PACIENTE_CHEGOU":
        return styles.iconUser;
      case "SISTEMA":
        return styles.iconInfo;
      default:
        return "";
    }
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.trigger}
        // onClick={toggleDropdown}
        aria-label="Notificações"
        title="Notificações"
      >
        <HugeiconsIcon icon={Notification01Icon} size={20} strokeWidth={1.8} />
        {/* {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )} */}
      </button>

      {/* {isDropdownOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3 className={styles.title}>Notificações</h3>
            {unreadCount > 0 && (
              <button
                className={styles.markAllBtn}
                onClick={() => markAllAsRead()}
              >
                <HugeiconsIcon icon={TickDouble01Icon} size={14} />
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>
                <p>Nenhuma notificação por enquanto.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.item} ${!notification.mensagemLida ? styles.unread : ""}`}
                  // onClick={() => handleNotificationClick(notification)}
                >
                  <div
                    className={`${styles.iconWrapper} ${getIconColorClass(notification.tipo)}`}
                  >
                    <HugeiconsIcon
                      icon={getIcon(notification.tipo)}
                      size={16}
                    />
                  </div>
                  <div className={styles.content}>
                    <p className={styles.itemTitle}>{notification.titulo}</p>
                    <div className={styles.meta}>
                      <HugeiconsIcon icon={Clock01Icon} size={10} />
                      <span>
                        {formatDistanceToNow(new Date(notification.createAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                  {!notification.mensagemLida && (
                    <div className={styles.unreadDot} />
                  )}
                </div>
              ))
            )}
          </div>

          <div className={styles.footer}>
            <button className={styles.viewAllBtn} onClick={closeDropdown}>
              Fechar
            </button>
          </div>
        </div>
      )} */}
    </div>
  );
}
