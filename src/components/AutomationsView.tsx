import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  Bot,
  CheckCircle2,
  Clock,
  GitBranch,
  History,
  Layers,
  MessageSquare,
  Play,
  Plus,
  Split,
  Trash2,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import type {
  Workflow,
  WorkflowBlockType,
  WorkflowExecutionLog,
  WorkflowNode,
} from '../types/zuno';
import { WORKFLOW_TEMPLATES } from '../data/seedData';
import { computeWorkflowStats, validateWorkflow } from '../utils/zunoLogic';
import { ConfirmModal } from './ConfirmModal';
import { EmptyState } from './EmptyState';

interface AutomationsViewProps {
  workflows: Workflow[];
  logs: WorkflowExecutionLog[];
  autoOpenCreate?: boolean;
  onClearAutoOpen?: () => void;
  onSaveWorkflow: (wf: Workflow, isNew: boolean) => void;
  onToggleWorkflow: (id: string) => void;
  onDeleteWorkflow: (id: string) => void;
  onRunTestWorkflow: (wf: Workflow) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const BLOCK_CATALOG: {
  type: WorkflowBlockType;
  label: string;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultSummary: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    type: 'trigger',
    label: 'Gatilho',
    defaultTitle: 'Mensagem Recebida',
    defaultSubtitle: 'Gatilho inicial',
    defaultSummary: 'Dispara ao receber mensagem no WhatsApp',
    accent: 'border-[#178A3F]/30 bg-[#E3F6EA] text-[#0B5226]',
    icon: Zap,
  },
  {
    type: 'condition',
    label: 'Condição',
    defaultTitle: 'Verificar Condição',
    defaultSubtitle: 'Regra lógica',
    defaultSummary: 'Valida horário, etiqueta ou intenção',
    accent: 'border-[#0B5226]/25 bg-[#F4F4F2] text-[#0B5226]',
    icon: GitBranch,
  },
  {
    type: 'ai',
    label: 'Inteligência artificial',
    defaultTitle: 'Interpretar & Responder com IA',
    defaultSubtitle: 'Motor IA Zuno',
    defaultSummary: 'Consulta base de conhecimento e gera resposta',
    accent: 'border-[#178A3F]/35 bg-[#E3F6EA] text-[#178A3F]',
    icon: Bot,
  },
  {
    type: 'action',
    label: 'Ação',
    defaultTitle: 'Encaminhar para Departamento',
    defaultSubtitle: 'Ação operacional',
    defaultSummary: 'Atribui conversa à equipa responsável',
    accent: 'border-[#0B5226]/30 bg-[#E3F6EA]/70 text-[#0B5226]',
    icon: UserCheck,
  },
  {
    type: 'whatsapp',
    label: 'WhatsApp',
    defaultTitle: 'Enviar Mensagem WhatsApp',
    defaultSubtitle: 'Canal WhatsApp',
    defaultSummary: 'Envia texto, documento PDF ou confirmação',
    accent: 'border-[#178A3F]/40 bg-[#E3F6EA] text-[#0B5226]',
    icon: MessageSquare,
  },
  {
    type: 'crm',
    label: 'CRM',
    defaultTitle: 'Atualizar Contacto no CRM',
    defaultSubtitle: 'Pipeline CRM',
    defaultSummary: 'Regista oportunidade e etapa comercial',
    accent: 'border-[#0B5226]/25 bg-[#E3F6EA]/60 text-[#0B5226]',
    icon: Users,
  },
  {
    type: 'wait',
    label: 'Espera',
    defaultTitle: 'Aguardar Intervalo',
    defaultSubtitle: 'Temporizador',
    defaultSummary: 'Aguarda 24 horas antes do próximo passo',
    accent: 'border-[#D63B3A]/30 bg-[#FCEBEB] text-[#791F1F]',
    icon: Clock,
  },
  {
    type: 'branch',
    label: 'Ramificação',
    defaultTitle: 'Ramificar Fluxo',
    defaultSubtitle: 'Direcionamento',
    defaultSummary: 'Divide caminho conforme resultado da IA',
    accent: 'border-[#D63B3A]/30 bg-[#FCEBEB] text-[#791F1F]',
    icon: Split,
  },
];

