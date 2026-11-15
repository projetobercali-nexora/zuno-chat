import React, { useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Plug,
  Webhook,
} from 'lucide-react';
import type { WhatsAppSession } from '../types/zuno';
import { ConfirmModal } from './ConfirmModal';
import { WhatsAppView } from './WhatsAppView';

interface IntegrationsViewProps {
  session: WhatsAppSession;
  companyName: string;
  onUpdateSession: (updater: (prev: WhatsAppSession) => WhatsAppSession) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

interface SystemIntegration {
  id: string;
  name: string;
  category: string;
  description: string;
  connected: boolean;
  endpointLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  session,
  companyName,
  onUpdateSession,
  onNotify,
}) => {
  const [integrations, setIntegrations] = useState<SystemIntegration[]>([
    {
      id: 'int-webhooks',
      name: 'Webhooks & API REST Empresarial',
      category: 'Eventos em Tempo Real',
      description:
        'Envia notificações automáticas de novas conversas, leads qualificados e transferências para o ERP ou sistema interno.',
      connected: true,
      endpointLabel: session.webhookUrl,
      icon: Webhook,
    },
    {
      id: 'int-pdf-docs',
      name: 'Extrator de Documentos e Faturas PDF',
      category: 'Processamento Documental',
      description:
        'Interpreta anexos PDF enviados por clientes no WhatsApp e disponibiliza dados estruturados aos agentes IA.',
      connected: true,
      endpointLabel: 'Motor OCR & PDF ativo',
      icon: FileText,
    },
  ]);

  const [pauseTarget, setPauseTarget] = useState<SystemIntegration | null>(null);

  const applyToggleIntegration = (id: string) => {
    const target = integrations.find((item) => item.id === id);
    if (!target) return;
    const nextConnected = !target.connected;
    setIntegrations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, connected: nextConnected } : item
      )
    );
    onNotify(
      `${target.name} ${nextConnected ? 'ativada' : 'pausada'} com sucesso.`,
      'success'
    );
  };

  return (
    <div className="space-y-8">
      {/* Primary Channel: Full Existing WhatsApp Connection & QR Management */}
      <WhatsAppView
        session={session}
        companyName={companyName}
        onUpdateSession={onUpdateSession}
        onNotify={onNotify}
      />

      {/* Additional Platform & API Integrations */}
      <section aria-labelledby="integracoes-sistema-heading" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#178A3F]">
              <Plug className="h-4 w-4" />
              <span>Conectores Empresariais</span>
            </div>
            <h3
              id="integracoes-sistema-heading"
              className="mt-1 font-display text-lg font-bold text-[#0B5226]"
            >
              Outras Integrações e Webhooks
            </h3>
            <p className="text-[13px] sm:text-sm text-[#526058]">
              Ligue eventos do atendimento WhatsApp e dos agentes IA aos sistemas internos de {companyName}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {integrations.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-[#E2E7E3] bg-white p-5 space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F6EA] text-[#178A3F]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-semibold ${
                        item.connected
                          ? 'bg-[#E3F6EA] text-[#0B5226]'
                          : 'bg-[#FCEBEB] text-[#791F1F]'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {item.connected ? 'Conectada' : 'Pausada'}
                    </span>
                  </div>

                  <p className="mt-3 text-[13px] font-semibold text-[#526058]">
                    {item.category}
                  </p>
                  <h4 className="mt-0.5 font-display text-sm sm:text-base font-bold text-[#0B5226]">
                    {item.name}
                  </h4>
                  <p className="mt-1.5 text-[13px] text-[#526058] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#F4F4F2] space-y-2.5">
                  <p className="font-mono text-[13px] text-[#0B5226]/85 truncate">
                    {item.endpointLabel}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.connected) {
                        setPauseTarget(item);
                      } else {
                        applyToggleIntegration(item.id);
                      }
                    }}
                    className={`w-full min-h-[44px] rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors ${
                      item.connected
                        ? 'border border-[#E2E7E3] bg-[#F4F4F2] text-[#0B5226] hover:bg-[#FCEBEB] hover:text-[#791F1F]'
                        : 'bg-[#178A3F] text-white hover:bg-[#137334]'
                    }`}
                  >
                    {item.connected ? 'Pausar integração' : 'Ativar integração'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <ConfirmModal
        open={Boolean(pauseTarget)}
        title="Pausar integração"
        description={
          pauseTarget
            ? `Tem a certeza de que pretende pausar "${pauseTarget.name}"? A sincronização automática ficará suspensa até reativação.`
            : ''
        }
        confirmLabel="Pausar"
        onCancel={() => setPauseTarget(null)}
        onConfirm={() => {
          if (pauseTarget) {
            applyToggleIntegration(pauseTarget.id);
          }
          setPauseTarget(null);
        }}
      />
    </div>
  );
};
