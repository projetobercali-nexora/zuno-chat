import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  History,
  Phone,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Unplug,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { WhatsAppSession } from '../types/zuno';
import { ConfirmModal } from './ConfirmModal';

interface WhatsAppViewProps {
  session: WhatsAppSession;
  companyName: string;
  onUpdateSession: (updater: (prev: WhatsAppSession) => WhatsAppSession) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

function buildQrGrid(seed: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inFinder =
        (r < 8 && c < 8) ||
        (r < 8 && c >= size - 8) ||
        (r >= size - 8 && c < 8);
      if (inFinder) continue;
      hash = (hash * 1664525 + 1013904223) >>> 0;
      grid[r][c] = (hash & 1) === 1;
    }
  }
  return grid;
}

export const WhatsAppView: React.FC<WhatsAppViewProps> = ({
  session,
  companyName,
  onUpdateSession,
  onNotify,
}) => {
  const [sessionNameInput, setSessionNameInput] = useState(session.sessionName);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDisconnectOpen, setConfirmDisconnectOpen] = useState(false);

  const qrMatrix = buildQrGrid(session.qrSeed);

  const performDisconnect = () => {
    setConfirmDisconnectOpen(false);
    setIsProcessing(true);
    setTimeout(() => {
      onUpdateSession((prev) => ({
        ...prev,
        status: 'disconnected',
        qrSeed: `ZUNO-QR-${Date.now()}`,
        history: [
          {
            id: `wh-${Date.now()}`,
            event: 'Dispositivo desconectado manualmente',
            detail: `Sessão ${prev.sessionName} terminada pelo administrador.`,
            timestamp: 'Agora mesmo',
            type: 'disconnected',
          },
          ...prev.history,
        ],
      }));
      setIsProcessing(false);
    }, 250);
  };

  const handleGenerateQR = () => {
    onUpdateSession((prev) => ({
      ...prev,
      status: 'pairing',
      sessionName: sessionNameInput.trim() || prev.sessionName,
      qrSeed: `ZUNO-QR-${Math.floor(Math.random() * 999999)}`,
    }));
  };

  const handleConfirmPairing = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onUpdateSession((prev) => ({
        ...prev,
        status: 'connected',
        sessionName: sessionNameInput.trim() || prev.sessionName,
        connectedSince: 'Agora mesmo',
        latencyMs: 88,
        history: [
          {
            id: `wh-${Date.now()}`,
            event: 'Dispositivo conectado via QR Code',
            detail: `Sessão ${
              sessionNameInput.trim() || prev.sessionName
            } sincronizada com o número ${prev.phoneNumber}.`,
            timestamp: 'Agora mesmo',
            type: 'connected',
          },
          ...prev.history,
        ],
      }));
      setIsProcessing(false);
    }, 300);
  };

  const handleReconnect = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onUpdateSession((prev) => ({
        ...prev,
        status: 'connected',
        latencyMs: 82,
        history: [
          {
            id: `wh-${Date.now()}`,
            event: 'Sessão reconectada',
            detail: 'Ligação verificada com a API externa de WhatsApp.',
            timestamp: 'Agora mesmo',
            type: 'reconnected',
          },
          ...prev.history,
        ],
      }));
      setIsProcessing(false);
    }, 300);
  };

  const handleCopyWebhook = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(session.webhookUrl);
      }
      onNotify('URL de webhook copiado para a área de transferência.', 'success');
    } catch {
      onNotify('Não foi possível copiar o URL de webhook.', 'error');
    }
  };

  const isConnected = session.status === 'connected';
  const isPairing = session.status === 'pairing';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0B5226]">
            Conexão WhatsApp Empresarial
          </h2>
          <p className="mt-1 text-[13px] sm:text-sm text-[#526058]">
            Canal oficial e exclusivo de comunicação de {companyName} ligado através da API externa de WhatsApp.
          </p>
        </div>

        <div
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] font-semibold self-start sm:self-auto ${
            isConnected || isPairing
              ? 'border-[#178A3F]/30 bg-[#E3F6EA] text-[#0B5226]'
              : 'border-[#D63B3A]/35 bg-[#FCEBEB] text-[#791F1F]'
          }`}
        >
          {isConnected ? (
            <Wifi className="h-4 w-4 text-[#178A3F]" />
          ) : isPairing ? (
            <QrCode className="h-4 w-4 text-[#178A3F]" />
          ) : (
            <WifiOff className="h-4 w-4 text-[#D63B3A]" />
          )}
          <span>
            Estado:{' '}
            {isConnected
              ? 'Conexão Ativa'
              : isPairing
              ? 'A aguardar leitura do QR Code'
              : 'Conexão Inativa'}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: QR Code & Pairing Panel */}
        <div className="lg:col-span-5 rounded-2xl border border-[#0B5226]/12 bg-white p-5 sm:p-6 flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-between text-left pb-4 border-b border-[#F4F4F2]">
            <div>
              <h3 className="font-display text-base font-semibold text-[#0B5226]">
                Emparelhamento por QR Code
              </h3>
              <p className="text-[13px] text-[#526058]">
                Abra o WhatsApp no telemóvel · Dispositivos associados
              </p>
            </div>
            <Smartphone className="h-5 w-5 text-[#178A3F] shrink-0" />
          </div>

          <div className="my-6 flex flex-col items-center">
            <div className="relative rounded-2xl border border-[#0B5226]/15 bg-white p-4 shadow-xs">
              <svg
                viewBox="0 0 21 21"
                className={`h-44 w-44 sm:h-48 sm:w-48 ${
                  isConnected ? 'opacity-25' : 'opacity-100'
                }`}
                shapeRendering="crispEdges"
                aria-label="QR Code de conexão WhatsApp"
              >
                <rect width="21" height="21" fill="#FFFFFF" />
                {qrMatrix.map((row, rIdx) =>
                  row.map(
                    (cell, cIdx) =>
                      cell && (
                        <rect
                          key={`${rIdx}-${cIdx}`}
                          x={cIdx}
                          y={rIdx}
                          width="1"
                          height="1"
                          fill="#0B5226"
                        />
                      )
                  )
                )}
              </svg>

              {isConnected && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white/85 backdrop-blur-xs p-4">
                  <CheckCircle2 className="h-10 w-10 text-[#178A3F]" />
                  <p className="mt-2 font-display text-sm font-bold text-[#0B5226]">
                    WhatsApp Conectado
                  </p>
                  <p className="mt-0.5 font-mono text-[13px] text-[#0B5226]">
                    {session.phoneNumber}
                  </p>
                </div>
              )}
            </div>

            <p className="mt-3 text-[13px] text-[#526058] max-w-xs">
              {isConnected
                ? 'A sessão está sincronizada em tempo real. Pode reconectar para atualizar a chave ou desconectar a qualquer momento.'
                : 'Aponte a câmara do WhatsApp Business para este código QR ou simule a confirmação abaixo para testar o fluxo.'}
            </p>
          </div>

          <div className="w-full space-y-2.5">
            {isConnected ? (
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleReconnect}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#178A3F]/30 bg-[#E3F6EA] px-4 py-2.5 text-[13px] font-semibold text-[#0B5226] hover:bg-[#d2efdd] transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  Reconectar
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setConfirmDisconnectOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D63B3A]/30 bg-[#FCEBEB] px-4 py-2.5 text-[13px] font-semibold text-[#791F1F] hover:bg-[#f9dada] transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  <Unplug className="h-4 w-4 text-[#D63B3A]" />
                  Desconectar
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmPairing}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#178A3F] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#137334] transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar leitura e conectar dispositivo
                </button>
                <button
                  type="button"
                  onClick={handleGenerateQR}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#0B5226]/20 px-4 py-2 text-[13px] font-semibold text-[#0B5226] hover:bg-[#E3F6EA] transition-colors min-h-[44px]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Gerar novo QR Code
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Session Info & Connection History */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-[#0B5226]/12 bg-white p-5 sm:p-6">
            <h3 className="font-display text-base font-semibold text-[#0B5226]">
              Detalhes da Sessão e Dispositivo
            </h3>
            <p className="mt-0.5 text-[13px] text-[#526058]">
              Configuração técnica da instância WhatsApp ligada à API externa.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#0B5226]/12 bg-[#F4F4F2] p-4">
                <div className="flex items-center gap-2 text-[13px] text-[#526058]">
                  <Phone className="h-4 w-4 text-[#178A3F]" />
                  Número conectado
                </div>
                <p className="mt-1.5 font-mono text-sm font-semibold text-[#0B5226]">
                  {session.phoneNumber}
                </p>
              </div>

              <div className="rounded-xl border border-[#0B5226]/12 bg-[#F4F4F2] p-4">
                <label
                  htmlFor="wa-session-name"
                  className="block text-[13px] text-[#526058]"
                >
                  Nome da sessão
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    id="wa-session-name"
                    type="text"
                    value={sessionNameInput}
                    onChange={(e) => setSessionNameInput(e.target.value)}
                    className="w-full min-w-0 min-h-[44px] rounded-xl border border-[#0B5226]/15 bg-white px-3 py-2 text-[13px] font-semibold text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSession((prev) => ({
                        ...prev,
                        sessionName: sessionNameInput.trim() || prev.sessionName,
                      }))
                    }
                    className="min-h-[44px] rounded-xl bg-[#0B5226] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#178A3F] shrink-0"
                  >
                    Guardar
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[#0B5226]/12 bg-[#F4F4F2] p-4">
                <p className="text-[13px] text-[#526058]">Provedor / Canal</p>
                <p className="mt-1.5 text-sm font-semibold text-[#0B5226]">
                  {session.apiProvider}
                </p>
                <p className="mt-0.5 text-[13px] text-[#526058]">{session.deviceModel}</p>
              </div>

              <div className="rounded-xl border border-[#0B5226]/12 bg-[#F4F4F2] p-4 space-y-2">
                <div>
                  <p className="text-[13px] text-[#526058]">Conectado desde · Latência</p>
                  <p className="mt-1 text-sm font-semibold text-[#0B5226] tabular-nums">
                    {isConnected ? `${session.connectedSince} · ${session.latencyMs} ms` : 'Sessão terminada'}
                  </p>
                  <p className="mt-0.5 text-[13px] text-[#526058] truncate">
                    Webhook: {session.webhookUrl}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyWebhook}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#178A3F]/30 bg-white px-3 py-2 text-[13px] font-semibold text-[#0B5226] hover:bg-[#E3F6EA] transition-colors"
                >
                  <Copy className="h-4 w-4 text-[#178A3F]" />
                  Copiar URL webhook
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[#178A3F]/25 bg-[#E3F6EA] px-4 py-3 text-[13px] text-[#0B5226]">
              <ShieldCheck className="h-4 w-4 text-[#178A3F] shrink-0" />
              <span>
                Comunicação encriptada ponta-a-ponta. Todas as mensagens recebidas acionam automaticamente os assistentes IA e workflows configurados.
              </span>
            </div>
          </div>

          {/* Connection History */}
          <div className="rounded-2xl border border-[#0B5226]/12 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#F4F4F2]">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[#178A3F]" />
                <h3 className="font-display text-base font-semibold text-[#0B5226]">
                  Histórico de conexão
                </h3>
              </div>
              <span className="text-[13px] text-[#526058] tabular-nums">
                {session.history.length} eventos
              </span>
            </div>

            <ul className="mt-4 divide-y divide-[#F4F4F2]">
              {session.history.map((item) => (
                <li key={item.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <p
                      className={`text-sm font-semibold ${
                        item.type === 'disconnected'
                          ? 'text-[#791F1F]'
                          : item.type === 'warning'
                          ? 'text-[#D63B3A]'
                          : 'text-[#0B5226]'
                      }`}
                    >
                      {item.event}
                    </p>
                    <p className="mt-0.5 text-[13px] text-[#526058]">{item.detail}</p>
                  </div>
                  <span className="text-[13px] text-[#526058] whitespace-nowrap shrink-0 tabular-nums">
                    {item.timestamp}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmDisconnectOpen}
        title="Desconectar WhatsApp"
        description="A sessão WhatsApp será desligada e os agentes IA deixarão de responder até confirmar um novo emparelhamento por QR Code."
        confirmLabel="Desconectar"
        onCancel={() => setConfirmDisconnectOpen(false)}
        onConfirm={performDisconnect}
      />
    </div>
  );
};
