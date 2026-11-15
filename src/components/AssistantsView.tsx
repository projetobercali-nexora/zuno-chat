import React, { useState } from 'react';
import {
  Bot,
  Brain,
  CheckCircle2,
  Edit3,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Mic,
  Plus,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  AIAssistant,
  AssistantCapabilities,
  KnowledgeDoc,
} from '../types/zuno';
import { simulateAssistantReply } from '../utils/zunoLogic';

interface AssistantsViewProps {
  assistants: AIAssistant[];
  knowledgeDocs: KnowledgeDoc[];
  onSaveAssistant: (assistant: AIAssistant, isNew: boolean) => void;
  onToggleAssistant: (id: string) => void;
  onUpdateCapabilities: (id: string, caps: AssistantCapabilities) => void;
}

const CAPABILITY_ITEMS: {
  key: keyof AssistantCapabilities;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    key: 'contextualMemory',
    title: 'Memória contextual das conversas',
    description: 'Retém factos e preferências do cliente durante toda a conversa.',
    icon: Brain,
  },
  {
    key: 'interactionHistory',
    title: 'Histórico de interações',
    description: 'Consulta atendimentos anteriores para manter continuidade.',
    icon: MessageSquare,
  },
  {
    key: 'audioRecognition',
    title: 'Reconhecimento de mensagens de áudio',
    description: 'Transcreve e interpreta notas de voz recebidas no WhatsApp.',
    icon: Mic,
  },
  {
    key: 'imageInterpretation',
    title: 'Interpretação de imagens recebidas',
    description: 'Analisa fotografias de produtos, faturas ou capturas de ecrã.',
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
    description: 'Cruza a pergunta com a base de conhecimento da empresa.',
    icon: Bot,
  },
  {
    key: 'conversationContinuity',
    title: 'Continuidade das conversas',
    description: 'Retoma diálogos interrompidos sem pedir dados repetidos.',
    icon: CheckCircle2,
  },
  {
    key: 'responsePersonalization',
    title: 'Personalização das respostas',
    description: 'Adapta o tratamento ao perfil, idioma e tom configurado.',
    icon: Sparkles,
  },
];

interface SimMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  source?: string | null;
  confidence?: number;
}

