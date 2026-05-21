import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Notification01Icon,
  Calendar01Icon,
  UserCheck01Icon,
  InformationCircleIcon,
  TickDouble01Icon,
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

// -- Helpers --
const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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

const getIcon = (tipo: string) => {
  switch (tipo) {
    case "agendamento":
    case "agenda":
    case "AGENDAMENTO":
      return Calendar01Icon;
    case "usuario":
      return UserCheck01Icon;
    default:
      return InformationCircleIcon;
  }
};

const getIconColorClass = (tipo: string) => {
  switch (tipo) {
    case "agendamento":
    case "agenda":
    case "AGENDAMENTO":
      return styles.iconCalendar;
    case "usuario":
      return styles.iconUser;
    default:
      return styles.iconInfo;
  }
};

// -- Subcomponents --
function NotificationItem({
  notification,
  isRead,
  onClick,
}: {
  notification: any;
  isRead: boolean;
  onClick: (n: any) => void;
}) {
  const dateVal = notification.createdAt;
  return (
    <div
      className={`${styles.item} ${!isRead ? styles.unread : ""}`}
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
            {dateVal
              ? formatDistanceToNow(new Date(dateVal), { addSuffix: true, locale: ptBR })
              : ""}
          </span>
        </div>
      </div>
      {!isRead && <div className={styles.unreadDot} />}
    </div>
  );
}

export function NotificationCenter() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("read_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toastNotification, setToastNotification] = useState<any>(null);

  const { data: notificacoes = [] } = useQuery({
    queryKey: ["notificacoes", user?.userId],
    queryFn: getNotificacoesUsuario,
    enabled: !!user?.userId,
  });

  const clearMutation = useMutation({
    mutationFn: limparNotificacoesUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes", user?.userId] });
      setReadIds([]);
      localStorage.removeItem("read_notifications");
      setIsDropdownOpen(false);
    },
  });

  useEffect(() => {
    function handleNovaNotificacao(data: any) {
      console.log("Nova notificação recebida via socket:", data);
      queryClient.invalidateQueries({ queryKey: ["notificacoes", user?.userId] });
      
      playNotificationSound();
      setToastNotification(data);
      
      setTimeout(() => {
        setToastNotification(null);
      }, 5000);
    }

    socket.on("agenda:novo", handleNovaNotificacao);
    socket.on("agenda:limpar", () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes", user?.userId] });
      setReadIds([]);
      localStorage.removeItem("read_notifications");
    });

    return () => {
      socket.off("agenda:novo", handleNovaNotificacao);
      socket.off("agenda:limpar");
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

  const markAllAsRead = () => {
    const allIds = notificacoes.map((n) => n.id);
    setReadIds(allIds);
    localStorage.setItem("read_notifications", JSON.stringify(allIds));
  };

  const handleClearAll = () => {
    clearMutation.mutate();
  };

  const handleNotificationClick = (notification: any) => {
    if (!readIds.includes(notification.id)) {
      const newReadIds = [...readIds, notification.id];
      setReadIds(newReadIds);
      localStorage.setItem("read_notifications", JSON.stringify(newReadIds));
    }
    setIsDropdownOpen(false);
    if (notification.agendamentoId) {
      navigate(`/agendamentos?id=${notification.agendamentoId}`);
    }
  };

  const unreadCount = notificacoes.filter((n) => !readIds.includes(n.id)).length;

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
              {unreadCount > 0 && (
                <button className={styles.markAllBtn} onClick={markAllAsRead} title="Marcar todas como lidas">
                  <HugeiconsIcon icon={TickDouble01Icon} size={14} />
                  Ler todas
                </button>
              )}
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
                  isRead={readIds.includes(notification.id)}
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
