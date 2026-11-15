import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Inbox,
  Trash2,
  X,
} from 'lucide-react';
import type { NavPage, NotificationItem } from '../types/zuno';
import { countUnreadNotifications } from '../utils/zunoLogic';
import { ConfirmModal } from './ConfirmModal';
import { EmptyState } from './EmptyState';

interface NotificationsPanelProps {
  open: boolean;
  notifications: NotificationItem[];
  notificationsDisabled: boolean;
  onToggleNotificationsDisabled: () => void;
  onClose: () => void;
  onOpenNotification: (notification: NotificationItem) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
}

const PAGE_NAMES: Record<NavPage, string> = {
  overview: 'Visão geral',
  agents: 'Agentes',
  inbox: 'Caixa de entrada',
  crm: 'CRM',
  flows: 'Fluxos de conversa',
  storage: 'Armazenamento',
  integrations: 'Integrações',
  analytics: 'Analytics e relatórios',
  settings: 'Configurações',
};

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  open,
  notifications,
  notificationsDisabled,
  onToggleNotificationsDisabled,
  onClose,
  onOpenNotification,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
}) => {
  const [confirmDeleteTarget, setConfirmDeleteTarget] =
    useState<NotificationItem | null>(null);

  useEffect(() => {
    if (!open) {
      setConfirmDeleteTarget(null);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !confirmDeleteTarget) {
        onClose();
      }
    };

    const isMobile = window.innerWidth <= 768;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyPosition = document.body.style.position;
    const prevBodyTop = document.body.style.top;
    const prevBodyLeft = document.body.style.left;
    const prevBodyRight = document.body.style.right;
    const prevBodyWidth = document.body.style.width;
    const savedScrollY = window.scrollY;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    if (isMobile) {
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      if (isMobile) {
        document.body.style.position = prevBodyPosition;
        document.body.style.top = prevBodyTop;
        document.body.style.left = prevBodyLeft;
        document.body.style.right = prevBodyRight;
        document.body.style.width = prevBodyWidth;
        window.scrollTo(0, savedScrollY);
      }
    };
  }, [open, onClose, confirmDeleteTarget]);

  if (!open) return null;

  const unreadCount = countUnreadNotifications(notifications);

  return (
    <>
      {/* Backdrop: closes panel on tap outside */}
      <div
        data-testid="notifications-backdrop"
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-40 touch-none bg-black/30 sm:bg-[#0B5226]/15 backdrop-blur-[1px]"
      />

      {/* Compact Bell-Anchored Popover with mobile horizontal margins, safe areas & 100dvh cap */}
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-panel-title"
        data-testid="notifications-panel"
        className="fixed top-[calc(4.25rem+env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] right-[max(0.75rem,env(safe-area-inset-right))] sm:left-auto sm:right-[max(1.25rem,env(safe-area-inset-right))] z-50 mx-auto flex max-h-[min(560px,calc(100dvh-5.25rem-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] w-auto max-w-[420px] sm:w-[420px] flex-col overflow-hidden overscroll-contain rounded-2xl border border-[#0B5226]/15 bg-white shadow-2xl"
      >
        {/* Fixed Header: "Notificações" + "Marcar lidas", "Desativar", "Fechar" */}
        <header className="shrink-0 border-b border-[#0B5226]/12 bg-white px-3.5 py-3 sm:px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E3F6EA] text-[#178A3F]">
                {notificationsDisabled ? (
                  <BellOff className="h-4.5 w-4.5 text-[#D63B3A]" />
                ) : (
                  <Bell className="h-4.5 w-4.5" />
                )}
              </div>
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <h2
                  id="notifications-panel-title"
                  className="font-display text-base font-bold text-[#0B5226]"
                >
                  Notificações
                </h2>
                {notificationsDisabled ? (
                  <span className="inline-flex items-center rounded-full bg-[#FCEBEB] px-2 py-0.5 text-sm font-semibold text-[#791F1F]">
                    Desativadas
                  </span>
                ) : unreadCount > 0 ? (
                  <span
                    data-testid="notifications-panel-unread-badge"
                    className="inline-flex items-center rounded-full bg-[#D63B3A] px-2 py-0.5 text-sm font-bold text-white tabular-nums"
                  >
                    {unreadCount}
                  </span>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-xl border border-[#0B5226]/15 bg-white px-3 py-1.5 text-sm font-semibold text-[#0B5226] hover:bg-[#E3F6EA] active:bg-[#d2efdd] transition-colors"
            >
              <X className="h-4 w-4 shrink-0" />
              <span>Fechar</span>
            </button>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onMarkAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#E3F6EA] px-3 py-1.5 text-sm font-semibold text-[#0B5226] hover:bg-[#d2efdd] disabled:opacity-45 disabled:hover:bg-[#E3F6EA] transition-colors whitespace-nowrap"
            >
              <CheckCheck className="h-4 w-4 shrink-0 text-[#178A3F]" />
              <span>Marcar lidas</span>
            </button>

            <button
              type="button"
              onClick={onToggleNotificationsDisabled}
              aria-pressed={notificationsDisabled}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap ${
                notificationsDisabled
                  ? 'border-[#178A3F]/35 bg-[#E3F6EA] text-[#0B5226] hover:bg-[#d2efdd]'
                  : 'border-[#0B5226]/15 bg-[#F4F4F2] text-[#0B5226] hover:bg-[#E3F6EA]/60'
              }`}
            >
              <BellOff className="h-4 w-4 shrink-0 text-[#D63B3A]" />
              <span>{notificationsDisabled ? 'Ativar' : 'Desativar'}</span>
            </button>
          </div>
        </header>

        {/* Independent Scrollable Notification List */}
        <div
          data-testid="notifications-scroll-area"
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain bg-[#F4F4F2]/60 p-3 space-y-2.5"
        >
          {notificationsDisabled && (
            <div className="rounded-xl border border-[#D63B3A]/25 bg-[#FCEBEB] px-3 py-2.5 text-sm text-[#791F1F]">
              Alertas de notificação desativados. Clique em <strong>Ativar</strong> para retomar.
            </div>
          )}

          {notifications.length > 0 ? (
            <ul className="space-y-2.5">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  data-testid={`notification-item-${n.id}`}
                  className={`rounded-2xl border p-3.5 transition-colors ${
                    n.read
                      ? 'border-[#E2E7E3] bg-white'
                      : 'border-[#D63B3A]/35 bg-[#FCEBEB]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      {!n.read && (
                        <span
                          aria-label="Não lida"
                          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#D63B3A]"
                        />
                      )}
                      <h3
                        className={`text-[15px] font-semibold break-words leading-snug ${
                          n.read ? 'text-[#0B5226]' : 'text-[#791F1F]'
                        }`}
                      >
                        {n.title}
                      </h3>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-[#526058] tabular-nums">
                      {n.time}
                    </span>
                  </div>

                  <p className="mt-1.5 text-sm text-[#1A241E] break-words leading-relaxed">
                    {n.description}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-[#E3F6EA] px-2.5 py-0.5 text-sm font-medium text-[#0B5226]">
                      {PAGE_NAMES[n.targetPage]}
                    </span>
                    <span className="text-sm font-medium text-[#526058]">
                      {n.read ? 'Lida' : 'Por ler'}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-black/8 pt-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenNotification(n)}
                        aria-label={`Abrir notificação: ${n.title}`}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#178A3F] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#137334] active:bg-[#0B5226] transition-colors"
                      >
                        <span>Abrir</span>
                        <ArrowUpRight className="h-4 w-4 shrink-0" />
                      </button>

                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => onMarkAsRead(n.id)}
                          aria-label={`Marcar como lida: ${n.title}`}
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#178A3F]/30 bg-[#E3F6EA] px-3 py-2 text-sm font-semibold text-[#0B5226] hover:bg-[#d2efdd] transition-colors"
                        >
                          <Check className="h-4 w-4 shrink-0 text-[#178A3F]" />
                          <span>Marcar lida</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteTarget(n)}
                      aria-label={`Eliminar notificação: ${n.title}`}
                      className="ml-auto inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#D63B3A]/30 bg-white px-3.5 py-2 text-sm font-semibold text-[#791F1F] hover:bg-[#FCEBEB] transition-colors"
                    >
                      <Trash2 className="h-4 w-4 shrink-0 text-[#D63B3A]" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Inbox}
              title="Sem notificações."
              description="Não existem alertas pendentes neste momento."
              actionLabel={notificationsDisabled ? 'Ativar alertas' : 'Fechar painel'}
              onAction={
                notificationsDisabled ? onToggleNotificationsDisabled : onClose
              }
              testId="notifications-empty-state"
            />
          )}
        </div>
      </section>

      <ConfirmModal
        open={Boolean(confirmDeleteTarget)}
        title="Eliminar notificação"
        description={
          confirmDeleteTarget
            ? `Tem a certeza de que pretende eliminar "${confirmDeleteTarget.title}"?`
            : ''
        }
        confirmLabel="Eliminar"
        onCancel={() => setConfirmDeleteTarget(null)}
        onConfirm={() => {
          if (confirmDeleteTarget) {
            onDeleteNotification(confirmDeleteTarget.id);
          }
          setConfirmDeleteTarget(null);
        }}
      />
    </>
  );
};
