import React, { useEffect, useState } from 'react';
import {
  Bell,
  Bot,
  Building2,
  Clock,
  Globe,
  Languages,
  MessageSquare,
  Palette,
  Save,
  Shield,
  UsersRound,
} from 'lucide-react';
import type {
  AppSettings,
  DepartmentConfig,
  Operator,
} from '../types/zuno';
import { TeamView } from './TeamView';

export type SettingsCategory =
  | 'company'
  | 'identity'
  | 'whatsapp'
  | 'aiGeneral'
  | 'servicePreferences'
  | 'notifications'
  | 'team'
  | 'permissions'
  | 'regional'
  | 'localization';

interface SettingsViewProps {
  settings: AppSettings;
  departments: DepartmentConfig[];
  operators: Operator[];
  initialCategory?: SettingsCategory;
  onClearInitialCategory?: () => void;
  onSaveSettings: (updated: AppSettings) => void;
  onSaveOperator: (op: Operator, isNew: boolean) => void;
  onDeleteOperator: (id: string) => void;
  onToggleOperatorOnline: (id: string) => void;
  onUpdateDepartmentRouting: (
    deptId: string,
    mode: DepartmentConfig['routingMode']
  ) => void;
}

const CATEGORIES: {
  id: SettingsCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'company', label: 'Informações da empresa', icon: Building2 },
  { id: 'team', label: 'Equipa e departamentos', icon: UsersRound },
  { id: 'identity', label: 'Identidade e personalização', icon: Palette },
  { id: 'whatsapp', label: 'Configurações do WhatsApp', icon: MessageSquare },
  { id: 'aiGeneral', label: 'Configurações gerais da IA', icon: Bot },
  { id: 'servicePreferences', label: 'Preferências de atendimento', icon: Clock },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'permissions', label: 'Permissões', icon: Shield },
  { id: 'regional', label: 'Preferências regionais', icon: Globe },
  { id: 'localization', label: 'Idioma e fuso horário', icon: Languages },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  departments,
  operators,
  initialCategory,
  onClearInitialCategory,
  onSaveSettings,
  onSaveOperator,
  onDeleteOperator,
  onToggleOperatorOnline,
  onUpdateDepartmentRouting,
}) => {
  const [activeCat, setActiveCat] = useState<SettingsCategory>(
    initialCategory ?? 'company'
  );
  const [draft, setDraft] = useState<AppSettings>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    if (initialCategory) {
      setActiveCat(initialCategory);
      onClearInitialCategory?.();
    }
  }, [initialCategory]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(draft);
  };

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0B5226]">
          Configurações da Plataforma
        </h2>
        <p className="mt-1 text-sm text-[#526058]">
          Organize os parâmetros operacionais, identidade, IA central e preferências regionais da empresa.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Category Nav: horizontal scroll on mobile/tablet, vertical rail on desktop */}
        <nav
          aria-label="Categorias de configurações"
          className="lg:col-span-3 rounded-2xl border border-[#E2E7E3] bg-white p-2 sm:p-2.5 flex gap-1.5 overflow-x-auto lg:flex-col lg:space-y-1 lg:gap-0 lg:overflow-visible self-start min-w-0"
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeCat === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCat(cat.id)}
                className={`flex shrink-0 lg:w-full min-h-[44px] items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors whitespace-nowrap lg:whitespace-normal ${
                  active
                    ? 'bg-[#178A3F] text-white'
                    : 'text-[#526058] hover:bg-[#E3F6EA]/60 hover:text-[#0B5226]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        {activeCat === 'team' ? (
          <div className="lg:col-span-9 min-w-0">
            <TeamView
              operators={operators}
              departments={departments}
              onSaveOperator={onSaveOperator}
              onDeleteOperator={onDeleteOperator}
              onToggleOperatorOnline={onToggleOperatorOnline}
              onUpdateDepartmentRouting={onUpdateDepartmentRouting}
            />
          </div>
        ) : (
        <form
          onSubmit={handleSave}
          className="lg:col-span-9 rounded-2xl border border-[#E2E7E3] bg-white p-4 sm:p-6 space-y-6 min-w-0"
        >
          {activeCat === 'company' && (
            <div className="space-y-4">
              <h3 className="font-display text-base font-bold text-[#0B5226]">
                Informações da empresa
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#1A241E] mb-1">
                    Nome da empresa
                  </label>
                  <input
                    type="text"
                    value={draft.company.name}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        company: { ...draft.company, name: e.target.value },
                      })
                    }
                    className="w-full min-h-[40px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1A241E] mb-1">
                    NIF / Identificação fiscal
                  </label>
                  <input
                    type="text"
                    value={draft.company.nif}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        company: { ...draft.company, nif: e.target.value },
                      })
                    }
                    className="w-full min-h-[40px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1A241E] mb-1">
                    Setor de atividade
                  </label>
                  <input
                    type="text"
                    value={draft.company.sector}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        company: { ...draft.company, sector: e.target.value },
                      })
                    }
                    className="w-full min-h-[40px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1A241E] mb-1">
                    Email de suporte
                  </label>
                  <input
                    type="email"
                    value={draft.company.supportEmail}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        company: {
                          ...draft.company,
                          supportEmail: e.target.value,
                        },
                      })
                    }
                    className="w-full min-h-[40px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeCat === 'identity' && (
            <div className="space-y-4">
              <h3 className="font-display text-base font-bold text-[#0B5226]">
                Identidade e personalização
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#1A241E] mb-1">
                    Paleta de destaque
                  </label>
                  <select
                    value={draft.identity.brandColor}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        identity: {
                          ...draft.identity,
                          brandColor: e.target.value as AppSettings['identity']['brandColor'],
                        },
                      })
                    }
                    className="w-full min-h-[40px] rounded-xl border border-[#E2E7E3] bg-white px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                  >
                    <option value="royal-blue">Verde & Vermelho Oficial (Padrão ZUNO)</option>
                    <option value="indigo-violet">Verde Suave & Contraste</option>
                    <option value="deep-navy">Verde Escuro Executivo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1A241E] mb-1">
                    Assinatura nas mensagens
                  </label>
                  <input
                    type="text"
                    value={draft.identity.signatureName}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        identity: {
                          ...draft.identity,
                          signatureName: e.target.value,
                        },
                      })
                    }
                    className="w-full min-h-[40px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-[#1A241E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.identity.showAssistantTag}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      identity: {
                        ...draft.identity,
                        showAssistantTag: e.target.checked,
                      },
                    })
                  }
                  className="h-4 w-4 rounded border-[#E2E7E3] accent-[#178A3F]"
                />
                Identificar automaticamente o nome do assistente no cabeçalho das mensagens
              </label>
            </div>
          )}

          {activeCat === 'whatsapp' && (
            <div className="space-y-3">
              <h3 className="font-display text-base font-bold text-[#0B5226]">
                Configurações do WhatsApp
              </h3>
              {[
                { key: 'autoReadReceipts', label: 'Enviar confirmação de leitura automática' },
                { key: 'typingSimulation', label: 'Simular indicador "A escrever..." antes de responder' },
                { key: 'mediaAutoDownload', label: 'Descarregar automaticamente áudios, imagens e PDFs recebidos' },
                { key: 'reconnectAlerts', label: 'Emitir alerta imediato caso a sessão desconecte' },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center gap-3 rounded-xl border border-[#E2E7E3] p-3.5 text-sm text-[#1A241E] hover:bg-[#E3F6EA]/30 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={draft.whatsapp[opt.key as keyof AppSettings['whatsapp']]}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        whatsapp: {
                          ...draft.whatsapp,
                          [opt.key]: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded border-[#E2E7E3] accent-[#178A3F]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          )}

          {activeCat === 'aiGeneral' && (
            <div className="space-y-4">
              <h3 className="font-display text-base font-bold text-[#0B5226]">
                Configurações gerais da IA (Fornecida pelo ZUNO CHAT)
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#1A241E] mb-1">
                    Limiar mínimo de confiança ({draft.aiGeneral.confidenceThreshold}%)
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={95}
                    value={draft.aiGeneral.confidenceThreshold}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        aiGeneral: {
                          ...draft.aiGeneral,
                          confidenceThreshold: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-[#178A3F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1A241E] mb-1">
                    Máximo de interações antes de validar operador
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={draft.aiGeneral.maxTurnsBeforeHumanCheck}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        aiGeneral: {
                          ...draft.aiGeneral,
                          maxTurnsBeforeHumanCheck: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full min-h-[40px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1A241E] mb-1">
                  Mensagem padrão de transferência humana
                </label>
                <textarea
                  rows={2}
                  value={draft.aiGeneral.fallbackMessage}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      aiGeneral: {
                        ...draft.aiGeneral,
                        fallbackMessage: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeCat === 'servicePreferences' && (
            <div className="space-y-4">
              <h3 className="font-display text-base font-bold text-[#0B5226]">
                Preferências de atendimento
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#1A241E] mb-1">
                    Horário de atendimento humano
                  </label>
                  <input
                    type="text"
                    value={draft.servicePreferences.businessHours}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        servicePreferences: {
                          ...draft.servicePreferences,
                          businessHours: e.target.value,
                        },
                      })
                    }
                    className="w-full min-h-[40px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1A241E] mb-1">
                    Meta de SLA (minutos)
                  </label>
                  <input
                    type="number"
                    value={draft.servicePreferences.slaTargetMinutes}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        servicePreferences: {
                          ...draft.servicePreferences,
                          slaTargetMinutes: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full min-h-[40px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeCat === 'notifications' && (
            <div className="space-y-3">
              <h3 className="font-display text-base font-bold text-[#0B5226]">
                Notificações
              </h3>
              {[
                { key: 'newHumanQueueAlert', label: 'Notificar quando um cliente aguarda operador humano' },
                { key: 'slaBreachAlert', label: 'Alertar em tempo real quando uma conversa excede o SLA' },
                { key: 'whatsappDisconnectAlert', label: 'Notificar falhas ou desconexões no WhatsApp' },
                { key: 'dailySummaryEmail', label: 'Enviar resumo diário de métricas por email' },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center gap-3 rounded-xl border border-[#E2E7E3] p-3.5 text-sm text-[#1A241E] hover:bg-[#E3F6EA]/30 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={draft.notifications[opt.key as keyof AppSettings['notifications']]}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        notifications: {
                          ...draft.notifications,
                          [opt.key]: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded border-[#E2E7E3] accent-[#178A3F]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          )}



          {activeCat === 'permissions' && (
            <div className="space-y-3">
              <h3 className="font-display text-base font-bold text-[#0B5226]">
                Matriz de Permissões por Perfil
              </h3>
              <div className="space-y-2 text-xs text-[#1A241E]">
                {[
                  { role: 'Administrador', access: 'Acesso total a WhatsApp, IA, Base de Conhecimento, Automações, Equipa e Configurações.' },
                  { role: 'Supervisor', access: 'Caixa de Entrada, Analytics, Equipa, CRM e Monitorização de Automações.' },
                  { role: 'Operador Sénior', access: 'Caixa de Entrada, CRM, Transferências e Edição de Base de Conhecimento.' },
                  { role: 'Operador', access: 'Caixa de Entrada e Gestão de Contactos atribuídos.' },
                ].map((item) => (
                  <div key={item.role} className="rounded-xl border border-[#E2E7E3] p-3.5">
                    <p className="font-semibold text-[#0B5226]">{item.role}</p>
                    <p className="mt-1 text-[#526058]">{item.access}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeCat === 'regional' && (
            <div className="space-y-4">
              <h3 className="font-display text-base font-bold text-[#0B5226]">
                Preferências regionais
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#1A241E] mb-1">
                    Moeda padrão (CRM)
                  </label>
                  <select
                    value={draft.regional.currency}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        regional: {
                          ...draft.regional,
                          currency: e.target.value as AppSettings['regional']['currency'],
                        },
                      })
                    }
                    className="w-full min-h-[40px] rounded-xl border border-[#E2E7E3] bg-white px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                  >
                    <option value="EUR">Euro (€)</option>
                    <option value="BRL">Real (R$)</option>
                    <option value="USD">Dólar ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1A241E] mb-1">
                    Formato de data
                  </label>
                  <select
                    value={draft.regional.dateFormat}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        regional: {
                          ...draft.regional,
                          dateFormat: e.target.value as AppSettings['regional']['dateFormat'],
                        },
                      })
                    }
                    className="w-full min-h-[40px] rounded-xl border border-[#E2E7E3] bg-white px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                  >
                    <option value="DD/MM/AAAA">DD/MM/AAAA</option>
                    <option value="AAAA-MM-DD">AAAA-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeCat === 'localization' && (
            <div className="space-y-4">
              <h3 className="font-display text-base font-bold text-[#0B5226]">
                Idioma e fuso horário
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#1A241E] mb-1">
                    Idioma da plataforma
                  </label>
                  <select
                    value={draft.localization.interfaceLanguage}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        localization: {
                          ...draft.localization,
                          interfaceLanguage: e.target.value as AppSettings['localization']['interfaceLanguage'],
                        },
                      })
                    }
                    className="w-full min-h-[40px] rounded-xl border border-[#E2E7E3] bg-white px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                  >
                    <option value="Português (Portugal)">Português (Portugal)</option>
                    <option value="Português (Brasil)">Português (Brasil)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1A241E] mb-1">
                    Fuso horário
                  </label>
                  <select
                    value={draft.localization.timezone}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        localization: {
                          ...draft.localization,
                          timezone: e.target.value as AppSettings['localization']['timezone'],
                        },
                      })
                    }
                    className="w-full min-h-[40px] rounded-xl border border-[#E2E7E3] bg-white px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                  >
                    <option value="Europe/Lisbon (GMT+0)">Europe/Lisbon (GMT+0)</option>
                    <option value="America/Sao_Paulo (GMT-3)">America/Sao_Paulo (GMT-3)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-[#E2E7E3]">
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#178A3F] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#137334] transition-colors"
            >
              <Save className="h-4 w-4" />
              Guardar alterações
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
