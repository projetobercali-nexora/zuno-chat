import React, { useState } from 'react';
import {
  Bot,
  Download,
  FileSpreadsheet,
  GitBranch,
  MessageSquare,
  UsersRound,
} from 'lucide-react';
import type {
  AIAssistant,
  Contact,
  Conversation,
  DepartmentConfig,
  Operator,
  Workflow,
  WorkflowExecutionLog,
} from '../types/zuno';
import {
  computeAnalyticsSummary,
  type AnalyticsPeriod,
} from '../utils/zunoLogic';
import { EmptyState } from './EmptyState';

interface AnalyticsViewProps {
  assistants: AIAssistant[];
  conversations: Conversation[];
  contacts: Contact[];
  operators: Operator[];
  departments: DepartmentConfig[];
  workflows: Workflow[];
  workflowLogs: WorkflowExecutionLog[];
  companyName: string;
  onNotifyExport: (format: 'PDF' | 'Excel') => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  assistants,
  conversations,
  contacts,
  operators,
  departments,
  workflows,
  workflowLogs,
  companyName,
  onNotifyExport,
}) => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('weekly');
  const summary = computeAnalyticsSummary(period, {
    assistants,
    conversations,
    contacts,
    operators,
    departments,
    workflows,
    workflowLogs,
  });

  const maxBar = Math.max(
    ...summary.series.map((s) => s.ai + s.human),
    10
  );

  const handleExportExcel = () => {
    const rows = [
      ['Relatório ZUNO CHAT', companyName, summary.periodLabel],
      ['Indicador', 'Valor'],
      ['Total de conversas', String(summary.totalConversations)],
      ['Total de mensagens', String(summary.totalMessages)],
      ['Novos clientes', String(summary.newClients)],
      ['Clientes recorrentes', String(summary.returningClients)],
      ['Conversas resolvidas', String(summary.resolvedConversations)],
      ['Conversas pendentes', String(summary.pendingConversations)],
      ['Conversas atendidas pela IA', String(summary.aiHandled)],
      ['Taxa de resolução automática (%)', String(summary.autoResolutionRate)],
      ['Transferências para humanos', String(summary.humanTransfers)],
      ['Tempo médio de resposta (s)', String(summary.avgResponseSec)],
      ['Execuções de automações', String(summary.workflowExecutions)],
      ['Execuções com erro', String(summary.workflowErrorCount)],
    ];
    const csvContent = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `zuno-chat-relatorio-${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotifyExport('Excel');
  };

  const handleExportPDF = () => {
    onNotifyExport('PDF');
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Header & Period/Export Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0B5226]">
            Analytics e Relatórios
          </h2>
          <p className="mt-1 text-sm text-[#526058]">
            Análise detalhada de atendimento, desempenho da inteligência artificial, produtividade da equipa e automações.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded-xl border border-[#E2E7E3] bg-white p-1">
            {(
              [
                { id: 'daily', label: 'Diário' },
                { id: 'weekly', label: 'Semanal' },
                { id: 'monthly', label: 'Mensal' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                className={`min-h-[44px] rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                  period === opt.id
                    ? 'bg-[#0B5226] text-white'
                    : 'text-[#526058] hover:text-[#0B5226]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#E2E7E3] bg-white px-4 py-2 text-[13px] font-semibold text-[#0B5226] hover:bg-[#E3F6EA]/50 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#178A3F]" />
            Exportar Excel
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#178A3F] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#137334] transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Group 1: Indicadores de Atendimento (6 metrics) */}
      <section className="rounded-2xl border border-[#E2E7E3] bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 pb-4 border-b border-[#E2E7E3]">
          <MessageSquare className="h-4 w-4 text-[#178A3F]" />
          <h3 className="font-display text-sm sm:text-base font-bold text-[#0B5226]">
            Indicadores de Atendimento · {summary.periodLabel}
          </h3>
        </div>
        <div className="mt-4 grid grid-cols-1 min-[360px]:grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Total de conversas', val: summary.totalConversations, highlight: 'dark' },
            { label: 'Total de mensagens', val: summary.totalMessages, highlight: 'dark' },
            { label: 'Novos clientes', val: summary.newClients, highlight: 'green' },
            { label: 'Clientes recorrentes', val: summary.returningClients, highlight: 'dark' },
            { label: 'Conversas resolvidas', val: summary.resolvedConversations, highlight: 'green' },
            { label: 'Conversas pendentes', val: summary.pendingConversations, highlight: 'red' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[13px] text-[#526058]">{item.label}</p>
              <p
                className={`mt-1 font-display text-xl font-bold tabular-nums ${
                  item.highlight === 'green'
                    ? 'text-[#178A3F]'
                    : item.highlight === 'red'
                    ? 'text-[#D63B3A]'
                    : 'text-[#0B5226]'
                }`}
              >
                {item.val.toLocaleString('pt-PT')}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Chart + AI Performance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Stacked Interactive Chart */}
        <div className="lg:col-span-7 rounded-2xl border border-[#E2E7E3] bg-white p-4 sm:p-5 min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-[#0B5226]">
                Evolução de Conversas (IA vs Humanos)
              </h3>
              <p className="text-[13px] text-[#526058]">
                Comparação por intervalo no relatório {summary.periodLabel.toLowerCase()}
              </p>
            </div>
            <div className="flex items-center gap-4 text-[13px] shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[#0B5226] font-medium">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#178A3F]" />
                IA Zuno
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#791F1F] font-medium">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#D63B3A]" />
                Operadores
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between gap-1.5 sm:gap-3 h-52 pt-4">
            {summary.series.map((bar) => {
              const aiH = Math.round((bar.ai / maxBar) * 160);
              const huH = Math.round((bar.human / maxBar) * 160);
              return (
                <div
                  key={bar.label}
                  className="flex-1 min-w-0 flex flex-col items-center gap-2 group"
                >
                  <span className="text-[13px] font-mono text-[#0B5226] opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                    {bar.ai + bar.human}
                  </span>
                  <div className="w-full max-w-[44px] flex flex-col-reverse overflow-hidden rounded-t-lg bg-[#F4F4F2]">
                    <div
                      className="w-full bg-[#178A3F] transition-all duration-300"
                      style={{ height: `${aiH}px` }}
                    />
                    <div
                      className="w-full bg-[#D63B3A] transition-all duration-300"
                      style={{ height: `${huH}px` }}
                    />
                  </div>
                  <span className="text-[13px] font-medium text-[#526058] truncate max-w-full">
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Group 2: Desempenho da IA */}
        <div className="lg:col-span-5 rounded-2xl border border-[#E2E7E3] bg-white p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E2E7E3]">
            <Bot className="h-4 w-4 text-[#178A3F]" />
            <h3 className="font-display text-sm sm:text-base font-bold text-[#0B5226]">
              Desempenho da Inteligência Artificial
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[13px] text-[#526058]">Atendidas pela IA</p>
              <p className="mt-1 font-display text-xl font-bold text-[#0B5226] tabular-nums">
                {summary.aiHandled.toLocaleString('pt-PT')}
              </p>
            </div>
            <div>
              <p className="text-[13px] text-[#526058]">Resolução automática</p>
              <p className="mt-1 font-display text-xl font-bold text-[#178A3F] tabular-nums">
                {summary.autoResolutionRate}%
              </p>
            </div>
            <div>
              <p className="text-[13px] text-[#526058]">Transferências p/ humanos</p>
              <p className="mt-1 font-display text-xl font-bold text-[#D63B3A] tabular-nums">
                {summary.humanTransfers.toLocaleString('pt-PT')}
              </p>
            </div>
            <div>
              <p className="text-[13px] text-[#526058]">Tempo médio resposta</p>
              <p className="mt-1 font-display text-xl font-bold text-[#0B5226] tabular-nums">
                {summary.avgResponseSec}s
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E7E3]">
            <p className="text-[13px] font-semibold text-[#0B5226] mb-2">
              Assistentes mais utilizados
            </p>
            {assistants.length > 0 ? (
              <div className="space-y-2">
                {assistants.map((ast) => (
                  <div
                    key={ast.id}
                    className="flex items-center justify-between gap-2 text-[13px]"
                  >
                    <span className="font-medium text-[#1A241E] truncate">{ast.name}</span>
                    <span className="font-mono text-[#0B5226] shrink-0 tabular-nums">
                      {ast.conversationsToday} conv · {ast.resolutionRate}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#526058]">
                Sem assistentes registados na conta.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Group 3 & 4: Team Performance + Automations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Desempenho da Equipa */}
        <div className="lg:col-span-7 rounded-2xl border border-[#E2E7E3] bg-white p-4 sm:p-5 space-y-4 min-w-0">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E2E7E3]">
            <UsersRound className="h-4 w-4 text-[#178A3F]" />
            <h3 className="font-display text-sm sm:text-base font-bold text-[#0B5226]">
              Desempenho da Equipa e Produtividade por Departamento
            </h3>
          </div>

          {operators.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-[13px]">
                <thead className="border-b border-[#E2E7E3] text-[#526058]">
                  <tr>
                    <th className="py-2 font-semibold">Operador</th>
                    <th className="py-2 font-semibold">Departamento</th>
                    <th className="py-2 font-semibold text-right">Conversas</th>
                    <th className="py-2 font-semibold text-right">Resolvidas</th>
                    <th className="py-2 font-semibold text-right">Tempo médio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E7E3]">
                  {operators.map((op) => (
                    <tr key={op.id}>
                      <td className="py-2.5 font-semibold text-[#1A241E]">
                        {op.name}
                      </td>
                      <td className="py-2.5 text-[#526058]">{op.department}</td>
                      <td className="py-2.5 text-right font-mono text-[#0B5226] tabular-nums">
                        {op.activeChats + op.resolvedTotal}
                      </td>
                      <td className="py-2.5 text-right font-mono font-semibold text-[#178A3F] tabular-nums">
                        {op.resolvedTotal}
                      </td>
                      <td className="py-2.5 text-right font-mono text-[#526058] tabular-nums">
                        {op.avgHandleTimeMin.toFixed(1)} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={UsersRound}
              title="Sem operadores registados"
              description="Adicione operadores em Configurações para acompanhar a produtividade da equipa."
            />
          )}

          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E2E7E3]">
            {summary.deptProductivity.map((dp) => (
              <div key={dp.name} className="rounded-xl border border-[#178A3F]/15 bg-[#E3F6EA]/45 p-3 text-[13px]">
                <p className="font-semibold text-[#0B5226]">{dp.name}</p>
                <p className="mt-1 font-mono text-[#178A3F] tabular-nums">
                  {dp.chats} chats · SLA {dp.sla}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Automações */}
        <div className="lg:col-span-5 rounded-2xl border border-[#E2E7E3] bg-white p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E2E7E3]">
            <GitBranch className="h-4 w-4 text-[#178A3F]" />
            <h3 className="font-display text-sm sm:text-base font-bold text-[#0B5226]">
              Desempenho de Automações
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[13px] text-[#526058]">Execuções totais</p>
              <p
                data-testid="analytics-wf-executions"
                className="mt-1 font-display text-xl font-bold text-[#0B5226] tabular-nums"
              >
                {summary.workflowExecutions.toLocaleString('pt-PT')}
              </p>
            </div>
            <div>
              <p className="text-[13px] text-[#526058]">Bem-sucedidas</p>
              <p className="mt-1 font-display text-xl font-bold text-[#178A3F] tabular-nums">
                {summary.workflowSuccessCount.toLocaleString('pt-PT')}
              </p>
            </div>
            <div>
              <p className="text-[13px] text-[#526058]">Com erro</p>
              <p
                data-testid="analytics-wf-errors"
                className="mt-1 font-display text-xl font-bold text-[#D63B3A] tabular-nums"
              >
                {summary.workflowErrorCount}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E7E3] space-y-2.5">
            <p className="text-[13px] font-semibold text-[#0B5226]">
              Workflows mais utilizados
            </p>
            {workflows.length > 0 ? (
              workflows.map((wf) => (
                <div
                  key={wf.id}
                  className="flex items-center justify-between gap-2 text-[13px] py-1.5 border-b border-[#E2E7E3] last:border-0"
                >
                  <span className="font-medium text-[#1A241E] truncate">
                    {wf.name}
                  </span>
                  <span className="font-mono text-[#0B5226] shrink-0 tabular-nums">
                    {wf.executionsTotal.toLocaleString('pt-PT')}x · {wf.successRate}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-[#526058]">
                Sem fluxos configurados.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