export const AutomationsView: React.FC<AutomationsViewProps> = ({
  workflows,
  logs,
  autoOpenCreate = false,
  onClearAutoOpen,
  onSaveWorkflow,
  onToggleWorkflow,
  onDeleteWorkflow,
  onRunTestWorkflow,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<'list' | 'editor' | 'templates' | 'logs'>(
    'editor'
  );
  const [selectedWfId, setSelectedWfId] = useState(workflows[0]?.id ?? '');
  const [selectedNodeId, setSelectedNodeId] = useState(
    workflows[0]?.nodes[0]?.id ?? ''
  );
  const [confirmAction, setConfirmAction] = useState<{
    kind: 'pause_wf' | 'delete_wf' | 'delete_node';
    wf?: Workflow;
    node?: WorkflowNode;
  } | null>(null);

  const activeWf =
    workflows.find((w) => w.id === selectedWfId) ?? workflows[0] ?? null;
  const activeNode =
    activeWf?.nodes.find((n) => n.id === selectedNodeId) ??
    activeWf?.nodes[0] ??
    null;

  const stats = computeWorkflowStats(workflows, logs);

  const handleCreateBlankAutomation = () => {
    const newWf: Workflow = {
      id: `wf-${Date.now()}`,
      name: `Novo Fluxo ${workflows.length + 1}`,
      description: 'Fluxo personalizado de atendimento automático via WhatsApp.',
      category: 'Personalizado',
      active: false,
      executionsTotal: 0,
      successRate: 100,
      avgDurationSec: 0,
      errorsCount: 0,
      lastRunAt: 'Nunca executado',
      nodes: [
        {
          id: `n-${Date.now()}-1`,
          type: 'trigger',
          title: 'Nova Mensagem WhatsApp',
          subtitle: 'Gatilho',
          configSummary: 'Qualquer mensagem de entrada',
          params: { canal: 'WhatsApp' },
        },
        {
          id: `n-${Date.now()}-2`,
          type: 'ai',
          title: 'Agente IA Zuno',
          subtitle: 'Inteligência artificial',
          configSummary: 'Interpreta pedido e consulta base de conhecimento',
          params: { memoria: 'Ativa' },
        },
      ],
    };
    onSaveWorkflow(newWf, true);
    setSelectedWfId(newWf.id);
    setSelectedNodeId(newWf.nodes[0].id);
    setSubTab('editor');
  };

  useEffect(() => {
    if (autoOpenCreate) {
      handleCreateBlankAutomation();
      onClearAutoOpen?.();
    }
  }, [autoOpenCreate]);

  const handleUseTemplate = (tplIndex: number) => {
    const tpl = WORKFLOW_TEMPLATES[tplIndex];
    if (!tpl) return;
    const created: Workflow = {
      ...tpl,
      id: `wf-${Date.now()}`,
      executionsTotal: 0,
      successRate: 100,
      avgDurationSec: 1.5,
      errorsCount: 0,
      lastRunAt: 'Criado agora',
      nodes: tpl.nodes.map((n, i) => ({
        ...n,
        id: `n-${Date.now()}-${i}`,
      })),
    };
    onSaveWorkflow(created, true);
    setSelectedWfId(created.id);
    setSelectedNodeId(created.nodes[0].id);
    setSubTab('editor');
  };

  const handleAddBlockToActive = (blockType: WorkflowBlockType) => {
    if (!activeWf) return;
    const meta = BLOCK_CATALOG.find((b) => b.type === blockType);
    if (!meta) return;
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: blockType,
      title: meta.defaultTitle,
      subtitle: meta.defaultSubtitle,
      configSummary: meta.defaultSummary,
      params: { estado: 'Configurado' },
    };
    const updated: Workflow = {
      ...activeWf,
      nodes: [...activeWf.nodes, newNode],
    };
    onSaveWorkflow(updated, false);
    setSelectedNodeId(newNode.id);
    onNotify(`Bloco "${meta.label}" adicionado ao fluxo.`, 'success');
  };

  const handleUpdateActiveNode = (patch: Partial<WorkflowNode>) => {
    if (!activeWf || !activeNode) return;
    const updated: Workflow = {
      ...activeWf,
      nodes: activeWf.nodes.map((n) =>
        n.id === activeNode.id ? { ...n, ...patch } : n
      ),
    };
    onSaveWorkflow(updated, false);
  };

  const handleDeleteNodeConfirmed = (nodeId: string) => {
    if (!activeWf || activeWf.nodes.length <= 1) return;
    const remaining = activeWf.nodes.filter((n) => n.id !== nodeId);
    onSaveWorkflow({ ...activeWf, nodes: remaining }, false);
    if (selectedNodeId === nodeId && remaining[0]) {
      setSelectedNodeId(remaining[0].id);
    }
    onNotify('Bloco removido do fluxo.', 'success');
  };

  const requestToggleWorkflow = (wf: Workflow) => {
    if (wf.active) {
      setConfirmAction({ kind: 'pause_wf', wf });
    } else {
      onToggleWorkflow(wf.id);
    }
  };

  const validation = activeWf ? validateWorkflow(activeWf) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0B5226]">
            Fluxos de Conversa e Automações
          </h2>
          <p className="mt-1 text-[13px] sm:text-sm text-[#526058]">
            Construa fluxos conectáveis de atendimento WhatsApp, agentes IA, CRM e encaminhamento entre equipas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateBlankAutomation}
          className="inline-flex items-center gap-2 rounded-xl bg-[#178A3F] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#137334] transition-colors whitespace-nowrap self-start sm:self-auto min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          Criar automação
        </button>
      </div>

      {/* Stats Row (100% computed from central store) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#0B5226]/12 bg-white p-4">
          <p className="text-[13px] text-[#526058]">Automações ativas</p>
          <p
            data-testid="flows-active-count"
            className="mt-1 font-display text-xl sm:text-2xl font-bold text-[#0B5226] tabular-nums"
          >
            {stats.activeCount} / {stats.totalCount}
          </p>
        </div>
        <div className="rounded-2xl border border-[#0B5226]/12 bg-white p-4">
          <p className="text-[13px] text-[#526058]">Execuções totais</p>
          <p
            data-testid="flows-total-executions"
            className="mt-1 font-display text-xl sm:text-2xl font-bold text-[#0B5226] tabular-nums"
          >
            {stats.totalExecutions.toLocaleString('pt-PT')}
          </p>
        </div>
        <div className="rounded-2xl border border-[#0B5226]/12 bg-white p-4">
          <p className="text-[13px] text-[#526058]">Taxa média de sucesso</p>
          <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-[#178A3F] tabular-nums">
            {stats.avgSuccessRate.toLocaleString('pt-PT')}%
          </p>
        </div>
        <div className="rounded-2xl border border-[#D63B3A]/20 bg-[#FCEBEB]/45 p-4">
          <p className="text-[13px] text-[#791F1F]">Execuções com erro</p>
          <p
            data-testid="flows-total-errors"
            className="mt-1 font-display text-xl sm:text-2xl font-bold text-[#D63B3A] tabular-nums"
          >
            {stats.totalErrors}
          </p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#0B5226]/12 pb-3">
        {[
          { id: 'editor', label: 'Editor Visual', icon: Layers },
          { id: 'list', label: 'Lista de Automações', icon: GitBranch },
          { id: 'templates', label: 'Biblioteca de Modelos', icon: Zap },
          { id: 'logs', label: 'Histórico & Erros', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setSubTab(tab.id as 'list' | 'editor' | 'templates' | 'logs')
              }
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors whitespace-nowrap min-h-[44px] ${
                active
                  ? 'bg-[#0B5226] text-white'
                  : 'bg-white border border-[#0B5226]/15 text-[#0B5226] hover:bg-[#E3F6EA]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: VISUAL WORKFLOW EDITOR */}
      {subTab === 'editor' && (
        activeWf ? (
          <div className="space-y-4">
            {/* Editor Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#0B5226]/12 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                <select
                  value={activeWf.id}
                  onChange={(e) => {
                    const wf = workflows.find((w) => w.id === e.target.value);
                    setSelectedWfId(e.target.value);
                    if (wf?.nodes[0]) setSelectedNodeId(wf.nodes[0].id);
                  }}
                  aria-label="Selecionar workflow no editor"
                  className="max-w-full min-h-[44px] rounded-xl border border-[#0B5226]/15 bg-[#F4F4F2] px-3 py-2 text-[13px] sm:text-sm font-semibold text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                >
                  {workflows.map((wf) => (
                    <option key={wf.id} value={wf.id}>
                      {wf.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => requestToggleWorkflow(activeWf)}
                  className={`min-h-[44px] rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                    activeWf.active
                      ? 'bg-[#E3F6EA] text-[#0B5226] border border-[#178A3F]/30'
                      : 'bg-[#FCEBEB] text-[#791F1F] border border-[#D63B3A]/30'
                  }`}
                >
                  {activeWf.active ? 'Ativo em Produção' : 'Inativo (Rascunho)'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onRunTestWorkflow(activeWf)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#178A3F] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#137334] transition-colors min-h-[44px]"
                >
                  <Play className="h-4 w-4" />
                  Simular execução
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmAction({ kind: 'delete_wf', wf: activeWf })}
                  aria-label={`Eliminar automação ${activeWf.name}`}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#D63B3A]/30 bg-white px-3 py-2 text-[13px] font-semibold text-[#791F1F] hover:bg-[#FCEBEB] transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-[#D63B3A]" />
                </button>
              </div>
            </div>

            {validation && !validation.valid && (
              <div className="flex items-center gap-2 rounded-xl border border-[#D63B3A]/30 bg-[#FCEBEB] px-4 py-3 text-[13px] text-[#791F1F]">
                <AlertTriangle className="h-4 w-4 text-[#D63B3A] shrink-0" />
                <span>{validation.warnings.join(' ')}</span>
              </div>
            )}

            {/* 3-Pane Visual Builder */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              {/* Block Library */}
              <div className="md:col-span-5 lg:col-span-3 rounded-2xl border border-[#0B5226]/12 bg-white p-4 space-y-3">
                <div>
                  <h3 className="font-display text-sm font-bold text-[#0B5226]">
                    Blocos disponíveis
                  </h3>
                  <p className="text-[13px] text-[#526058]">
                    Toque para adicionar um bloco ao fluxo
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                  {BLOCK_CATALOG.map((blk) => {
                    const Icon = blk.icon;
                    return (
                      <button
                        key={blk.type}
                        type="button"
                        onClick={() => handleAddBlockToActive(blk.type)}
                        className="flex min-h-[44px] items-center gap-2.5 rounded-xl border border-[#0B5226]/12 bg-[#F4F4F2]/75 px-2.5 py-2 text-left hover:border-[#178A3F] hover:bg-[#E3F6EA]/50 transition-colors"
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${blk.accent}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[#0B5226] truncate">
                            {blk.label}
                          </p>
                          <p className="text-[13px] text-[#526058] truncate">
                            + Adicionar
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Center: Visual Connected Canvas */}
              <div
                className="md:col-span-7 lg:col-span-6 rounded-2xl border border-[#0B5226]/12 bg-[#F4F4F2] p-4 sm:p-6 min-h-[420px] flex flex-col items-center justify-start overflow-y-auto"
                style={{
                  backgroundImage:
                    'radial-gradient(rgba(11, 82, 38, 0.16) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              >
                <div className="w-full max-w-md space-y-1">
                  {activeWf.nodes.map((node, idx) => {
                    const blkMeta = BLOCK_CATALOG.find((b) => b.type === node.type);
                    const Icon = blkMeta?.icon ?? Zap;
                    const isSelected = activeNode?.id === node.id;

                    return (
                      <React.Fragment key={node.id}>
                        <div
                          onClick={() => setSelectedNodeId(node.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setSelectedNodeId(node.id);
                            }
                          }}
                          className={`cursor-pointer rounded-2xl border bg-white p-3.5 sm:p-4 transition-all ${
                            isSelected
                              ? 'border-[#178A3F] ring-2 ring-[#178A3F]/20 shadow-sm'
                              : 'border-[#0B5226]/15 hover:border-[#178A3F]/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                                  blkMeta?.accent ?? 'bg-[#E3F6EA] text-[#0B5226]'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[13px] font-semibold text-[#178A3F]">
                                  {blkMeta?.label ?? node.subtitle} · Passo {idx + 1}
                                </span>
                                <h4 className="font-display text-sm font-bold text-[#0B5226] truncate">
                                  {node.title}
                                </h4>
                                <p className="mt-0.5 text-[13px] text-[#526058]">
                                  {node.configSummary}
                                </p>
                              </div>
                            </div>

                            {activeWf.nodes.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmAction({ kind: 'delete_node', node });
                                }}
                                aria-label={`Remover bloco ${node.title}`}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#D63B3A] hover:bg-[#FCEBEB]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {idx < activeWf.nodes.length - 1 && (
                          <div className="flex flex-col items-center py-1" aria-hidden="true">
                            <div className="h-4 w-0.5 bg-[#178A3F]/60" />
                            <ArrowDown className="h-3.5 w-3.5 text-[#178A3F] -mt-1" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Right: Node Inspector */}
              <div className="md:col-span-12 lg:col-span-3 rounded-2xl border border-[#0B5226]/12 bg-white p-4 space-y-4">
                {activeNode ? (
                  <>
                    <div>
                      <p className="text-[13px] font-semibold text-[#178A3F]">
                        Inspetor do bloco
                      </p>
                      <h3 className="font-display text-sm sm:text-base font-bold text-[#0B5226]">
                        {activeNode.title}
                      </h3>
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-[#0B5226] mb-1">
                        Título do bloco
                      </label>
                      <input
                        type="text"
                        value={activeNode.title}
                        onChange={(e) =>
                          handleUpdateActiveNode({ title: e.target.value })
                        }
                        className="w-full min-h-[44px] rounded-xl border border-[#0B5226]/20 px-3 py-2 text-[13px] text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-[#0B5226] mb-1">
                        Regra / descrição operacional
                      </label>
                      <textarea
                        rows={3}
                        value={activeNode.configSummary}
                        onChange={(e) =>
                          handleUpdateActiveNode({ configSummary: e.target.value })
                        }
                        className="w-full rounded-xl border border-[#0B5226]/20 px-3 py-2 text-[13px] text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                      />
                    </div>

                    <div className="border-t border-[#F4F4F2] pt-3">
                      <p className="text-[13px] font-semibold text-[#0B5226] mb-2">
                        Parâmetros configurados
                      </p>
                      <div className="space-y-2">
                        {Object.entries(activeNode.params).map(([k, v]) => (
                          <div key={k} className="text-[13px]">
                            <span className="text-[#526058] capitalize">{k}: </span>
                            <span className="font-semibold text-[#0B5226]">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[13px] text-[#526058]">
                    Selecione um bloco no canvas para editar.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={GitBranch}
            title="Sem automações configuradas."
            description="Crie um fluxo de conversa personalizado ou escolha um modelo pronto."
            actionLabel="Criar automação"
            onAction={handleCreateBlankAutomation}
            testId="flows-empty-state"
          />
        )
      )}

      {/* TAB 2: LIST OF AUTOMATIONS */}
      {subTab === 'list' && (
        workflows.length > 0 ? (
          <div className="rounded-2xl border border-[#0B5226]/12 bg-white overflow-hidden">
            <div className="divide-y divide-[#F4F4F2]">
              {workflows.map((wf) => (
                <div
                  key={wf.id}
                  className="flex flex-col gap-3 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-sm sm:text-base font-bold text-[#0B5226]">
                        {wf.name}
                      </h3>
                      <span className="text-[13px] text-[#526058]">· {wf.category}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-[#526058] max-w-2xl">
                      {wf.description}
                    </p>
                    <p className="mt-1.5 text-[13px] text-[#526058] tabular-nums">
                      {wf.nodes.length} blocos · {wf.executionsTotal.toLocaleString('pt-PT')} execuções ·{' '}
                      {wf.successRate}% sucesso · Última execução: {wf.lastRunAt}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => requestToggleWorkflow(wf)}
                      className={`min-h-[44px] rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                        wf.active
                          ? 'bg-[#E3F6EA] text-[#0B5226] hover:bg-[#d2efdd]'
                          : 'bg-[#FCEBEB] text-[#791F1F] hover:bg-[#f9dada]'
                      }`}
                    >
                      {wf.active ? 'Ativo' : 'Pausado'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWfId(wf.id);
                        if (wf.nodes[0]) setSelectedNodeId(wf.nodes[0].id);
                        setSubTab('editor');
                      }}
                      className="min-h-[44px] rounded-xl border border-[#0B5226]/20 px-3.5 py-2 text-[13px] font-semibold text-[#0B5226] hover:bg-[#E3F6EA]"
                    >
                      Abrir no editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmAction({ kind: 'delete_wf', wf })}
                      aria-label={`Eliminar automação ${wf.name}`}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#D63B3A]/25 text-[#D63B3A] hover:bg-[#FCEBEB]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={GitBranch}
            title="Sem automações configuradas."
            description="Crie um novo fluxo ou importe um modelo da biblioteca."
            actionLabel="Criar automação"
            onAction={handleCreateBlankAutomation}
            testId="flows-list-empty-state"
          />
        )
      )}

      {/* TAB 3: TEMPLATE LIBRARY */}
      {subTab === 'templates' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {WORKFLOW_TEMPLATES.map((tpl, idx) => (
            <div
              key={tpl.name}
              className="flex flex-col justify-between rounded-2xl border border-[#0B5226]/12 bg-white p-5"
            >
              <div>
                <span className="text-[13px] font-semibold text-[#178A3F]">
                  Modelo · {tpl.category}
                </span>
                <h3 className="mt-1 font-display text-base font-bold text-[#0B5226]">
                  {tpl.name}
                </h3>
                <p className="mt-1.5 text-[13px] text-[#526058] leading-relaxed">
                  {tpl.description}
                </p>
                <p className="mt-3 text-[13px] text-[#526058]">
                  Sequência: {tpl.nodes.map((n) => n.title).join(' → ')}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F4F4F2] flex justify-end">
                <button
                  type="button"
                  onClick={() => handleUseTemplate(idx)}
                  className="min-h-[44px] rounded-xl bg-[#178A3F] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#137334] transition-colors"
                >
                  Usar este modelo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: EXECUTION HISTORY & ERRORS */}
      {subTab === 'logs' && (
        logs.length > 0 ? (
          <div className="rounded-2xl border border-[#0B5226]/12 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-[13px]">
                <thead className="border-b border-[#0B5226]/10 bg-[#F4F4F2] text-[#526058]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Automação</th>
                    <th className="px-4 py-3 font-semibold">Contacto</th>
                    <th className="px-4 py-3 font-semibold">Estado</th>
                    <th className="px-4 py-3 font-semibold">Duração</th>
                    <th className="px-4 py-3 font-semibold">Detalhe</th>
                    <th className="px-4 py-3 font-semibold text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F4F2]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#E3F6EA]/35">
                      <td className="px-4 py-3 font-semibold text-[#0B5226]">
                        {log.workflowName}
                      </td>
                      <td className="px-4 py-3 text-[#1A241E]">{log.contactName}</td>
                      <td className="px-4 py-3">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#E3F6EA] px-2 py-0.5 font-semibold text-[#0B5226]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#178A3F]" />
                            Sucesso
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#FCEBEB] px-2 py-0.5 font-semibold text-[#791F1F]">
                            <AlertTriangle className="h-3.5 w-3.5 text-[#D63B3A]" />
                            Erro
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#0B5226] tabular-nums">
                        {(log.durationMs / 1000).toFixed(2)}s
                      </td>
                      <td className="px-4 py-3 text-[#526058]">{log.detail}</td>
                      <td className="px-4 py-3 text-right text-[#526058] tabular-nums">
                        {log.startedAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={History}
            title="Sem registos de execução."
            description="Simule uma automação para visualizar o histórico de execuções."
            actionLabel="Voltar ao Editor"
            onAction={() => setSubTab('editor')}
          />
        )
      )}

      <ConfirmModal
        open={Boolean(confirmAction)}
        title={
          confirmAction?.kind === 'pause_wf'
            ? 'Pausar automação'
            : confirmAction?.kind === 'delete_wf'
            ? 'Eliminar automação'
            : 'Eliminar bloco'
        }
        description={
          confirmAction?.kind === 'pause_wf'
            ? `Tem a certeza de que pretende pausar "${confirmAction.wf?.name}"? O fluxo deixará de ser executado automaticamente.`
            : confirmAction?.kind === 'delete_wf'
            ? `Tem a certeza de que pretende eliminar o fluxo "${confirmAction.wf?.name}"? Esta ação não pode ser desfeita.`
            : `Pretende remover o bloco "${confirmAction?.node?.title}" deste fluxo?`
        }
        confirmLabel={confirmAction?.kind === 'pause_wf' ? 'Pausar' : 'Eliminar'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction?.kind === 'pause_wf' && confirmAction.wf) {
            onToggleWorkflow(confirmAction.wf.id);
          } else if (confirmAction?.kind === 'delete_wf' && confirmAction.wf) {
            onDeleteWorkflow(confirmAction.wf.id);
          } else if (confirmAction?.kind === 'delete_node' && confirmAction.node) {
            handleDeleteNodeConfirmed(confirmAction.node.id);
          }
          setConfirmAction(null);
        }}
      />
    </div>
  );
};
