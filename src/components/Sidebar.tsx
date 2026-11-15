import React from 'react';
import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  Database,
  GitBranch,
  Inbox,
  LayoutDashboard,
  Plug,
  Settings,
  Users,
  X,
} from 'lucide-react';
import type { NavPage, WorkspaceTenant } from '../types/zuno';
import { countUnreadInboxMessages } from '../utils/zunoLogic';
import { ZunoLogo } from './ZunoLogo';
import { Avatar } from './Avatar';

interface SidebarProps {
  activePage: NavPage;
  onSelectPage: (page: NavPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  activeTenant: WorkspaceTenant;
}

interface NavItemConfig {
  id: NavPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  activeTenant,
}) => {
  const unreadInboxCount = countUnreadInboxMessages(activeTenant.conversations);

  const navItems: NavItemConfig[] = [
    { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
    { id: 'agents', label: 'Agentes', icon: Bot },
    {
      id: 'inbox',
      label: 'Caixa de entrada',
      icon: Inbox,
      badge: unreadInboxCount > 0 ? unreadInboxCount : undefined,
    },
    { id: 'crm', label: 'CRM', icon: Users },
    { id: 'flows', label: 'Fluxos de conversa', icon: GitBranch },
    { id: 'storage', label: 'Armazenamento', icon: Database },
    { id: 'integrations', label: 'Integrações', icon: Plug },
    { id: 'analytics', label: 'Analytics e relatórios', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleNavClick = (id: NavPage) => {
    onSelectPage(id);
    onCloseMobile();
  };

  const sidebarContent = (isMobile: boolean) => {
    const isCollapsed = !isMobile && collapsed;
    return (
      <div className="flex h-full flex-col bg-[#0B5226] text-white border-r border-[#083B1B]">
        {/* Header & Official Logo */}
        <div
          className={`flex items-center justify-between border-b border-white/15 pt-[max(0.875rem,env(safe-area-inset-top))] ${
            isCollapsed ? 'px-2 pb-3.5 flex-col gap-2' : 'px-3.5 pb-3.5'
          }`}
        >
          <ZunoLogo collapsed={isCollapsed} darkBackground compact={isCollapsed} />
          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Fechar menu"
              className="rounded-xl p-2 text-[#E3F6EA] hover:bg-white/15 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
              className="rounded-xl p-2 text-[#E3F6EA]/90 hover:bg-white/15 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-white"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav
          aria-label={isMobile ? 'Navegação móvel' : 'Navegação principal'}
          className="flex-1 overflow-y-auto px-2.5 py-3 space-y-1"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap min-h-[44px] focus-visible:outline-2 focus-visible:outline-white ${
                  isActive
                    ? 'bg-[#178A3F] text-white shadow-sm ring-1 ring-white/25'
                    : 'text-[#E3F6EA]/90 hover:bg-white/10 hover:text-white'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    isActive ? 'text-white' : 'text-[#E3F6EA]/85 group-hover:text-white'
                  }`}
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        data-testid={isMobile ? 'mobile-inbox-badge' : 'desktop-inbox-badge'}
                        className="ml-auto tabular-nums text-[13px] font-bold px-2 py-0.5 rounded-md bg-[#D63B3A] text-white"
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {isCollapsed && item.badge !== undefined && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-[#D63B3A]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile, Company & Platform Status */}
        <div className="mt-auto border-t border-white/15 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-2.5">
          {!isCollapsed && (
            <div className="rounded-xl bg-black/20 border border-white/15 px-3 py-2.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#E3F6EA] font-medium">Plataforma Zuno</span>
                <span className="text-[#E3F6EA] font-semibold">Operacional</span>
              </div>
              <p className="mt-0.5 text-[13px] text-[#E3F6EA]/80 truncate">
                {activeTenant.name} · {activeTenant.clusterRegion}
              </p>
            </div>
          )}

          <div
            className={`flex items-center gap-2.5 rounded-xl px-1.5 py-1 ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <Avatar
              name={activeTenant.adminName}
              src={activeTenant.adminAvatar}
              size="sm"
              online
            />
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white truncate">
                  {activeTenant.adminName}
                </p>
                <p className="text-[13px] text-[#E3F6EA]/85 truncate">
                  {activeTenant.adminRole}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop & Large Tablet Sidebar (> 768px) */}
      <aside
        className={`hidden min-[769px]:block shrink-0 transition-all duration-200 ${
          collapsed ? 'w-[78px]' : 'w-[264px]'
        }`}
      >
        <div className="sticky top-0 h-[100dvh]">{sidebarContent(false)}</div>
      </aside>

      {/* Mobile & Small Tablet Drawer (<= 768px) sliding smoothly from left */}
      <div
        data-testid="mobile-sidebar-drawer"
        aria-hidden={!mobileOpen}
        className={`fixed inset-0 z-50 flex min-[769px]:hidden transition-all duration-200 ${
          mobileOpen
            ? 'opacity-100 pointer-events-auto visible'
            : 'opacity-0 pointer-events-none invisible'
        }`}
      >
        <div
          data-testid="mobile-sidebar-backdrop"
          className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          className={`relative z-10 w-[280px] max-w-[85vw] h-[100dvh] transform transition-transform duration-200 ease-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent(true)}
        </div>
      </div>
    </>
  );
};
