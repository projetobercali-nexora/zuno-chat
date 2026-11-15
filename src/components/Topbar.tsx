import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  HelpCircle,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  User,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import type { NavPage, NotificationItem, WorkspaceTenant } from '../types/zuno';
import { countUnreadNotifications } from '../utils/zunoLogic';
import { Avatar } from './Avatar';
import { NotificationsPanel } from './NotificationsPanel';
import { ZunoLogo } from './ZunoLogo';

export interface GlobalSearchTarget {
  page: NavPage;
  kind: 'agent' | 'contact' | 'doc' | 'conversation';
  itemId: string;
}

interface TopbarProps {
  activePage: NavPage;
  tenant: WorkspaceTenant;
  onOpenMobileMenu: () => void;
  onNavigate: (page: NavPage) => void;
  onSelectSearchTarget: (target: GlobalSearchTarget) => void;
  onOpenPreferences: () => void;
  onLogout: () => void;
  onOpenNotification: (notification: NotificationItem) => void;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onDeleteNotification: (id: string) => void;
}

const PAGE_LABELS: Record<NavPage, string> = {
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

const FAQ_ITEMS = [
  {
    q: 'Como ligar o WhatsApp da empresa ao ZUNO CHAT?',
    a: 'Aceda a Integrações no menu lateral e clique em "Gerar novo QR Code" ou "Confirmar leitura e conectar dispositivo". Todas as mensagens recebidas passam automaticamente pelos seus agentes IA.',
  },
  {
    q: 'Como os agentes IA usam os documentos da Base de Conhecimento?',
    a: 'Em Armazenamento pode importar PDFs, FAQs, produtos ou políticas. Assim que um documento está Indexado e associado a um agente, a IA consulta esse conteúdo antes de responder.',
  },
  {
    q: 'Quando é que uma conversa é transferida para um operador humano?',
    a: 'Sempre que o cliente pede atendimento humano, quando o nível de confiança da IA é inferior ao limiar configurado ou quando um fluxo de automação encaminha para Comercial, Suporte ou Financeiro.',
  },
  {
    q: 'As alterações em agentes, contactos e automações atualizam os relatórios?',
    a: 'Sim. Todos os módulos leem e escrevem na mesma base de dados central, mantendo contagens, alertas e indicadores sincronizados em tempo real.',
  },
];

export const Topbar: React.FC<TopbarProps> = ({
  activePage,
  tenant,
  onOpenMobileMenu,
  onNavigate,
  onSelectSearchTarget,
  onOpenPreferences,
  onLogout,
  onOpenNotification,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onDeleteNotification,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificationsDisabled, setNotificationsDisabled] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number>(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const searchBlurTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setNotifOpen(false);
    setProfileOpen(false);
  }, [activePage]);

  useEffect(() => {
    return () => {
      if (searchBlurTimerRef.current) {
        window.clearTimeout(searchBlurTimerRef.current);
      }
    };
  }, []);

  const unreadNotifs = countUnreadNotifications(tenant.notifications);

  const q = searchQuery.trim().toLowerCase();
  const searchResults: {
    id: string;
    title: string;
    subtitle: string;
    target: GlobalSearchTarget;
  }[] = q
    ? [
        ...tenant.assistants
          .filter(
            (a) =>
              a.name.toLowerCase().includes(q) ||
              a.serviceType.toLowerCase().includes(q) ||
              a.description.toLowerCase().includes(q)
          )
          .slice(0, 3)
          .map((a) => ({
            id: `ast-${a.id}`,
            title: a.name,
            subtitle: `Agentes · ${a.serviceType}`,
            target: { page: 'agents' as NavPage, kind: 'agent' as const, itemId: a.id },
          })),
        ...tenant.contacts
          .filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.company.toLowerCase().includes(q) ||
              c.phone.toLowerCase().includes(q)
          )
          .slice(0, 3)
          .map((c) => ({
            id: `ct-${c.id}`,
            title: c.name,
            subtitle: `Contacto · ${c.company} · ${c.phone}`,
            target: { page: 'crm' as NavPage, kind: 'contact' as const, itemId: c.id },
          })),
        ...tenant.knowledgeDocs
          .filter(
            (d) =>
              d.title.toLowerCase().includes(q) ||
              d.category.toLowerCase().includes(q)
          )
          .slice(0, 3)
          .map((d) => ({
            id: `kb-${d.id}`,
            title: d.title,
            subtitle: `Documento · ${d.category}`,
            target: { page: 'storage' as NavPage, kind: 'doc' as const, itemId: d.id },
          })),
        ...tenant.conversations
          .filter(
            (cv) =>
              cv.contactName.toLowerCase().includes(q) ||
              cv.lastMessage.toLowerCase().includes(q)
          )
          .slice(0, 2)
          .map((cv) => ({
            id: `cv-${cv.id}`,
            title: `Conversa com ${cv.contactName}`,
            subtitle: `Caixa de entrada · ${cv.lastMessage}`,
            target: { page: 'inbox' as NavPage, kind: 'conversation' as const, itemId: cv.id },
          })),
      ]
    : [];

  const isWaConnected = tenant.whatsapp.status === 'connected';
  const adminOperator = tenant.operators.find((o) => o.role === 'Administrador') ?? tenant.operators[0];

  const handleChooseSearchResult = (target: GlobalSearchTarget) => {
    onSelectSearchTarget(target);
    setSearchQuery('');
    setSearchFocused(false);
    setMobileSearchOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#0B5226]/12 bg-white/95 backdrop-blur-xs pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between gap-2 sm:gap-4 px-2.5 sm:px-5 lg:px-6 h-16">
          {/* Left: Mobile drawer trigger (<= 768px) + Mobile Logo + Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              aria-label="Abrir menu lateral"
              data-testid="mobile-menu-button"
              className="max-[768px]:flex min-[769px]:hidden rounded-xl p-2 text-[#0B5226] hover:bg-[#E3F6EA] transition-colors shrink-0 min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-[769px]:hidden shrink-0">
              <ZunoLogo collapsed darkBackground={false} compact />
            </div>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden lg:inline text-[#526058] font-medium truncate">
                {tenant.name}
              </span>
              <span className="hidden lg:inline text-[#526058]/50" aria-hidden="true">
                /
              </span>
              <h1 className="sr-only sm:not-sr-only font-display text-sm sm:text-base font-semibold text-[#0B5226] truncate">
                {PAGE_LABELS[activePage]}
              </h1>
            </div>
          </div>

          {/* Center: Global Search (Desktop & Tablet Landscape) */}
          <div className="relative hidden lg:block flex-1 max-w-md">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#526058]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchBlurTimerRef.current) {
                    window.clearTimeout(searchBlurTimerRef.current);
                    searchBlurTimerRef.current = null;
                  }
                  setSearchFocused(true);
                }}
                onBlur={() => {
                  if (searchBlurTimerRef.current) {
                    window.clearTimeout(searchBlurTimerRef.current);
                  }
                  searchBlurTimerRef.current = window.setTimeout(() => {
                    setSearchFocused(false);
                    searchBlurTimerRef.current = null;
                  }, 180);
                }}
                placeholder="Pesquisar agentes, contactos, documentos..."
                aria-label="Pesquisa global"
                className="w-full min-h-[44px] rounded-xl border border-[#0B5226]/15 bg-[#F4F4F2] pl-9 pr-3 py-2 text-sm text-[#0B5226] placeholder:text-[#526058] focus:border-[#178A3F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#178A3F]/20 transition-colors"
              />
            </div>
            {searchFocused && q && (
              <div
                data-testid="global-search-results"
                onMouseDown={(e) => e.preventDefault()}
                className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-[#0B5226]/15 bg-white shadow-lg p-2 z-50 max-h-[60dvh] overflow-y-auto"
              >
                {searchResults.length > 0 ? (
                  <ul className="divide-y divide-[#F4F4F2]">
                    {searchResults.map((res) => (
                      <li key={res.id}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleChooseSearchResult(res.target)}
                          className="w-full min-h-[44px] text-left px-3 py-2 rounded-lg hover:bg-[#E3F6EA]/70 transition-colors"
                        >
                          <p className="text-sm font-medium text-[#0B5226] truncate">
                            {res.title}
                          </p>
                          <p className="text-[13px] text-[#526058] truncate">
                            {res.subtitle}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-3 text-[13px] text-[#526058]">
                    Sem resultados para "{searchQuery}".
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right: Mobile search trigger, WhatsApp status, Notifications, Help, User Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileSearchOpen((p) => !p)}
              aria-label="Pesquisar na plataforma"
              className="lg:hidden rounded-xl border border-[#0B5226]/15 bg-white p-2 text-[#0B5226] hover:bg-[#E3F6EA] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* WhatsApp Status Button */}
            <button
              type="button"
              onClick={() => onNavigate('integrations')}
              aria-label={`WhatsApp: ${isWaConnected ? 'Conectado' : 'Desconectado'}`}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl border px-2.5 sm:px-3 py-1.5 text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[44px] ${
                isWaConnected
                  ? 'border-[#178A3F]/30 bg-[#E3F6EA] text-[#0B5226] hover:bg-[#d2efdd]'
                  : 'border-[#D63B3A]/35 bg-[#FCEBEB] text-[#791F1F] hover:bg-[#f9dada]'
              }`}
            >
              {isWaConnected ? (
                <Wifi className="h-4 w-4 text-[#178A3F]" />
              ) : (
                <WifiOff className="h-4 w-4 text-[#D63B3A]" />
              )}
              <span className="hidden lg:inline">
                WhatsApp: {isWaConnected ? 'Conectado' : 'Desconectado'}
              </span>
              <span className="lg:hidden">WA</span>
            </button>

            {/* Notifications Trigger */}
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setProfileOpen(false);
              }}
              aria-label="Notificações"
              aria-expanded={notifOpen}
              aria-haspopup="dialog"
              className={`relative rounded-xl border p-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                notifOpen
                  ? 'border-[#D63B3A] bg-[#FCEBEB] text-[#D63B3A] ring-2 ring-[#D63B3A]/20'
                  : 'border-[#0B5226]/15 bg-white text-[#0B5226] hover:bg-[#E3F6EA]'
              }`}
            >
              <Bell className="h-4 w-4" />
              {unreadNotifs > 0 && !notificationsDisabled && (
                <span
                  data-testid="topbar-unread-badge"
                  className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D63B3A] px-1 text-[13px] font-bold text-white tabular-nums leading-none"
                >
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Help FAQ Button */}
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label="Ajuda e perguntas frequentes"
              className="hidden min-[360px]:flex rounded-xl border border-[#0B5226]/15 bg-white p-2 text-[#0B5226] hover:bg-[#E3F6EA] transition-colors min-h-[44px] min-w-[44px] items-center justify-center"
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            {/* User Avatar Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((prev) => !prev);
                  setNotifOpen(false);
                }}
                aria-label="Perfil do utilizador"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-xl border border-[#0B5226]/15 bg-white py-1 pl-1.5 pr-1.5 xl:pr-2.5 hover:bg-[#E3F6EA]/60 transition-colors min-h-[44px] min-w-[44px]"
              >
                <Avatar
                  name={tenant.adminName}
                  src={tenant.adminAvatar}
                  size="sm"
                  online
                />
                <span className="hidden xl:inline text-[13px] font-semibold text-[#0B5226] whitespace-nowrap">
                  {tenant.adminName}
                </span>
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  data-testid="profile-dropdown"
                  className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#0B5226]/15 bg-white shadow-xl p-3 z-50"
                >
                  <div className="pb-2.5 border-b border-[#F4F4F2]">
                    <p className="text-sm font-bold text-[#0B5226]">{tenant.adminName}</p>
                    <p className="text-[13px] text-[#526058]">{tenant.adminRole}</p>
                    <p className="mt-1 text-[13px] font-medium text-[#178A3F]">
                      {tenant.name}
                    </p>
                  </div>

                  <div className="mt-2 flex flex-col gap-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileModalOpen(true);
                        setProfileOpen(false);
                      }}
                      className="flex w-full min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-[#0B5226] hover:bg-[#E3F6EA]"
                    >
                      <User className="h-4 w-4 text-[#178A3F]" />
                      Ver perfil
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onOpenPreferences();
                        setProfileOpen(false);
                      }}
                      className="flex w-full min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-[#0B5226] hover:bg-[#E3F6EA]"
                    >
                      <Settings className="h-4 w-4 text-[#178A3F]" />
                      Preferências
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileOpen(false);
                        onLogout();
                      }}
                      className="flex w-full min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-[#791F1F] hover:bg-[#FCEBEB]"
                    >
                      <LogOut className="h-4 w-4 text-[#D63B3A]" />
                      Terminar sessão
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Mobile/Tablet Search Bar */}
        {mobileSearchOpen && (
          <div className="lg:hidden border-t border-[#0B5226]/10 bg-[#F4F4F2] px-3 py-2.5">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#526058]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar agentes, contactos, documentos..."
                aria-label="Pesquisa global móvel"
                className="w-full min-h-[44px] rounded-xl border border-[#0B5226]/15 bg-white pl-9 pr-11 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(false);
                  setSearchQuery('');
                }}
                aria-label="Fechar pesquisa"
                className="absolute right-1 flex min-h-[44px] min-w-[44px] items-center justify-center text-[#526058]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {q && (
              <div className="mt-2 rounded-xl border border-[#0B5226]/15 bg-white p-2 max-h-[50dvh] overflow-y-auto">
                {searchResults.length > 0 ? (
                  <ul className="divide-y divide-[#F4F4F2]">
                    {searchResults.map((res) => (
                      <li key={res.id}>
                        <button
                          type="button"
                          onClick={() => handleChooseSearchResult(res.target)}
                          className="w-full min-h-[44px] text-left px-3 py-2 rounded-lg hover:bg-[#E3F6EA]"
                        >
                          <p className="text-sm font-semibold text-[#0B5226]">{res.title}</p>
                          <p className="text-[13px] text-[#526058]">{res.subtitle}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-2 py-2 text-[13px] text-[#526058]">
                    Sem resultados para "{searchQuery}".
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Notifications Panel */}
      <NotificationsPanel
        open={notifOpen}
        notifications={tenant.notifications}
        notificationsDisabled={notificationsDisabled}
        onToggleNotificationsDisabled={() =>
          setNotificationsDisabled((prev) => !prev)
        }
        onClose={() => setNotifOpen(false)}
        onOpenNotification={(notification) => {
          onOpenNotification(notification);
          setNotifOpen(false);
        }}
        onMarkAsRead={onMarkNotificationRead}
        onMarkAllAsRead={onMarkAllNotificationsRead}
        onDeleteNotification={onDeleteNotification}
      />

      {/* Profile Modal */}
      {profileModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
          data-testid="profile-modal"
          onClick={() => setProfileModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border border-[#0B5226]/15 bg-white p-5 sm:p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar
                  name={tenant.adminName}
                  src={tenant.adminAvatar}
                  size="lg"
                  online
                />
                <div>
                  <h2
                    id="profile-modal-title"
                    className="font-display text-lg font-bold text-[#0B5226]"
                  >
                    {tenant.adminName}
                  </h2>
                  <p className="text-[13px] font-medium text-[#526058]">
                    {tenant.adminRole}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                aria-label="Fechar perfil"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#526058] hover:bg-[#F4F4F2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-[#E2E7E3] bg-[#F4F4F2]/60 p-4 space-y-2.5 text-[13px]">
              <div className="flex justify-between gap-2">
                <span className="text-[#526058]">Empresa</span>
                <span className="font-semibold text-[#0B5226] text-right">{tenant.name}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#526058]">Email</span>
                <span className="font-medium text-[#0B5226] text-right truncate">
                  {adminOperator?.email ?? tenant.settings.company.supportEmail}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#526058]">Cluster</span>
                <span className="font-medium text-[#0B5226]">{tenant.clusterRegion}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#526058]">Idioma</span>
                <span className="font-medium text-[#0B5226]">
                  {tenant.settings.localization.interfaceLanguage}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-[#178A3F]/20 bg-[#E3F6EA]/50 p-3.5 flex items-start gap-2.5 text-[13px] text-[#0B5226]">
              <ShieldCheck className="h-4 w-4 text-[#178A3F] shrink-0 mt-0.5" />
              <span>
                Perfil com acesso administrativo total aos agentes IA, fluxos, WhatsApp e CRM.
              </span>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setProfileModalOpen(false);
                  onOpenPreferences();
                }}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#178A3F]/30 bg-[#E3F6EA] px-4 py-2 text-sm font-semibold text-[#0B5226] hover:bg-[#d2efdd]"
              >
                Abrir Preferências
              </button>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#178A3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#137334]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help FAQ Modal */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-modal-title"
          data-testid="help-faq-modal"
          onClick={() => setHelpOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl border border-[#0B5226]/15 bg-white p-5 sm:p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="help-modal-title" className="font-display text-lg font-bold text-[#0B5226]">
                  Perguntas Frequentes (FAQ) — ZUNO CHAT
                </h2>
                <p className="mt-1 text-sm text-[#526058]">
                  Respostas rápidas sobre o funcionamento da plataforma.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label="Fechar ajuda"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#526058] hover:bg-[#E3F6EA] hover:text-[#0B5226]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div
                    key={item.q}
                    className={`rounded-xl border transition-colors ${
                      isOpen
                        ? 'border-[#178A3F]/30 bg-[#E3F6EA]/65'
                        : 'border-[#E2E7E3] bg-[#F4F4F2]/70'
                    }`}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                      className="flex w-full min-h-[44px] items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-[#0B5226]"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#178A3F] transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="px-4 pb-3.5 text-[13px] text-[#1A241E] leading-relaxed">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setHelpOpen(false);
                  onNavigate('integrations');
                }}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#178A3F]/30 bg-[#E3F6EA] px-4 py-2 text-sm font-semibold text-[#0B5226] hover:bg-[#d2efdd]"
              >
                <MessageSquare className="h-4 w-4" />
                Ir para Integrações
              </button>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="inline-flex min-h-[44px] items-center rounded-xl bg-[#178A3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#137334]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