export const AssistantsView: React.FC<AssistantsViewProps> = ({
  assistants,
  knowledgeDocs,
  onSaveAssistant,
  onToggleAssistant,
  onUpdateCapabilities,
}) => {
  const [selectedId, setSelectedId] = useState(assistants[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState<'config' | 'capabilities' | 'simulator'>(
    'config'
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNew, setEditingNew] = useState(false);

  const selected =
    assistants.find((a) => a.id === selectedId) ?? assistants[0] ?? null;

  const [formState, setFormState] = useState<AIAssistant | null>(null);

  const [simInput, setSimInput] = useState('');
  const [simMessages, setSimMessages] = useState<SimMessage[]>([
    {
      id: 'sim-init',
      sender: 'ai',
      text: 'Olá! Estou pronto para testar o comportamento configurado com a base de conhecimento da empresa. Escreva uma pergunta de cliente.',
      confidence: 98,
    },
  ]);

  const openCreateModal = () => {
    setEditingNew(true);
    setFormState({
      id: `ast-${Date.now()}`,
      name: '',
      description: '',
      personality: 'Prestável, claro e focado em resolver rapidamente.',
      customInstructions: '',
      objective: '',
      serviceType: 'Comercial',
      language: 'Português (PT)',
      tone: 'Profissional',
      schedule: '24/7 Contínuo',
      active: true,
      resolutionRate: 90,
      avgResponseSec: 2.0,
      conversationsToday: 0,
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
    setEditorOpen(true);
  };

  const openEditModal = (ast: AIAssistant) => {
    setEditingNew(false);
    setFormState({ ...ast });
    setEditorOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState || !formState.name.trim()) return;
    onSaveAssistant(formState, editingNew);
    setSelectedId(formState.id);
    setEditorOpen(false);
  };

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !simInput.trim()) return;
    const question = simInput.trim();
    const result = simulateAssistantReply(question, selected, knowledgeDocs);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#178A3F]">
            Inteligência artificial centralizada ZUNO CHAT · Sem necessidade de API externa
          </p>
          <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0B5226]">
            Assistentes IA e Capacidades Multimodais
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#0B5226]/70">
            Configure múltiplos assistentes, personalidade, memória contextual e teste respostas antes de ativar no WhatsApp.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#178A3F] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#137334] transition-colors whitespace-nowrap self-start sm:self-auto min-h-[42px]"
        >
          <Plus className="h-4 w-4" />
          Criar assistente
        </button>
      </div>

      {/* Main Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Assistant List */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 self-start">
          {assistants.map((ast) => {
            const isSel = selected?.id === ast.id;
            return (
              <div
                key={ast.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  isSel
                    ? 'border-[#178A3F] bg-[#E3F6EA]/70'
                    : 'border-[#0B5226]/12 bg-white hover:border-[#178A3F]/45'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedId(ast.id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-[#178A3F] shrink-0" />
                      <h3 className="font-display text-sm font-bold text-[#0B5226]">
                        {ast.name}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-[#0B5226]/70 line-clamp-2">
                      {ast.description}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleAssistant(ast.id)}
                    aria-label={`${ast.active ? 'Desativar' : 'Ativar'} ${ast.name}`}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors shrink-0 ${
                      ast.active
                        ? 'bg-[#E3F6EA] text-[#0B5226] hover:bg-[#d2efdd]'
                        : 'bg-[#FCEBEB] text-[#791F1F] hover:bg-[#f9dada]'
                    }`}
                  >
                    {ast.active ? 'Ativo' : 'Desativado'}
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-[#0B5226]/10 flex items-center justify-between text-xs text-[#0B5226]/70">
                  <span>
                    {ast.serviceType} · {ast.tone}
                  </span>
                  <span className="tabular-nums font-semibold text-[#0B5226]">
                    {ast.resolutionRate}% resolução
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Assistant Workspace */}
        <div className="lg:col-span-8 rounded-2xl border border-[#0B5226]/12 bg-white overflow-hidden">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F4F4F2] px-4 sm:px-6 py-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#0B5226]">
                    {selected.name}
                  </h3>
                  <p className="text-xs text-[#0B5226]/65">
                    {selected.serviceType} · {selected.language} · {selected.schedule}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openEditModal(selected)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#178A3F]/30 bg-[#E3F6EA] px-3 py-2 text-xs font-semibold text-[#0B5226] hover:bg-[#d2efdd]"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Editar assistente
                </button>
              </div>

              {/* Scrollable Tabs on Mobile */}
              <div className="flex overflow-x-auto border-b border-[#F4F4F2] px-4 sm:px-6 gap-5">
                {[
                  { id: 'config', label: 'Configuração e Comportamento' },
                  { id: 'capabilities', label: 'Memória & Multimodal' },
                  { id: 'simulator', label: 'Testar Assistente (Simulador)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setActiveTab(tab.id as 'config' | 'capabilities' | 'simulator')
                    }
                    className={`py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                      activeTab === tab.id
                        ? 'border-[#178A3F] text-[#178A3F]'
                        : 'border-transparent text-[#0B5226]/60 hover:text-[#0B5226]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4 sm:p-6">
                {activeTab === 'config' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-[#0B5226]/12 bg-[#E3F6EA]/55 p-3.5">
                        <p className="text-xs text-[#0B5226]/70">Tipo de atendimento</p>
                        <p className="mt-1 text-sm font-semibold text-[#0B5226]">
                          {selected.serviceType}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#0B5226]/12 bg-[#E3F6EA]/55 p-3.5">
                        <p className="text-xs text-[#0B5226]/70">Tom de comunicação</p>
                        <p className="mt-1 text-sm font-semibold text-[#0B5226]">
                          {selected.tone}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#0B5226]/12 bg-[#E3F6EA]/55 p-3.5">
                        <p className="text-xs text-[#0B5226]/70">Tempo médio resposta</p>
                        <p className="mt-1 text-sm font-semibold text-[#178A3F] tabular-nums">
                          {selected.avgResponseSec}s
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-[#0B5226]">
                        Objetivo do assistente
                      </h4>
                      <p className="mt-1.5 rounded-xl border border-[#0B5226]/10 bg-[#F4F4F2] p-3.5 text-sm text-[#0B5226]">
                        {selected.objective}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-[#0B5226]">
                        Personalidade e comportamento
                      </h4>
                      <p className="mt-1.5 rounded-xl border border-[#0B5226]/10 bg-[#F4F4F2] p-3.5 text-sm text-[#0B5226]">
                        {selected.personality}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-[#0B5226]">
                        Instruções personalizadas
                      </h4>
                      <p className="mt-1.5 rounded-xl border border-[#0B5226]/10 bg-[#F4F4F2] p-3.5 text-sm text-[#0B5226] leading-relaxed">
                        {selected.customInstructions}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'capabilities' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="font-display text-sm font-semibold text-[#0B5226]">
                          Memória e Capacidades Multimodais
                        </h4>
                        <p className="text-xs text-[#0B5226]/65">
                          Ative ou desative os módulos cognitivos disponíveis para {selected.name}.
                        </p>
                      </div>
                      <span className="rounded-lg bg-[#E3F6EA] px-2.5 py-1 text-xs font-semibold text-[#0B5226] tabular-nums">
                        {
                          Object.values(selected.capabilities).filter(Boolean).length
                        }{' '}
                        de 8 ativas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {CAPABILITY_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const enabled = selected.capabilities[item.key];
                        return (
                          <div
                            key={item.key}
                            className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 transition-colors ${
                              enabled
                                ? 'border-[#178A3F]/25 bg-white'
                                : 'border-[#D63B3A]/20 bg-[#FCEBEB]/35'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                  enabled
                                    ? 'bg-[#E3F6EA] text-[#178A3F]'
                                    : 'bg-[#FCEBEB] text-[#D63B3A]'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-[#0B5226]">
                                  {item.title}
                                </p>
                                <p className="mt-0.5 text-[11px] text-[#0B5226]/65">
                                  {item.description}
                                </p>
                                <p
                                  className={`mt-1 text-[11px] font-semibold ${
                                    enabled ? 'text-[#178A3F]' : 'text-[#791F1F]'
                                  }`}
                                >
                                  {enabled ? 'Ativa e operacional' : 'Desativada'}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={enabled}
                              aria-label={item.title}
                              onClick={() =>
                                onUpdateCapabilities(selected.id, {
                                  ...selected.capabilities,
                                  [item.key]: !enabled,
                                })
                              }
                              className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full transition-colors ${
                                enabled ? 'bg-[#178A3F]' : 'bg-[#D63B3A]/60'
                              }`}
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform mt-0.5 ${
                                  enabled ? 'translate-x-4.5' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'simulator' && (
                  <div className="flex flex-col h-[420px] rounded-xl border border-[#0B5226]/15 overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#E3F6EA] px-4 py-2.5 border-b border-[#178A3F]/15 text-xs">
                      <span className="font-semibold text-[#0B5226]">
                        Conversa simulada com {selected.name}
                      </span>
                      <span className="text-[#0B5226]/75">
                        {knowledgeDocs.filter((d) => d.status === 'indexed').length}{' '}
                        documentos indexados ativos
                      </span>
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
                            <span className="mt-1 text-[11px] text-[#0B5226]/60">
                              Confiança {m.confidence}%
                              {m.source ? ` · Base: ${m.source}` : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[#F4F4F2] bg-[#F4F4F2] p-3 space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Qual é o prazo de devolução?',
                          'Qual o prazo de implementação?',
                          'Quero falar com um operador',
                        ].map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => setSimInput(prompt)}
                            className="rounded-lg border border-[#0B5226]/15 bg-white px-2.5 py-1 text-[11px] font-medium text-[#0B5226] hover:bg-[#E3F6EA]"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                      <form onSubmit={handleRunSimulation} className="flex gap-2">
                        <input
                          type="text"
                          value={simInput}
                          onChange={(e) => setSimInput(e.target.value)}
                          placeholder="Escreva uma mensagem de teste..."
                          aria-label="Mensagem para testar assistente"
                          className="flex-1 min-w-0 rounded-xl border border-[#0B5226]/15 bg-white px-3 py-2 text-xs text-[#0B5226] focus:border-[#178A3F] focus:outline-none min-h-[40px]"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#178A3F] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#137334] shrink-0 min-h-[40px]"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Testar
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-sm text-[#0B5226]/65">
              Crie o primeiro assistente IA para começar.
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Assistant Modal */}
      {editorOpen && formState && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assistant-modal-title"
        >
          <form
            onSubmit={handleSaveForm}
            className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl border border-[#0B5226]/15 bg-white p-5 sm:p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3
                id="assistant-modal-title"
                className="font-display text-lg font-bold text-[#0B5226]"
              >
                {editingNew ? 'Criar novo assistente IA' : `Editar ${formState.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                aria-label="Fechar modal"
                className="rounded-lg p-1 text-[#0B5226]/60 hover:bg-[#E3F6EA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[#0B5226] mb-1">
                  Nome do assistente
                </label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) =>
                    setFormState({ ...formState, name: e.target.value })
                  }
                  placeholder="Ex.: Zuno Atendimento Comercial"
                  className="w-full rounded-xl border border-[#0B5226]/20 px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0B5226] mb-1">
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
                  className="w-full rounded-xl border border-[#0B5226]/20 px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                >
                  <option value="Comercial">Comercial</option>
                  <option value="Suporte Técnico">Suporte Técnico</option>
                  <option value="Agendamento">Agendamento</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Triagem Geral">Triagem Geral</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0B5226] mb-1">
                  Idioma
                </label>
                <select
                  value={formState.language}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      language: e.target.value as AIAssistant['language'],
                    })
                  }
                  className="w-full rounded-xl border border-[#0B5226]/20 px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
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

              <div>
                <label className="block text-xs font-medium text-[#0B5226] mb-1">
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
                  className="w-full rounded-xl border border-[#0B5226]/20 px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                >
                  <option value="Profissional">Profissional</option>
                  <option value="Consultivo">Consultivo</option>
                  <option value="Empático">Empático</option>
                  <option value="Direto">Direto</option>
                  <option value="Formal">Formal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#0B5226] mb-1">
                Descrição
              </label>
              <input
                type="text"
                required
                value={formState.description}
                onChange={(e) =>
                  setFormState({ ...formState, description: e.target.value })
                }
                placeholder="Breve resumo do papel deste assistente"
                className="w-full rounded-xl border border-[#0B5226]/20 px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#0B5226] mb-1">
                Objetivo do assistente
              </label>
              <input
                type="text"
                required
                value={formState.objective}
                onChange={(e) =>
                  setFormState({ ...formState, objective: e.target.value })
                }
                placeholder="Ex.: Esclarecer dúvidas de produto e encaminhar leads qualificados"
                className="w-full rounded-xl border border-[#0B5226]/20 px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#0B5226] mb-1">
                Personalidade e comportamento
              </label>
              <textarea
                rows={2}
                value={formState.personality}
                onChange={(e) =>
                  setFormState({ ...formState, personality: e.target.value })
                }
                className="w-full rounded-xl border border-[#0B5226]/20 px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#0B5226] mb-1">
                Instruções personalizadas
              </label>
              <textarea
                rows={3}
                value={formState.customInstructions}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    customInstructions: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-[#0B5226]/20 px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#0B5226] mb-1">
                Horário de funcionamento
              </label>
              <input
                type="text"
                value={formState.schedule}
                onChange={(e) =>
                  setFormState({ ...formState, schedule: e.target.value })
                }
                className="w-full rounded-xl border border-[#0B5226]/20 px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded-xl border border-[#0B5226]/20 px-4 py-2 text-xs font-semibold text-[#0B5226] hover:bg-[#F4F4F2]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#178A3F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#137334]"
              >
                Guardar assistente
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
