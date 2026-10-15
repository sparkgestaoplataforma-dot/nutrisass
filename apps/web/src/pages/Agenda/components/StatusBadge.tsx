import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { StatusAgendamento } from '@nutricao/shared';
import styles from './StatusBadge.module.scss';

const statusLabels: Record<string, string> = {
  AGENDADO: 'Agendado',
  CONFIRMOU: 'Confirmou',
  PRESENTE: 'Presente',
  ENCAIXE: 'Encaixe',
  CANCELADO: 'Cancelado',
  NAO_COMPARECEU: 'Não Compareceu',
  REALIZADO: 'Realizado',
  DESISTIU: 'Desistiu',
  REMARCOU: 'Remarcou',
};

interface StatusBadgeProps {
  status: string;
  onChangeStatus?: (status: string) => void;
}

export function StatusBadge({ status, onChangeStatus }: StatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isInteractive = !!onChangeStatus;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    // Se saiu da tela, fecha o menu
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      setOpen(false);
      return;
    }

    const estimatedHeight = 310;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

    const menuWidth = 175;
    let left = rect.left;
    if (left + menuWidth > window.innerWidth - 12) {
      left = window.innerWidth - menuWidth - 12;
    }

    setCoords({
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      left: Math.max(12, left),
      openUp,
    });
  }, []);

  const handleToggle = () => {
    if (!isInteractive) return;
    if (!open) {
      updatePosition();
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleScrollOrResize() {
      updatePosition();
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open, updatePosition]);

  return (
    <div className={styles.container}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.badge} ${styles[status] || ''} ${open ? styles.open : ''} ${!isInteractive ? styles.readonly : ''}`}
        onClick={handleToggle}
        title={isInteractive ? 'Clique para alterar o status' : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{statusLabels[status] || status}</span>
        {isInteractive && (
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={13}
            strokeWidth={2.5}
            className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          />
        )}
      </button>

      {open && coords && isInteractive && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className={styles.dropdownPortal}
          style={{
            top: coords.openUp ? undefined : `${coords.top}px`,
            bottom: coords.openUp ? `${window.innerHeight - coords.top}px` : undefined,
            left: `${coords.left}px`,
          }}
          role="listbox"
        >
          {Object.values(StatusAgendamento).map((s) => (
            <button
              key={s}
              type="button"
              className={`${styles.menuItem} ${s === status ? styles.activeItem : ''}`}
              onClick={() => {
                onChangeStatus(s);
                setOpen(false);
              }}
              role="option"
              aria-selected={s === status}
            >
              <div className={styles.itemLabelWrapper}>
                <span className={`${styles.statusDot} ${styles[`dot${s}`] || ''}`} />
                <span>{statusLabels[s] || s}</span>
              </div>
              {s === status && (
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={14}
                  strokeWidth={2}
                  className={styles.checkIcon}
                />
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
