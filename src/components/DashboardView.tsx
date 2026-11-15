import React from 'react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle2,
  GitBranch,
  Inbox,
  MessageSquarePlus,
  Plus,
  Sparkles,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { NavPage, WorkspaceTenant } from '../types/zuno';
import { computeAccountOverviewMetrics } from '../utils/zunoLogic';

export type DashboardQuickAction =
  | 'create_agent'
  | 'open_inbox'
  | 'add_contact'
  | 'create_flow'
  | 'configure_whatsapp'
  | 'view_reports';

interface DashboardViewProps {
  tenant: WorkspaceTenant;
  onNavigate: (page: NavPage) => void;
  onQuickAction: (action: DashboardQuickAction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tenant,
  onNavigate,
  onQuickAction,
}) => {
  const metrics = computeAccountOverviewMetrics(
    tenant.assistants,
    tenant.conversations,
    tenant.contacts,
    tenant.workflows,
    tenant.whatsapp.status,
    tenant.notifications
  );

  const recentEventsCount = Math.min(
    5,
    tenant.notifications.slice(0, 3).length + tenant.workflowLogs.slice(0, 2).length
  );

  const accountSummaryCards = [
    {
      label: 'Total de agentes',
      value: String(metrics.totalAgents),
      subtitle: `${metrics.activeAgents} ativos no atendimento`,
      icon: Bot,
      accent: 'green' as const,
      onClick: () => onNavigate('agents'),
    },
    {
      label: 'Conversas ativas',
      value: String(metrics.activeConversations),
      subtitle:
        metrics.waitingHumanCount > 0
          ? `${metrics.waitingHumanCount} a aguardar operador`
          : 'Todas acompanhadas',
      icon: Inbox,
      accent: metrics.waitingHumanCount > 0 ? ('red' as const) : ('green' as const),
      onClick: () => onNavigate('inbox'),
    },
    {
      label: 'Contactos registados',
      value: String(metrics.totalContacts),
      subtitle: 'Base CRM sincronizada',
      icon: Users,
      accent: 'green' as const,
      onClick: () => onNavigate('crm'),
    },
    {
      label: 'Automações ativas',
      value: String(metrics.activeWorkflows),
      subtitle: `de ${metrics.totalWorkflows} fluxos configurados`,
      icon: GitBranch,
      accent: 'green' as const,
      onClick: () => onNavigate('flows'),
    },
    {
      label: 'Estado da conexão WhatsApp',
      value: metrics.whatsappConnected ? 'Conectado' : 'Desconectado',
      subtitle: tenant.whatsapp.phoneNumber,
      icon: metrics.whatsappConnected ? Wifi : WifiOff,
      accent: metrics.whatsappConnected ? ('green' as const) : ('red' as const),
      onClick: () => onNavigate('integrations'),
    },
    {
      label: 'Atividade recente',
      value: `${recentEventsCount} eventos`,
      subtitle:
        metrics.unreadNotifications > 0
          ? `${metrics.unreadNotifications} notificações por ler`
          : 'Atualizado agora',
      icon: Activity,
      accent: 'green' as const,
      onClick: () => onNavigate('analytics'),
    },
  ];

  const quickActions: {
    id: DashboardQuickAction;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    primary?: boolean;
  }[] = [
    {
      id: 'create_agent',
      label: '+ Criar agente',
      description: 'Configurar novo agente IA para WhatsApp',
      icon: Plus,
      primary: true,
    },
    {
      id: 'open_inbox',
      label: 'Abrir caixa de entrada',
      description: 'Responder ou assumir conversas ativas',
      icon: MessageSquarePlus,
    },
    {
      id: 'add_contact',
      label: 'Adicionar contacto',
      description: 'Registar novo lead no CRM',
      icon: UserPlus,
    },
    {
      id: 'create_flow',
      label: 'Criar automação',
      description: 'Construir fluxo de conversa automático',
      icon: GitBranch,
    },
    {
      id: 'configure_whatsapp',
      label: 'Configurar WhatsApp',
      description: 'Sessão empresarial, QR Code e webhook',
      icon: Wifi,
    },
    {
      id: 'view_reports',
      label: 'Consultar relatórios',
      description: 'Indicadores de desempenho e SLA',
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6 pb-20 sm:pb-24">
      {/* Welcome Banner */}
      <section
        aria-label="Boas-vindas e estado da plataforma"
        className="rounded-2xl border border-[#178A3F]/20 bg-white p-5 sm:p-6 shadow-xs"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-lg bg-[#E3F6EA] px-2.5 py-1 text-[13px] font-semibold text-[#0B5226]">
              <Sparkles className="h-3.5 w-3.5 text-[#178A3F]" />
              <span>{tenant.name}</span>
              <span aria-hidden="true">·</span>
              <span>{tenant.sector}</span>
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0B5226]">
              Bem-vindo, {tenant.adminName}
            </h2>

            <p className="text-[13px] sm:text-sm text-[#526058] max-w-2xl leading-relaxed">
              {metrics.whatsappConnected
                ? `A plataforma ZUNO CHAT está operacional (${tenant.clusterRegion}) com ${metrics.activeAgents} agentes IA ativos, ${metrics.activeWorkflows} automações em execução e WhatsApp ligado.`
                : `Atenção: a sessão WhatsApp encontra-se desconectada. Reative a ligação em Integrações para retomar os ${metrics.activeAgents} agentes IA.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <span
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold ${
                metrics.whatsappConnected
                  ? 'bg-[#E3F6EA] text-[#0B5226]'
                  : 'bg-[#FCEBEB] text-[#791F1F]'
              }`}
            >
              {metrics.whatsappConnected ? (
                <CheckCircle2 className="h-4 w-4 text-[#178A3F]" />
              ) : (
                <WifiOff className="h-4 w-4 text-[#D63B3A]" />
              )}
              {metrics.whatsappConnected ? 'Plataforma Operacional' : 'WhatsApp Inativo'}
            </span>

            <button
              type="button"
              onClick={() => onQuickAction('open_inbox')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#178A3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#137334] transition-colors"
            >
              Abrir Caixa de Entrada
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Resumo da Conta */}
      <section aria-labelledby="resumo-conta-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3
            id="resumo-conta-heading"
            className="font-display text-base font-bold text-[#0B5226]"
          >
            Resumo da conta
          </h3>
          <span className="text-[13px] text-[#526058]">Estado atual da operação</span>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
          {accountSummaryCards.map((card) => {
            const Icon = card.icon;
            const isRed = card.accent === 'red';
            return (
              <button
                key={card.label}
                type="button"
                onClick={card.onClick}
                className="group flex h-full min-h-[44px] flex-col justify-between rounded-2xl border border-[#E2E7E3] bg-white p-3.5 sm:p-5 text-left transition-colors hover:border-[#178A3F]/50 hover:bg-[#E3F6EA]/20"
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <p className="text-[13px] font-medium text-[#526058] leading-snug">
                    {card.label}
                  </p>
                  <div
                    className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isRed
                        ? 'bg-[#FCEBEB] text-[#D63B3A]'
                        : 'bg-[#E3F6EA] text-[#178A3F] group-hover:bg-[#178A3F] group-hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>

                <div className="mt-2.5 min-w-0 w-full">
                  <p
                    className={`font-display text-lg sm:text-2xl font-bold tabular-nums truncate ${
                      isRed ? 'text-[#791F1F]' : 'text-[#0B5226]'
                    }`}
                  >
                    {card.value}
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#526058] truncate">
                    {card.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Ações Rápidas */}
      <section aria-labelledby="acoes-rapidas-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3
            id="acoes-rapidas-heading"
            className="font-display text-base font-bold text-[#0B5226]"
          >
            Ações rápidas
          </h3>
          <span className="text-[13px] text-[#526058]">Atalhos operacionais</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onQuickAction(action.id)}
                className={`flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-colors min-h-[64px] ${
                  action.primary
                    ? 'border-[#178A3F] bg-[#178A3F] text-white hover:bg-[#137334]'
                    : 'border-[#E2E7E3] bg-white text-[#0B5226] hover:border-[#178A3F]/50 hover:bg-[#E3F6EA]/35'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    action.primary
                      ? 'bg-white/20 text-white'
                      : 'bg-[#E3F6EA] text-[#178A3F]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm sm:text-[15px] font-bold truncate ${
                      action.primary ? 'text-white' : 'text-[#0B5226]'
                    }`}
                  >
                    {action.label}
                  </p>
                  <p
                    className={`mt-0.5 text-[13px] truncate ${
                      action.primary ? 'text-white/95' : 'text-[#526058]'
                    }`}
                  >
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Floating Round Assistant Button */}
      <button
        type="button"
        data-testid="floating-assistant-button"
        onClick={() => onNavigate('agents')}
        aria-label="Abrir assistente IA"
        title="Assistente IA"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] sm:bottom-[max(1.25rem,env(safe-area-inset-bottom))] sm:right-[max(1rem,env(safe-area-inset-right))] z-30 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#178A3F] text-white shadow-lg ring-2 ring-white hover:bg-[#137334] active:bg-[#0B5226] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B5226]"
      >
        <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
    </div>
  );
};
