import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  FileText,
  GitBranch,
  Image as ImageIcon,
  MessageSquare,
  Mic,
  MoreVertical,
  Play,
  Plus,
  Power,
  Send,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AIAssistant,
  AssistantCapabilities,
  Conversation,
  DepartmentName,
  KnowledgeDoc,
  Workflow,
} from '../types/zuno';
import { simulateAssistantReply } from '../utils/zunoLogic';
import { Avatar } from './Avatar';
import { ConfirmModal } from './ConfirmModal';
import { EmptyState } from './EmptyState';

interface AgentsViewProps {
  assistants: AIAssistant[];
  knowledgeDocs: KnowledgeDoc[];
  conversations: Conversation[];
  workflows: Workflow[];
  autoOpenCreate?: boolean;
  onClearAutoOpen?: () => void;
  focusedAgentId?: string | null;
  onClearFocusedAgent?: () => void;
  onSaveAssistant: (assistant: AIAssistant, isNew: boolean) => void;
  onDeleteAssistant: (id: string) => void;
  onToggleAssistant: (id: string) => void;
  onDuplicateAssistant: (assistant: AIAssistant) => void;
  onOpenConversation: (conversationId: string) => void;
  onToggleWorkflow: (id: string) => void;
  onRunTestWorkflow: (wf: Workflow) => void;
  onOpenFlows: () => void;
}

type ModuleTab = 'agents' | 'conversations' | 'automations';
type EditorSection =
  | 'identity'
  | 'instructions'
  | 'behavior'
  | 'knowledge'
  | 'multimodal'
  | 'memory'
  | 'schedule'
  | 'service'
  | 'activation';

interface SimMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  source?: string | null;
  confidence?: number;
}

const MULTIMODAL_ITEMS: {
  key: keyof AssistantCapabilities;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: 'audioRecognition',
    title: 'Reconhecimento de áudio',
    description: 'Transcreve e interpreta notas de voz recebidas no WhatsApp.',
    icon: Mic,
  },
  {
    key: 'imageInterpretation',
    title: 'Interpretação de imagens',
    description: 'Analisa fotografias de produtos, faturas e capturas de ecrã.',
    icon: ImageIcon,
  },
  {
    key: 'documentInterpretation',
    title: 'Interpretação de documentos',
    description: 'Extrai informação de anexos PDF, propostas e comprovativos.',
    icon: FileText,
  },
  {
    key: 'contextualResponses',
    title: 'Respostas contextuais',
    description: 'Cruza a pergunta do cliente com a base de conhecimento vinculada.',
    icon: Bot,
  },
  {
    key: 'responsePersonalization',
    title: 'Personalização de respostas',
    description: 'Adapta o tratamento ao perfil do contacto, idioma e tom configurado.',
    icon: Sparkles,
  },
];

const MEMORY_ITEMS: {
  key: keyof AssistantCapabilities;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: 'contextualMemory',
    title: 'Memória contextual das conversas',
    description: 'Retém factos e preferências do cliente durante toda a sessão.',
    icon: Brain,
  },
  {
    key: 'interactionHistory',
    title: 'Histórico de interações',
    description: 'Consulta atendimentos anteriores para evitar perguntas repetidas.',
    icon: MessageSquare,
  },
  {
    key: 'conversationContinuity',
    title: 'Continuidade das conversas',
    description: 'Retoma diálogos interrompidos mantendo o contexto comercial ou técnico.',
    icon: CheckCircle2,
  },
];

const EDITOR_SECTIONS: { id: EditorSection; label: string }[] = [
  { id: 'identity', label: 'Identidade e personalidade' },
  { id: 'instructions', label: 'Instruções e objetivo' },
  { id: 'behavior', label: 'Comportamento' },
  { id: 'knowledge', label: 'Base de conhecimento' },
  { id: 'multimodal', label: 'Capacidades multimodais' },
  { id: 'memory', label: 'Memória contextual' },
  { id: 'schedule', label: 'Horário de funcionamento' },
  { id: 'service', label: 'Configurações de atendimento' },
  { id: 'activation', label: 'Teste e ativação' },
];

