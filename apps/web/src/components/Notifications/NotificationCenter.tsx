import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification01Icon,
  Calendar01Icon,
  UserCheck01Icon,
  InformationCircleIcon,
  Clock01Icon,
  Delete01Icon
} from "@hugeicons/core-free-icons";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import styles from "./NotificationCenter.module.scss";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { getNotificacoesUsuario, limparNotificacoesUsuario } from "@/services/notificacao";
import { socket } from "@/services/socket";
import { SOCKET_EVENTS } from "@nutricao/shared";
import type { Notificacao, NotificationType } from "@nutricao/shared";

// -- Helpers --
const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 1);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

const getIcon = (tipo: NotificationType) => {
  switch (tipo) {
    case "AGENDAMENTO":
      return Calendar01Icon;
    case "USUARIO":
      return UserCheck01Icon;
    case "SISTEMA":
    default:
      return InformationCircleIcon;
  }
};

const getIconColorClass = (tipo: NotificationType) => {
  switch (tipo) {
    case "AGENDAMENTO":
      return styles.iconCalendar;
    case "USUARIO":
      return styles.iconUser;
    case "SISTEMA":
    default:
      return styles.iconInfo;
  }
};

// -- Subcomponents --
function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notificacao;
  onClick: (n: Notificacao) => void;
}) {
  return (
    <div
      className={`${styles.item} ${styles.unread}`}
      onClick={() => onClick(notification)}
    >
      <div className={`${styles.iconWrapper} ${getIconColorClass(notification.tipo)}`}>
        <HugeiconsIcon icon={getIcon(notification.tipo)} size={16} />
      </div>
      <div className={styles.content}>
        <p className={styles.itemTitle}>{notification.titulo}</p>
        {notification.mensagem && (
          <p
            style={{
              fontSize: "11px",
              color: "var(--gray-500, #666)",
              marginBottom: "4px",
              lineHeight: "1.4",
            }}
          >
            {notification.mensagem}
          </p>
        )}
        <div className={styles.meta}>
          <HugeiconsIcon icon={Clock01Icon} size={10} />
          <span>
            {notification.createdAt
              ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })
              : ""}
          </span>
        </div>
      </div>
      <div className={styles.unreadDot} />
    </div>
  );
}

export function NotificationCenter() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<Notificacao | null>(null);

  const { data: notificacoes = [] } = useQuery({
    queryKey: ["notificacoes", user?.userId],
    queryFn: getNotificacoesUsuario,
    enabled: !!user?.userId,
  });

  const clearMutation = useMutation({
    mutationFn: limparNotificacoesUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes", user?.userId] });
      setIsDropdownOpen(false);
    },
  });

  useEffect(() => {
    function handleNovaNotificacao(data: Notificacao) {
      queryClient.invalidateQueries({ queryKey: ["notificacoes", user?.userId] });

      playNotificationSound();
      setToastNotification(data);

      setTimeout(() => {
        setToastNotification(null);
      }, 5000);
    }

    function handleLimpar() {
      queryClient.invalidateQueries({ queryKey: ["notificacoes", user?.userId] });
    }

    socket.on(SOCKET_EVENTS.AGENDA_NOVO, handleNovaNotificacao);
    socket.on(SOCKET_EVENTS.NOTIFICACOES_LIMPAR, handleLimpar);

    return () => {
      socket.off(SOCKET_EVENTS.AGENDA_NOVO, handleNovaNotificacao);
      socket.off(SOCKET_EVENTS.NOTIFICACOES_LIMPAR, handleLimpar);
    };
  }, [queryClient, user?.userId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);
  const closeDropdown = () => setIsDropdownOpen(false);

  const handleClearAll = () => {
    clearMutation.mutate();
  };

  const handleNotificationClick = (notification: Notificacao) => {
    setIsDropdownOpen(false);
    if (notification.agendamentoId) {
      navigate(`/agendamentos?id=${notification.agendamentoId}`);
    }
  };

  const unreadCount = notificacoes.length;

  return (
    <>
      {toastNotification && (
        <div className={styles.toast}>
          <div className={`${styles.iconWrapper} ${getIconColorClass(toastNotification.tipo)}`}>
            <HugeiconsIcon icon={getIcon(toastNotification.tipo)} size={20} />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--gray-800, #1f2937)", margin: "0 0 4px 0" }}>
              {toastNotification.titulo}
            </p>
            {toastNotification.mensagem && (
              <p style={{ fontSize: "12px", color: "var(--gray-500, #6b7280)", margin: 0, lineHeight: "1.4" }}>
                {toastNotification.mensagem}
              </p>
            )}
          </div>
        </div>
      )}

      <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.trigger}
        onClick={toggleDropdown}
        aria-label="Notificações"
        title="Notificações"
      >
        <HugeiconsIcon icon={Notification01Icon} size={20} strokeWidth={1.8} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {isDropdownOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3 className={styles.title}>Notificações</h3>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {notificacoes.length > 0 && (
                <button
                  className={styles.markAllBtn}
                  onClick={handleClearAll}
                  style={{ color: "var(--danger)" }}
                  title="Limpar notificações"
                >
                  <HugeiconsIcon icon={Delete01Icon} size={14} />
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className={styles.list}>
            {notificacoes.length === 0 ? (
              <div className={styles.empty}>
                <p>Nenhuma notificação por enquanto.</p>
              </div>
            ) : (
              notificacoes.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                />
              ))
            )}
          </div>

          <div className={styles.footer}>
            <button className={styles.viewAllBtn} onClick={closeDropdown}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