export const AgentsView: React.FC<AgentsViewProps> = ({
  assistants,
  knowledgeDocs,
  conversations,
  workflows,
  autoOpenCreate = false,
  onClearAutoOpen,
  focusedAgentId,
  onClearFocusedAgent,
  onSaveAssistant,
  onDeleteAssistant,
  onToggleAssistant,
  onDuplicateAssistant,
  onOpenConversation,
  onToggleWorkflow,
  onRunTestWorkflow,
  onOpenFlows,
}) => {
  const [moduleTab, setModuleTab] = useState<ModuleTab>('agents');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [agentFilterId, setAgentFilterId] = useState<string>('all');
  const [pendingConfirm, setPendingConfirm] = useState<
    | { kind: 'pause_agent'; assistant: AIAssistant }
    | { kind: 'delete_agent'; assistant: AIAssistant }
    | { kind: 'pause_workflow'; workflow: Workflow }
    | null
  >(null);

  // Editor modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNew, setEditingNew] = useState(false);
  const [editorSection, setEditorSection] = useState<EditorSection>('identity');
  const [formState, setFormState] = useState<AIAssistant | null>(null);

  // Simulator modal state
  const [testAgent, setTestAgent] = useState<AIAssistant | null>(null);
  const [simInput, setSimInput] = useState('');
  const [simMessages, setSimMessages] = useState<SimMessage[]>([]);

  const buildBlankAgent = (): AIAssistant => ({
    id: `ast-${Date.now()}`,
    name: '',
    description: '',
    personality: 'Prestável, claro e focado em resolver rapidamente cada pedido.',
    customInstructions:
      'Cumprimentar o cliente pelo nome, consultar os documentos vinculados na base de conhecimento e transferir para um operador humano quando solicitado.',
    objective: 'Atender clientes no WhatsApp com precisão e encaminhar casos complexos.',
    serviceType: 'Comercial',
    language: 'Português (PT)',
    tone: 'Profissional',
    schedule: '24/7 Contínuo',
    active: true,
    resolutionRate: 92,
    avgResponseSec: 2.0,
    conversationsToday: 0,
    lastActivityAt: 'Criado agora',
    linkedKnowledgeIds: knowledgeDocs.map((d) => d.id),
    confidenceThreshold: 80,
    handoffDepartment: 'Atendimento geral',
    capabilities: {
      contextualMemory: true,
      interactionHistory: true,
      audioRecognition: true,
      imageInterpretation: true,
      documentInterpretation: true,
      contextualResponses: true,
      conversationContinuity: true,
      responsePersonalization: true,
    },
  });

  const openCreateModal = () => {
    setEditingNew(true);
    setEditorSection('identity');
    setFormState(buildBlankAgent());
    setEditorOpen(true);
    setOpenMenuId(null);
  };

  useEffect(() => {
    if (autoOpenCreate) {
      setModuleTab('agents');
      setEditingNew(true);
      setEditorSection('identity');
      setFormState(buildBlankAgent());
      setEditorOpen(true);
      onClearAutoOpen?.();
    }
  }, [autoOpenCreate]);

  const openEditModal = (ast: AIAssistant) => {
    setEditingNew(false);
    setEditorSection('identity');
    setFormState({
      ...ast,
      linkedKnowledgeIds:
        ast.linkedKnowledgeIds ??
        knowledgeDocs
          .filter((d) => d.linkedAssistants.includes(ast.id))
          .map((d) => d.id),
      confidenceThreshold: ast.confidenceThreshold ?? 80,
      handoffDepartment: ast.handoffDepartment ?? 'Atendimento geral',
      lastActivityAt: ast.lastActivityAt ?? 'Hoje',
    });
    setEditorOpen(true);
    setOpenMenuId(null);
  };

  useEffect(() => {
    if (!focusedAgentId) return;
    const found = assistants.find((a) => a.id === focusedAgentId);
    if (found) {
      setModuleTab('agents');
      openEditModal(found);
    }
    onClearFocusedAgent?.();
  }, [focusedAgentId]);

  const openTestSimulator = (ast: AIAssistant) => {
    setTestAgent(ast);
    setSimInput('');
    setSimMessages([
      {
        id: `sim-welcome-${ast.id}`,
        sender: 'ai',
        text: `Olá! Sou o agente "${ast.name}" (${ast.serviceType}). Estou pronto para testar respostas com base nos documentos vinculados e nas instruções configuradas.`,
        confidence: ast.confidenceThreshold ?? 95,
      },
    ]);
    setOpenMenuId(null);
  };

  const handleSaveForm = (e: React.FormEvent, alsoOpenTest = false) => {
    e.preventDefault();
    if (!formState || !formState.name.trim()) return;
    const savedAgent: AIAssistant = {
      ...formState,
      description:
        formState.description.trim() ||
        `Agente dedicado a ${formState.serviceType.toLowerCase()} via WhatsApp.`,
      objective:
        formState.objective.trim() ||
        `Automatizar pedidos de ${formState.serviceType.toLowerCase()} com apoio da base de conhecimento.`,
      lastActivityAt: editingNew ? 'Criado agora' : 'Atualizado agora',
    };
    onSaveAssistant(savedAgent, editingNew);
    setEditorOpen(false);
    if (alsoOpenTest) {
      openTestSimulator(savedAgent);
    }
  };

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testAgent || !simInput.trim()) return;
    const question = simInput.trim();
    const linkedIds = testAgent.linkedKnowledgeIds;
    const scopedDocs =
      linkedIds && linkedIds.length > 0
        ? knowledgeDocs.filter((d) => linkedIds.includes(d.id))
        : knowledgeDocs;

    const result = simulateAssistantReply(question, testAgent, scopedDocs);
    setSimMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, sender: 'user', text: question },
      {
        id: `a-${Date.now() + 1}`,
        sender: 'ai',
        text: result.replyText,
        source: result.matchedDocTitle,
        confidence: Math.round(result.confidence * 100),
      },
    ]);
    setSimInput('');
  };

  const toggleKnowledgeDoc = (docId: string) => {
    if (!formState) return;
    const current = formState.linkedKnowledgeIds ?? [];
    const next = current.includes(docId)
      ? current.filter((id) => id !== docId)
      : [...current, docId];
    setFormState({ ...formState, linkedKnowledgeIds: next });
  };

  const filteredConversations = conversations.filter((conv) => {
    if (agentFilterId === 'all') return true;
    return conv.assignedAssistantId === agentFilterId;
  });

  const getAgentNameById = (id?: string) =>
    assistants.find((a) => a.id === id)?.name ?? 'Triagem IA Zuno';

  return (
    <div className="space-y-6">
      {/* Top Module Tabs: Agentes · Conversas · Automações */}
      <div className="border-b border-[#E2E7E3] bg-white rounded-2xl px-3 sm:px-5 pt-2">
        <div
          role="tablist"
          aria-label="Separadores do módulo Agentes"
          className="flex overflow-x-auto gap-5 sm:gap-7"
        >
          {(
            [
              { id: 'agents', label: 'Agentes', count: assistants.length },
              {
                id: 'conversations',
                label: 'Conversas',
                count: conversations.filter((c) => c.assignedAssistantId || c.status === 'ai_active').length,
              },
              {
                id: 'automations',
                label: 'Automações',
                count: workflows.length,
              },
            ] as const
          ).map((tab) => {
            const isActive = moduleTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setModuleTab(tab.id)}
                className={`inline-flex min-h-[44px] items-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-[#178A3F] text-[#0B5226]'
                    : 'border-transparent text-[#526058] hover:text-[#0B5226]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[13px] font-bold tabular-nums ${
                    isActive
                      ? 'bg-[#E3F6EA] text-[#0B5226]'
                      : 'bg-[#F4F4F2] text-[#526058]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: AGENTES */}
      {moduleTab === 'agents' && (
        <div className="space-y-5">
          {/* Header: Gestão de Agentes on top-left + Criar Agente primary button */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0B5226]">
                Gestão de Agentes
              </h2>
              <p className="mt-1 text-[13px] sm:text-sm text-[#526058]">
                Crie, personalize e teste os agentes de inteligência artificial ligados ao WhatsApp da empresa.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#178A3F] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#137334] transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              Criar Agente
            </button>
          </div>

          {assistants.length === 0 ? (
            <EmptyState
              testId="agents-empty-state"
              icon={Bot}
              title="Ainda não tens agentes IA"
              description="Cria o primeiro assistente inteligente para responder automaticamente aos clientes no WhatsApp."
              actionLabel="Criar Agente"
              onAction={openCreateModal}
            />
          ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assistants.map((ast) => {
              const enabledCapsCount = Object.values(ast.capabilities).filter(Boolean).length;
              const linkedDocsCount =
                ast.linkedKnowledgeIds?.length ??
                knowledgeDocs.filter((d) => d.linkedAssistants.includes(ast.id)).length;
              const menuOpen = openMenuId === ast.id;

              return (
                <article
                  key={ast.id}
                  data-testid={`agent-card-${ast.id}`}
                  className="relative flex flex-col justify-between rounded-2xl border border-[#E2E7E3] bg-white p-5 transition-colors hover:border-[#178A3F]/45"
                >
                  <div>
                    {/* Top Row: Avatar/Icon + Name + Status + Options Menu */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                            ast.active
                              ? 'border-[#178A3F]/25 bg-[#E3F6EA] text-[#178A3F]'
                              : 'border-[#D63B3A]/25 bg-[#FCEBEB] text-[#D63B3A]'
                          }`}
                        >
                          <Bot className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-base font-bold text-[#0B5226] truncate">
                            {ast.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                ast.active
                                  ? 'bg-[#E3F6EA] text-[#0B5226]'
                                  : 'bg-[#FCEBEB] text-[#791F1F]'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  ast.active ? 'bg-[#178A3F]' : 'bg-[#D63B3A]'
                                }`}
                              />
                              {ast.active ? 'Ativo' : 'Inativo'}
                            </span>
                            <span className="rounded-md bg-[#F4F4F2] px-2 py-0.5 text-[11px] font-medium text-[#526058]">
                              {ast.serviceType}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Options Menu Button */}
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId((prev) => (prev === ast.id ? null : ast.id))
                          }
                          aria-label={`Opções de ${ast.name}`}
                          aria-expanded={menuOpen}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#E2E7E3] text-[#526058] hover:bg-[#E3F6EA] hover:text-[#0B5226] transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {menuOpen && (
                          <div
                            role="menu"
                            aria-label={`Menu de opções para ${ast.name}`}
                            className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-[#E2E7E3] bg-white p-1.5 shadow-lg z-20"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => openTestSimulator(ast)}
                              className="flex w-full min-h-[44px] items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[#0B5226] hover:bg-[#E3F6EA]"
                            >
                              <Play className="h-4 w-4 text-[#178A3F]" />
                              Testar agente
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => openEditModal(ast)}
                              className="flex w-full min-h-[44px] items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[#0B5226] hover:bg-[#E3F6EA]"
                            >
                              <Edit3 className="h-4 w-4 text-[#178A3F]" />
                              Editar configurações
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null);
                                if (ast.active) {
                                  setPendingConfirm({
                                    kind: 'pause_agent',
                                    assistant: ast,
                                  });
                                } else {
                                  onToggleAssistant(ast.id);
                                }
                              }}
                              className="flex w-full min-h-[44px] items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[#0B5226] hover:bg-[#E3F6EA]"
                            >
                              <Power className="h-4 w-4 text-[#178A3F]" />
                              {ast.active ? 'Desativar agente' : 'Ativar agente'}
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                onDuplicateAssistant(ast);
                                setOpenMenuId(null);
                              }}
                              className="flex w-full min-h-[44px] items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[#0B5226] hover:bg-[#E3F6EA]"
                            >
                              <Copy className="h-4 w-4 text-[#178A3F]" />
                              Duplicar agente
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuId(null);
                                setPendingConfirm({
                                  kind: 'delete_agent',
                                  assistant: ast,
                                });
                              }}
                              className="flex w-full min-h-[44px] items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[#791F1F] hover:bg-[#FCEBEB]"
                            >
                              <Trash2 className="h-4 w-4 text-[#D63B3A]" />
                              Eliminar agente
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mt-3 text-[13px] text-[#526058] line-clamp-2 leading-relaxed min-h-[40px]">
                      {ast.description}
                    </p>

                    {/* Structured Metrics */}
                    <dl className="mt-4 grid grid-cols-2 gap-2.5 rounded-xl bg-[#F4F4F2]/75 p-3 text-[13px]">
                      <div>
                        <dt className="text-[13px] text-[#526058]">Conversas</dt>
                        <dd className="mt-0.5 font-semibold text-[#0B5226] tabular-nums">
                          {ast.conversationsToday} hoje
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[13px] text-[#526058]">Última atividade</dt>
                        <dd className="mt-0.5 font-semibold text-[#0B5226] truncate">
                          {ast.lastActivityAt ?? 'Hoje'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[13px] text-[#526058]">Base ligada</dt>
                        <dd className="mt-0.5 font-semibold text-[#0B5226] tabular-nums">
                          {linkedDocsCount} {linkedDocsCount === 1 ? 'documento' : 'documentos'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[13px] text-[#526058]">Capacidades</dt>
                        <dd className="mt-0.5 font-semibold text-[#178A3F] tabular-nums">
                          {enabledCapsCount}/8 ativas
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Card Footer Buttons: Testar & Editar */}
                  <div className="mt-4 pt-3.5 border-t border-[#F4F4F2] flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openTestSimulator(ast)}
                      className="flex-1 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#178A3F]/30 bg-[#E3F6EA] px-3 py-2 text-[13px] font-semibold text-[#0B5226] hover:bg-[#d2efdd] transition-colors"
                    >
                      <Play className="h-4 w-4 text-[#178A3F]" />
                      Testar
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(ast)}
                      className="flex-1 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#0B5226] px-3 py-2 text-[13px] font-semibold text-white hover:bg-[#178A3F] transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                      Editar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* TAB 2: CONVERSAS DOS AGENTES */}
      {moduleTab === 'conversations' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-[#0B5226]">
                Conversas dos Agentes
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#526058]">
                Acompanhe as conversas geridas pelos agentes IA e abra qualquer atendimento na Caixa de entrada.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="agent-conv-filter" className="text-[13px] font-medium text-[#526058]">
                Filtrar por agente:
              </label>
              <select
                id="agent-conv-filter"
                value={agentFilterId}
                onChange={(e) => setAgentFilterId(e.target.value)}
                className="min-h-[44px] rounded-xl border border-[#E2E7E3] bg-white px-3 py-2 text-[13px] font-medium text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
              >
                <option value="all">Todos os agentes</option>
                {assistants.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E7E3] bg-white divide-y divide-[#F4F4F2]">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-[#E3F6EA]/25 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar name={conv.contactName} src={conv.contactAvatar} size="md" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-[#0B5226] truncate">
                          {conv.contactName}
                        </p>
                        <span className="text-[13px] text-[#526058]">· {conv.companyName}</span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[13px] font-semibold ${
                            conv.status === 'ai_active'
                              ? 'bg-[#E3F6EA] text-[#0B5226]'
                              : conv.status === 'waiting_human'
                              ? 'bg-[#FCEBEB] text-[#791F1F]'
                              : 'bg-[#F4F4F2] text-[#526058]'
                          }`}
                        >
                          {conv.status === 'ai_active'
                            ? 'IA Ativa'
                            : conv.status === 'waiting_human'
                            ? 'Aguarda Operador'
                            : conv.status === 'human_active'
                            ? 'Operador'
                            : 'Resolvida'}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-[#1A241E] line-clamp-1">
                        {conv.lastMessage}
                      </p>
                      <p className="mt-1 text-[13px] text-[#526058]">
                        Agente: {getAgentNameById(conv.assignedAssistantId)} · {conv.lastTimestamp}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenConversation(conv.id)}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#178A3F]/30 bg-[#E3F6EA] px-4 py-2 text-[13px] font-semibold text-[#0B5226] hover:bg-[#d2efdd] shrink-0"
                  >
                    <MessageSquare className="h-4 w-4 text-[#178A3F]" />
                    Abrir na Caixa de entrada
                  </button>
                </div>
              ))
            ) : (
              <div className="p-4">
                <EmptyState
                  testId="agent-conversations-empty"
                  icon={MessageSquare}
                  title="Sem conversas encontradas"
                  description="Nenhuma conversa atribuída ao agente selecionado."
                  actionLabel={
                    agentFilterId !== 'all' ? 'Ver todas as conversas' : undefined
                  }
                  onAction={
                    agentFilterId !== 'all'
                      ? () => setAgentFilterId('all')
                      : undefined
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AUTOMAÇÕES DOS AGENTES */}
      {moduleTab === 'automations' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-[#0B5226]">
                Automações ligadas aos Agentes
              </h2>
              <p className="mt-1 text-[13px] sm:text-sm text-[#526058]">
                Ative regras automáticas ou abra o editor visual em Fluxos de conversa.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenFlows}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#178A3F] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#137334] self-start sm:self-auto"
            >
              <GitBranch className="h-4 w-4" />
              Abrir Fluxos de conversa
            </button>
          </div>

          {workflows.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {workflows.map((wf) => (
                <div
                  key={wf.id}
                  className="rounded-2xl border border-[#E2E7E3] bg-white p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="inline-flex rounded-md bg-[#F4F4F2] px-2.5 py-1 text-[13px] font-medium text-[#526058]">
                          {wf.category}
                        </span>
                        <h3 className="mt-1.5 font-display text-base font-bold text-[#0B5226]">
                          {wf.name}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (wf.active) {
                            setPendingConfirm({
                              kind: 'pause_workflow',
                              workflow: wf,
                            });
                          } else {
                            onToggleWorkflow(wf.id);
                          }
                        }}
                        className={`min-h-[44px] rounded-lg px-3 py-1.5 text-[13px] font-semibold shrink-0 ${
                          wf.active
                            ? 'bg-[#E3F6EA] text-[#0B5226]'
                            : 'bg-[#FCEBEB] text-[#791F1F]'
                        }`}
                      >
                        {wf.active ? 'Ativa' : 'Pausada'}
                      </button>
                    </div>

                    <p className="mt-2 text-[13px] text-[#526058] leading-relaxed">
                      {wf.description}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-3 text-[13px] text-[#526058] tabular-nums">
                      <span>{wf.executionsTotal.toLocaleString('pt-PT')} execuções</span>
                      <span>· {wf.successRate}% sucesso</span>
                      <span>· {wf.nodes.length} blocos</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[#F4F4F2]">
                    <button
                      type="button"
                      onClick={() => onRunTestWorkflow(wf)}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#178A3F]/30 bg-[#E3F6EA] px-3.5 py-2 text-[13px] font-semibold text-[#0B5226] hover:bg-[#d2efdd]"
                    >
                      <Play className="h-4 w-4 text-[#178A3F]" />
                      Testar
                    </button>
                    <button
                      type="button"
                      onClick={onOpenFlows}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#E2E7E3] px-3.5 py-2 text-[13px] font-semibold text-[#0B5226] hover:bg-[#F4F4F2]"
                    >
                      Editar fluxo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              testId="agents-workflows-empty"
              icon={GitBranch}
              title="Sem automações associadas"
              description="Cria um fluxo de conversa automático para ligar respostas dos agentes ao CRM e WhatsApp."
              actionLabel="Abrir Fluxos de conversa"
              onAction={onOpenFlows}
            />
          )}
        </div>
      )}

      {/* COMPREHENSIVE CREATE / EDIT AGENT MODAL (ALL 10 CONFIG AREAS) */}
      {editorOpen && formState && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="agent-editor-title"
        >
          <form
            onSubmit={(e) => handleSaveForm(e, false)}
            className="flex flex-col w-full max-w-4xl max-h-[92dvh] rounded-2xl border border-[#E2E7E3] bg-white shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-4 border-b border-[#E2E7E3] px-5 py-4 bg-white">
              <div className="min-w-0">
                <h3
                  id="agent-editor-title"
                  className="font-display text-lg font-bold text-[#0B5226] truncate"
                >
                  {editingNew ? 'Criar Agente IA' : `Configurar ${formState.name}`}
                </h3>
                <p className="text-xs text-[#526058]">
                  Configure identidade, instruções, base de conhecimento, memória e ativação.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                aria-label="Fechar editor do agente"
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-[#E2E7E3] text-[#526058] hover:bg-[#E3F6EA] hover:text-[#0B5226]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Left Section Nav + Right Content */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
              <nav
                aria-label="Secções de configuração do agente"
                className="md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-[#E2E7E3] bg-[#F4F4F2]/60 p-2.5 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto"
              >
                {EDITOR_SECTIONS.map((sec) => {
                  const active = editorSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setEditorSection(sec.id)}
                      className={`shrink-0 min-h-[44px] rounded-xl px-3 py-2 text-left text-[13px] font-semibold transition-colors whitespace-nowrap md:whitespace-normal ${
                        active
                          ? 'bg-[#178A3F] text-white'
                          : 'text-[#526058] hover:bg-[#E3F6EA] hover:text-[#0B5226]'
                      }`}
                    >
                      {sec.label}
                    </button>
                  );
                })}
              </nav>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* 1. Identidade e personalidade */}
                {editorSection === 'identity' && (
                  <div className="space-y-4">
                    <h4 className="font-display text-base font-bold text-[#0B5226]">
                      Identidade e personalidade
                    </h4>
                    <div>
                      <label className="block text-xs font-semibold text-[#0B5226] mb-1">
                        Nome do agente
                      </label>
                      <input
                        type="text"
                        required
                        value={formState.name}
                        onChange={(e) =>
                          setFormState({ ...formState, name: e.target.value })
                        }
                        placeholder="Ex.: Zuno Atendimento Comercial"
                        className="w-full min-h-[42px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0B5226] mb-1">
                        Descrição
                      </label>
                      <input
                        type="text"
                        value={formState.description}
                        onChange={(e) =>
                          setFormState({ ...formState, description: e.target.value })
                        }
                        placeholder="Resumo claro das funções do agente"
                        className="w-full min-h-[42px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0B5226] mb-1">
                        Personalidade
                      </label>
                      <textarea
                        rows={3}
                        value={formState.personality}
                        onChange={(e) =>
                          setFormState({ ...formState, personality: e.target.value })
                        }
                        className="w-full rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 2 & 3. Instruções e Objetivo */}
                {editorSection === 'instructions' && (
                  <div className="space-y-4">
                    <h4 className="font-display text-base font-bold text-[#0B5226]">
                      Instruções e objetivo
                    </h4>
                    <div>
                      <label className="block text-xs font-semibold text-[#0B5226] mb-1">
                        Objetivo principal
                      </label>
                      <input
                        type="text"
                        value={formState.objective}
                        onChange={(e) =>
                          setFormState({ ...formState, objective: e.target.value })
                        }
                        placeholder="Ex.: Qualificar leads e esclarecer prazos de entrega"
                        className="w-full min-h-[42px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0B5226] mb-1">
                        Instruções personalizadas
                      </label>
                      <textarea
                        rows={5}
                        value={formState.customInstructions}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            customInstructions: e.target.value,
                          })
                        }
                        placeholder="Defina regras obrigatórias, postura e critérios de resposta..."
                        className="w-full rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 4. Comportamento */}
                {editorSection === 'behavior' && (
                  <div className="space-y-4">
                    <h4 className="font-display text-base font-bold text-[#0B5226]">
                      Comportamento do agente
                    </h4>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-[#0B5226] mb-1">
                          Tipo de atendimento
                        </label>
                        <select
                          value={formState.serviceType}
                          onChange={(e) =>
                            setFormState({
                              ...formState,
                              serviceType: e.target.value as AIAssistant['serviceType'],
                            })
                          }
                          className="w-full min-h-[42px] rounded-xl border border-[#E2E7E3] bg-white px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                        >
                          <option value="Comercial">Comercial</option>
                          <option value="Suporte Técnico">Suporte Técnico</option>
                          <option value="Agendamento">Agendamento</option>
                          <option value="Financeiro">Financeiro</option>
                          <option value="Triagem Geral">Triagem Geral</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#0B5226] mb-1">
                          Tom de comunicação
                        </label>
                        <select
                          value={formState.tone}
                          onChange={(e) =>
                            setFormState({
                              ...formState,
                              tone: e.target.value as AIAssistant['tone'],
                            })
                          }
                          className="w-full min-h-[42px] rounded-xl border border-[#E2E7E3] bg-white px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                        >
                          <option value="Profissional">Profissional</option>
                          <option value="Consultivo">Consultivo</option>
                          <option value="Empático">Empático</option>
                          <option value="Direto">Direto</option>
                          <option value="Formal">Formal</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#0B5226] mb-1">
                          Idioma principal
                        </label>
                        <select
                          value={formState.language}
                          onChange={(e) =>
                            setFormState({
                              ...formState,
                              language: e.target.value as AIAssistant['language'],
                            })
                          }
                          className="w-full min-h-[42px] rounded-xl border border-[#E2E7E3] bg-white px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                        >
                          <option value="Português (PT)">Português (PT)</option>
                          <option value="Português (BR)">Português (BR)</option>
                          <option value="Inglês">Inglês</option>
                          <option value="Espanhol">Espanhol</option>
                          <option value="Multilíngue Automático">
                            Multilíngue Automático
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Base de conhecimento */}
                {editorSection === 'knowledge' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="font-display text-base font-bold text-[#0B5226]">
                          Base de conhecimento vinculada
                        </h4>
                        <p className="text-xs text-[#526058]">
                          Escolha os ficheiros e FAQs do Armazenamento que este agente pode consultar.
                        </p>
                      </div>
                      <span className="rounded-lg bg-[#E3F6EA] px-2.5 py-1 text-xs font-semibold text-[#0B5226] tabular-nums">
                        {formState.linkedKnowledgeIds?.length ?? 0} selecionados
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {knowledgeDocs.map((doc) => {
                        const checked =
                          formState.linkedKnowledgeIds?.includes(doc.id) ?? false;
                        return (
                          <label
                            key={doc.id}
                            className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${
                              checked
                                ? 'border-[#178A3F]/35 bg-[#E3F6EA]/40'
                                : 'border-[#E2E7E3] bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleKnowledgeDoc(doc.id)}
                                className="mt-1 h-4 w-4 rounded accent-[#178A3F]"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#0B5226] truncate">
                                  {doc.title}
                                </p>
                                <p className="mt-0.5 text-[11px] text-[#526058]">
                                  {doc.category} · {doc.sourceType} · {doc.chunksCount} blocos
                                </p>
                              </div>
                            </div>
                            <BookOpen className="h-4 w-4 text-[#178A3F] shrink-0" />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 6. Capacidades multimodais */}
                {editorSection === 'multimodal' && (
                  <div className="space-y-4">
                    <h4 className="font-display text-base font-bold text-[#0B5226]">
                      Capacidades multimodais
                    </h4>
                    <div className="space-y-2.5">
                      {MULTIMODAL_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const enabled = formState.capabilities[item.key];
                        return (
                          <div
                            key={item.key}
                            className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E7E3] p-3.5"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E3F6EA] text-[#178A3F]">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[#0B5226]">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-[#526058]">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={enabled}
                              aria-label={item.title}
                              onClick={() =>
                                setFormState({
                                  ...formState,
                                  capabilities: {
                                    ...formState.capabilities,
                                    [item.key]: !enabled,
                                  },
                                })
                              }
                              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                                enabled ? 'bg-[#178A3F]' : 'bg-[#D63B3A]/60'
                              }`}
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform mt-0.5 ${
                                  enabled ? 'translate-x-5.5' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 7. Memória contextual */}
                {editorSection === 'memory' && (
                  <div className="space-y-4">
                    <h4 className="font-display text-base font-bold text-[#0B5226]">
                      Memória contextual
                    </h4>
                    <div className="space-y-2.5">
                      {MEMORY_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const enabled = formState.capabilities[item.key];
                        return (
                          <div
                            key={item.key}
                            className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E7E3] p-3.5"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E3F6EA] text-[#178A3F]">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[#0B5226]">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-[#526058]">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={enabled}
                              aria-label={item.title}
                              onClick={() =>
                                setFormState({
                                  ...formState,
                                  capabilities: {
                                    ...formState.capabilities,
                                    [item.key]: !enabled,
                                  },
                                })
                              }
                              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                                enabled ? 'bg-[#178A3F]' : 'bg-[#D63B3A]/60'
                              }`}
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform mt-0.5 ${
                                  enabled ? 'translate-x-5.5' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 8. Horário de funcionamento */}
                {editorSection === 'schedule' && (
                  <div className="space-y-4">
                    <h4 className="font-display text-base font-bold text-[#0B5226]">
                      Horário de funcionamento
                    </h4>
                    <div>
                      <label className="block text-xs font-semibold text-[#0B5226] mb-1">
                        Disponibilidade do agente
                      </label>
                      <div className="relative flex items-center">
                        <Clock className="pointer-events-none absolute left-3 h-4 w-4 text-[#526058]" />
                        <input
                          type="text"
                          value={formState.schedule}
                          onChange={(e) =>
                            setFormState({ ...formState, schedule: e.target.value })
                          }
                          className="w-full min-h-[42px] rounded-xl border border-[#E2E7E3] pl-9 pr-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        '24/7 Contínuo',
                        'Segunda a Sexta · 09:00–18:30',
                        'Fora de Horário (19:00–09:00)',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            setFormState({ ...formState, schedule: preset })
                          }
                          className="rounded-lg border border-[#E2E7E3] bg-[#F4F4F2] px-3 py-1.5 text-xs font-medium text-[#0B5226] hover:bg-[#E3F6EA]"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 9. Configurações de atendimento */}
                {editorSection === 'service' && (
                  <div className="space-y-4">
                    <h4 className="font-display text-base font-bold text-[#0B5226]">
                      Configurações de atendimento
                    </h4>
                    <div>
                      <label className="flex items-center justify-between text-xs font-semibold text-[#0B5226] mb-1.5">
                        <span className="inline-flex items-center gap-1.5">
                          <Sliders className="h-3.5 w-3.5 text-[#178A3F]" />
                          Limiar mínimo de confiança antes de transferir
                        </span>
                        <span className="tabular-nums text-[#178A3F]">
                          {formState.confidenceThreshold ?? 80}%
                        </span>
                      </label>
                      <input
                        type="range"
                        min={55}
                        max={95}
                        value={formState.confidenceThreshold ?? 80}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            confidenceThreshold: Number(e.target.value),
                          })
                        }
                        className="w-full accent-[#178A3F]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0B5226] mb-1">
                        Departamento de encaminhamento humano
                      </label>
                      <select
                        value={formState.handoffDepartment ?? 'Atendimento geral'}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            handoffDepartment: e.target.value as DepartmentName,
                          })
                        }
                        className="w-full min-h-[42px] rounded-xl border border-[#E2E7E3] bg-white px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                      >
                        <option value="Comercial">Comercial</option>
                        <option value="Suporte">Suporte</option>
                        <option value="Financeiro">Financeiro</option>
                        <option value="Atendimento geral">Atendimento geral</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* 10. Teste e ativação */}
                {editorSection === 'activation' && (
                  <div className="space-y-4">
                    <h4 className="font-display text-base font-bold text-[#0B5226]">
                      Teste e ativação
                    </h4>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E7E3] p-4 bg-[#F4F4F2]/55">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-[#178A3F] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-[#0B5226]">
                            Estado do agente no WhatsApp
                          </p>
                          <p className="text-xs text-[#526058]">
                            {formState.active
                              ? 'Ativo: responde automaticamente segundo as regras configuradas.'
                              : 'Inativo: guardado como rascunho sem responder a clientes.'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={formState.active}
                        aria-label="Ativar agente"
                        onClick={() =>
                          setFormState({ ...formState, active: !formState.active })
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                          formState.active ? 'bg-[#178A3F]' : 'bg-[#D63B3A]/60'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform mt-0.5 ${
                            formState.active ? 'translate-x-5.5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleSaveForm(e, true)}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-[#178A3F]/35 bg-[#E3F6EA] px-4 py-2 text-xs font-semibold text-[#0B5226] hover:bg-[#d2efdd]"
                    >
                      <Play className="h-4 w-4 text-[#178A3F]" />
                      Guardar e testar no simulador
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E7E3] bg-white px-5 py-3.5">
              <span className="text-[13px] text-[#526058]">
                {formState.active ? 'Agente pronto para ativação' : 'Modo rascunho (Inativo)'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="min-h-[44px] rounded-xl border border-[#E2E7E3] px-4 py-2 text-[13px] font-semibold text-[#526058] hover:bg-[#F4F4F2]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-[#178A3F] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#137334]"
                >
                  {editingNew ? 'Criar Agente' : 'Guardar alterações'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* AGENT TEST SIMULATOR MODAL */}
      {testAgent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="agent-simulator-title"
        >
          <div className="flex flex-col w-full max-w-2xl h-[min(580px,90dvh)] rounded-2xl border border-[#E2E7E3] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[#E2E7E3] bg-[#E3F6EA] px-5 py-3.5">
              <div className="min-w-0">
                <h3
                  id="agent-simulator-title"
                  className="font-display text-base font-bold text-[#0B5226] truncate"
                >
                  Testar Agente: {testAgent.name}
                </h3>
                <p className="text-[13px] text-[#0B5226]/75">
                  {testAgent.serviceType} · {testAgent.tone} ·{' '}
                  {testAgent.linkedKnowledgeIds?.length ?? knowledgeDocs.length} documentos vinculados
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTestAgent(null)}
                aria-label="Fechar simulador"
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-white/80 text-[#0B5226] hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
              {simMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-[#0B5226] text-white'
                        : 'bg-[#E3F6EA] border border-[#178A3F]/20 text-[#0B5226]'
                    }`}
                  >
                    {m.text}
                  </div>
                  {m.sender === 'ai' && (
                    <span className="mt-1 text-[11px] text-[#526058]">
                      Confiança {m.confidence}%
                      {m.source ? ` · Fonte: ${m.source}` : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-[#E2E7E3] bg-[#F4F4F2] p-3.5 space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {
                  [
                    'Qual é o prazo de devolução?',
                    'Qual o prazo de implementação?',
                    'Quero falar com um operador',
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setSimInput(prompt)}
                      className="min-h-[44px] rounded-lg border border-[#E2E7E3] bg-white px-3 py-1.5 text-[13px] font-medium text-[#0B5226] hover:bg-[#E3F6EA]"
                    >
                      {prompt}
                    </button>
                  ))
                }
              </div>

              <form onSubmit={handleRunSimulation} className="flex gap-2">
                <input
                  type="text"
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  placeholder="Escreva uma mensagem de cliente para testar..."
                  aria-label="Mensagem de teste do agente"
                  className="flex-1 min-w-0 min-h-[44px] rounded-xl border border-[#E2E7E3] bg-white px-3 py-2 text-[13px] text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#178A3F] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#137334] shrink-0"
                >
                  <Send className="h-4 w-4" />
                  Enviar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={pendingConfirm !== null}
        title={
          pendingConfirm?.kind === 'delete_agent'
            ? 'Eliminar agente IA'
            : pendingConfirm?.kind === 'pause_agent'
            ? 'Pausar agente IA'
            : 'Pausar automação'
        }
        description={
          pendingConfirm?.kind === 'delete_agent'
            ? `Tens a certeza que queres eliminar o agente "${pendingConfirm.assistant.name}"? Esta ação remove o agente da plataforma.`
            : pendingConfirm?.kind === 'pause_agent'
            ? `O agente "${pendingConfirm.assistant.name}" deixará de responder automaticamente aos clientes até ser reativado.`
            : pendingConfirm?.kind === 'pause_workflow'
            ? `A automação "${pendingConfirm.workflow.name}" deixará de ser executada até ser reativada.`
            : ''
        }
        confirmLabel={
          pendingConfirm?.kind === 'delete_agent' ? 'Eliminar' : 'Pausar'
        }
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => {
          if (pendingConfirm?.kind === 'delete_agent') {
            onDeleteAssistant(pendingConfirm.assistant.id);
          } else if (pendingConfirm?.kind === 'pause_agent') {
            onToggleAssistant(pendingConfirm.assistant.id);
          } else if (pendingConfirm?.kind === 'pause_workflow') {
            onToggleWorkflow(pendingConfirm.workflow.id);
          }
          setPendingConfirm(null);
        }}
      />
    </div>
  );
};
