import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Check,
  CheckCheck,
  FileText,
  Image as ImageIcon,
  Info,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  Tag,
  UserCheck,
  Volume2,
  X,
} from 'lucide-react';
import type {
  AIAssistant,
  Contact,
  Conversation,
  ConversationStatus,
  MessageAttachment,
  Operator,
} from '../types/zuno';
import { filterConversations } from '../utils/zunoLogic';
import { Avatar } from './Avatar';
import { EmptyState } from './EmptyState';

interface InboxViewProps {
  conversations: Conversation[];
  selectedConversationId: string;
  onSelectConversation: (id: string) => void;
  assistants: AIAssistant[];
  operators: Operator[];
  contacts: Contact[];
  onSendMessage: (
    conversationId: string,
    text: string,
    attachment?: MessageAttachment
  ) => void;
  onTransferToOperator: (conversationId: string, operatorId: string) => void;
  onReturnToAI: (conversationId: string, assistantId: string) => void;
  onResolveConversation: (conversationId: string) => void;
  onOpenIntegrations?: () => void;
}

const STATUS_FILTERS: { id: ConversationStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'ai_active', label: 'IA Ativa' },
  { id: 'waiting_human', label: 'Aguarda Humano' },
  { id: 'human_active', label: 'Humano' },
  { id: 'resolved', label: 'Resolvidas' },
];

export const InboxView: React.FC<InboxViewProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  assistants,
  operators,
  contacts,
  onSendMessage,
  onTransferToOperator,
  onReturnToAI,
  onResolveConversation,
  onOpenIntegrations,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'all'>('all');
  const [draftText, setDraftText] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<MessageAttachment | null>(
    null
  );
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedOperatorForTransfer, setSelectedOperatorForTransfer] = useState(
    operators[0]?.id ?? ''
  );
  const [mobileScreen, setMobileScreen] = useState<'list' | 'chat'>('list');
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const filtered = filterConversations(conversations, searchQuery, statusFilter);
  const activeConv =
    conversations.find((c) => c.id === selectedConversationId) ?? filtered[0] ?? null;

  const hasFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [activeConv?.id, activeConv?.messages.length, mobileScreen]);

  const relatedContact = activeConv
    ? contacts.find((ct) => ct.id === activeConv.contactId)
    : undefined;
  const assignedAssistant = activeConv?.assignedAssistantId
    ? assistants.find((a) => a.id === activeConv.assignedAssistantId)
    : undefined;
  const assignedOperator = activeConv?.assignedOperatorId
    ? operators.find((o) => o.id === activeConv.assignedOperatorId)
    : undefined;

  const handleSelectConversationItem = (id: string) => {
    onSelectConversation(id);
    setMobileScreen('chat');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv) return;
    if (!draftText.trim() && !pendingAttachment) return;
    onSendMessage(
      activeConv.id,
      draftText.trim() || `Ficheiro enviado: ${pendingAttachment?.name}`,
      pendingAttachment ?? undefined
    );
    setDraftText('');
    setPendingAttachment(null);
  };

  const statusText = (s: ConversationStatus) => {
    switch (s) {
      case 'ai_active':
        return 'Atendida por IA';
      case 'waiting_human':
        return 'Aguarda operador';
      case 'human_active':
        return 'Atendida por humano';
      case 'resolved':
        return 'Resolvida';
    }
  };

  const sampleAttachments: MessageAttachment[] = [
    {
      id: `att-${Date.now()}-1`,
      name: 'Proposta_Comercial_Zuno.pdf',
      type: 'document',
      sizeLabel: '840 KB · PDF',
    },
    {
      id: `att-${Date.now()}-2`,
      name: 'Catalogo_Funcionalidades.png',
      type: 'image',
      sizeLabel: '1.1 MB · Imagem',
    },
  ];

  const renderClientDetails = () => {
    if (!activeConv) {
      return (
        <EmptyState
          icon={Info}
          title="Sem detalhes disponíveis"
          description="Seleciona uma conversa para consultar o perfil do cliente."
        />
      );
    }
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center text-center pb-4 border-b border-[#F4F4F2]">
          <Avatar
            name={activeConv.contactName}
            src={activeConv.contactAvatar}
            size="lg"
          />
          <h3 className="mt-3 font-display text-base font-bold text-[#0B5226]">
            {activeConv.contactName}
          </h3>
          <p className="text-[13px] text-[#526058]">{activeConv.companyName}</p>
          <p className="mt-1 font-mono text-[13px] font-medium text-[#0B5226]">
            {activeConv.phone}
          </p>
        </div>

        {/* Transfer Action */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setTransferModalOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#178A3F] px-3.5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#137334] transition-colors min-h-[44px]"
          >
            <UserCheck className="h-4 w-4" />
            Transferir para operador
          </button>

          {activeConv.status !== 'ai_active' && assistants[0] && (
            <button
              type="button"
              onClick={() => onReturnToAI(activeConv.id, assistants[0].id)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#178A3F]/30 bg-[#E3F6EA] px-3.5 py-2 text-[13px] font-semibold text-[#0B5226] hover:bg-[#d2efdd] transition-colors min-h-[44px]"
            >
              <Bot className="h-4 w-4 text-[#178A3F]" />
              Reativar Assistente IA
            </button>
          )}
        </div>

        {/* Details */}
        <div className="space-y-3 text-[13px] border-t border-[#F4F4F2] pt-4">
          <div className="flex justify-between gap-2">
            <span className="text-[#526058]">Estado</span>
            <span
              className={`font-semibold ${
                activeConv.status === 'waiting_human'
                  ? 'text-[#D63B3A]'
                  : 'text-[#0B5226]'
              }`}
            >
              {statusText(activeConv.status)}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#526058]">Departamento</span>
            <span className="font-medium text-[#0B5226]">
              {activeConv.department}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#526058]">Assistente responsável</span>
            <span className="font-semibold text-[#178A3F] text-right">
              {assignedAssistant?.name ?? 'Não atribuído'}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-[#526058]">Operador humano</span>
            <span className="font-medium text-[#0B5226] text-right">
              {assignedOperator?.name ?? 'Sem operador'}
            </span>
          </div>
          {relatedContact && (
            <div className="flex justify-between gap-2">
              <span className="text-[#526058]">Email</span>
              <span className="font-medium text-[#0B5226] truncate">
                {relatedContact.email}
              </span>
            </div>
          )}
        </div>

        {/* Etiquetas */}
        <div className="border-t border-[#F4F4F2] pt-4">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0B5226]">
            <Tag className="h-4 w-4 text-[#178A3F]" />
            Etiquetas
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {activeConv.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-[#E3F6EA] px-2.5 py-1 text-[13px] font-medium text-[#0B5226]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Histórico de Atendimento */}
        <div className="border-t border-[#F4F4F2] pt-4">
          <h4 className="text-[13px] font-semibold text-[#0B5226]">
            Histórico de atendimento
          </h4>
          <ul className="mt-2 space-y-2 text-[13px] text-[#0B5226]/85">
            <li>
              <p className="font-semibold text-[#0B5226]">Canal WhatsApp verificado</p>
              <p className="text-[13px] text-[#526058]">
                {activeConv.messages.length} mensagens nesta sessão
              </p>
            </li>
            {relatedContact && (
              <li>
                <p className="font-semibold text-[#0B5226]">
                  Resumo CRM: {relatedContact.origin}
                </p>
                <p className="text-[13px] text-[#526058] mt-0.5">
                  {relatedContact.conversationSummary}
                </p>
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100dvh-6.2rem)] md:h-[calc(100dvh-8rem)] min-h-[520px] min-w-0">
      {/* Column 1: Conversation List */}
      <section
        aria-label="Lista de conversas"
        className={`${
          mobileScreen === 'list' ? 'flex' : 'hidden md:flex'
        } md:col-span-5 lg:col-span-4 xl:col-span-3 flex-col rounded-2xl border border-[#0B5226]/12 bg-white overflow-hidden min-h-0 min-w-0`}
      >
        <div className="p-3.5 border-b border-[#F4F4F2] space-y-3">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-[#526058]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar conversa..."
              aria-label="Pesquisar conversas"
              className="w-full min-h-[44px] rounded-xl border border-[#0B5226]/15 bg-[#F4F4F2] pl-9 pr-3 py-2 text-[13px] text-[#0B5226] placeholder:text-[#526058] focus:border-[#178A3F] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`min-h-[44px] rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === f.id
                    ? 'bg-[#0B5226] text-white'
                    : 'bg-[#F4F4F2] text-[#0B5226]/80 hover:bg-[#E3F6EA] hover:text-[#0B5226]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#F4F4F2]">
          {filtered.length > 0 ? (
            filtered.map((conv) => {
              const isSelected = activeConv?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => handleSelectConversationItem(conv.id)}
                  className={`flex w-full min-h-[44px] items-start gap-3 p-3.5 text-left transition-colors ${
                    isSelected
                      ? 'bg-[#E3F6EA]/75'
                      : 'hover:bg-[#F4F4F2]/80'
                  }`}
                >
                  <Avatar name={conv.contactName} src={conv.contactAvatar} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#0B5226] truncate">
                        {conv.contactName}
                      </span>
                      <span className="text-[13px] text-[#526058] tabular-nums shrink-0">
                        {conv.lastTimestamp}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[13px] text-[#0B5226]/80 truncate">
                      {conv.lastMessage}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-[13px]">
                      <span
                        className={`font-semibold ${
                          conv.status === 'waiting_human'
                            ? 'text-[#D63B3A]'
                            : conv.status === 'ai_active'
                            ? 'text-[#178A3F]'
                            : conv.status === 'human_active'
                            ? 'text-[#0B5226]'
                            : 'text-[#178A3F]'
                        }`}
                      >
                        {statusText(conv.status)}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D63B3A] px-1.5 text-[13px] font-bold text-white tabular-nums">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-4">
              <EmptyState
                testId="inbox-list-empty"
                icon={MessageSquare}
                title={
                  hasFilters
                    ? 'Nenhuma conversa encontrada'
                    : 'Caixa de entrada vazia'
                }
                description={
                  hasFilters
                    ? 'Nenhuma conversa corresponde aos filtros selecionados.'
                    : 'As novas mensagens recebidas no WhatsApp aparecerão aqui.'
                }
                actionLabel={
                  hasFilters
                    ? 'Limpar filtros'
                    : onOpenIntegrations
                    ? 'Configurar WhatsApp'
                    : undefined
                }
                onAction={
                  hasFilters
                    ? () => {
                        setSearchQuery('');
                        setStatusFilter('all');
                      }
                    : onOpenIntegrations
                }
              />
            </div>
          )}
        </div>
      </section>

      {/* Column 2: Chat Thread & Composer */}
      <section
        aria-label="Histórico da conversa"
        className={`${
          mobileScreen === 'chat' ? 'flex' : 'hidden md:flex'
        } md:col-span-7 lg:col-span-8 xl:col-span-6 flex-col rounded-2xl border border-[#0B5226]/12 bg-white overflow-hidden min-h-0 min-w-0`}
      >
        {activeConv ? (
          <>
            {/* Thread Header */}
            <div className="flex items-center justify-between gap-2 border-b border-[#F4F4F2] px-3 sm:px-4 py-3 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileScreen('list')}
                  aria-label="Voltar à lista de conversas"
                  className="md:hidden rounded-xl p-2 text-[#0B5226] hover:bg-[#E3F6EA] transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <Avatar
                  name={activeConv.contactName}
                  src={activeConv.contactAvatar}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0B5226] truncate">
                    {activeConv.contactName}
                  </p>
                  <p className="text-[13px] text-[#526058] truncate">
                    WhatsApp · {activeConv.phone} · {statusText(activeConv.status)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {activeConv.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={() => onResolveConversation(activeConv.id)}
                    className="rounded-lg border border-[#178A3F]/30 bg-[#E3F6EA] px-3 py-2 text-[13px] font-semibold text-[#0B5226] hover:bg-[#d2efdd] transition-colors whitespace-nowrap min-h-[44px]"
                  >
                    Resolver
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setInfoDrawerOpen(true)}
                  aria-label="Ver informações do cliente"
                  className="xl:hidden inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#0B5226]/15 bg-white px-3 py-2 text-[13px] font-semibold text-[#0B5226] hover:bg-[#F4F4F2] min-h-[44px] min-w-[44px]"
                >
                  <Info className="h-4 w-4 text-[#178A3F]" />
                  <span className="hidden sm:inline">Cliente</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto bg-[#F4F4F2]/75 p-3 sm:p-4 space-y-4 min-h-0"
            >
              {activeConv.messages.map((msg) => {
                if (msg.sender === 'system') {
                  return (
                    <div
                      key={msg.id}
                      className="mx-auto max-w-md rounded-xl border border-[#0B5226]/12 bg-white px-3.5 py-2 text-center text-[13px] text-[#0B5226]/85"
                    >
                      {msg.content} · <span className="text-[#526058]">{msg.timestamp}</span>
                    </div>
                  );
                }

                const isOutbound = msg.sender === 'ai' || msg.sender === 'operator';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isOutbound ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-[13px] text-[#526058]">
                      {msg.sender === 'ai' && (
                        <Bot className="h-3.5 w-3.5 text-[#178A3F]" />
                      )}
                      <span className="font-semibold text-[#0B5226]">
                        {msg.senderName}
                      </span>
                      <span>·</span>
                      <span className="tabular-nums">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-3.5 sm:px-4 py-2.5 text-sm leading-relaxed ${
                        msg.sender === 'ai'
                          ? 'bg-[#178A3F] text-white'
                          : msg.sender === 'operator'
                          ? 'bg-[#0B5226] text-white'
                          : 'bg-white border border-[#0B5226]/12 text-[#0B5226]'
                      }`}
                    >
                      <p>{msg.content}</p>

                      {msg.attachment && (
                        <div
                          className={`mt-2.5 flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] ${
                            isOutbound
                              ? 'bg-white/15 text-white'
                              : 'bg-[#E3F6EA] text-[#0B5226]'
                          }`}
                        >
                          {msg.attachment.type === 'image' ? (
                            <ImageIcon className="h-4 w-4 shrink-0" />
                          ) : msg.attachment.type === 'audio' ? (
                            <Volume2 className="h-4 w-4 shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">
                              {msg.attachment.name}
                            </p>
                            <p className="text-[13px] opacity-85">
                              {msg.attachment.sizeLabel}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Metadata & Delivery Indicators */}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px]">
                      {msg.aiMeta && (
                        <span className="text-[#0B5226] font-medium">
                          IA {msg.aiMeta.confidence}% confiança
                          {msg.aiMeta.knowledgeSource
                            ? ` · Fonte: ${msg.aiMeta.knowledgeSource}`
                            : ''}
                        </span>
                      )}
                      {isOutbound && msg.status && (
                        <span className="inline-flex items-center gap-0.5 text-[#178A3F] font-medium">
                          {msg.status === 'read' ? (
                            <CheckCheck className="h-3.5 w-3.5" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          <span>{msg.status === 'read' ? 'Lida' : 'Enviada'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky Message Composer */}
            <form
              onSubmit={handleSend}
              className="border-t border-[#F4F4F2] bg-white p-2.5 sm:p-3.5 space-y-2 shrink-0"
            >
              {pendingAttachment && (
                <div className="flex items-center justify-between rounded-xl border border-[#178A3F]/30 bg-[#E3F6EA] px-3 py-2 text-[13px] text-[#0B5226]">
                  <span className="font-medium truncate">
                    Anexo pronto: {pendingAttachment.name} ({pendingAttachment.sizeLabel})
                  </span>
                  <button
                    type="button"
                    onClick={() => setPendingAttachment(null)}
                    className="min-h-[44px] px-2 text-[#791F1F] hover:underline font-semibold ml-2 shrink-0"
                  >
                    Remover
                  </button>
                </div>
              )}

              <div className="relative flex items-center gap-2">
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setAttachMenuOpen((p) => !p)}
                    aria-label="Anexar imagem ou documento"
                    className="rounded-xl border border-[#0B5226]/15 p-2.5 text-[#0B5226] hover:bg-[#E3F6EA] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  {attachMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-[#0B5226]/15 bg-white p-2 shadow-lg z-20">
                      <p className="px-2 py-1 text-[13px] font-semibold text-[#526058]">
                        Enviar imagem ou documento
                      </p>
                      {sampleAttachments.map((att) => (
                        <button
                          key={att.id}
                          type="button"
                          onClick={() => {
                            setPendingAttachment(att);
                            setAttachMenuOpen(false);
                          }}
                          className="flex w-full min-h-[44px] items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-[#0B5226] hover:bg-[#E3F6EA]"
                        >
                          {att.type === 'image' ? (
                            <ImageIcon className="h-4 w-4 text-[#178A3F]" />
                          ) : (
                            <FileText className="h-4 w-4 text-[#0B5226]" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate">{att.name}</p>
                            <p className="text-[13px] text-[#526058]">{att.sizeLabel}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="Escreva uma mensagem..."
                  aria-label="Escrever mensagem"
                  className="flex-1 min-w-0 rounded-xl border border-[#0B5226]/15 bg-[#F4F4F2] px-3 py-2.5 text-sm text-[#0B5226] placeholder:text-[#526058] focus:border-[#178A3F] focus:bg-white focus:outline-none min-h-[44px]"
                />

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#178A3F] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#137334] transition-colors shrink-0 min-h-[44px]"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden min-[380px]:inline">Enviar</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <EmptyState
              testId="inbox-thread-empty"
              icon={MessageSquare}
              title="Nenhuma conversa selecionada"
              description="Seleciona uma conversa na lista para visualizar o histórico ou responder pelo WhatsApp."
              actionLabel={
                mobileScreen === 'chat' ? 'Voltar à lista' : undefined
              }
              onAction={
                mobileScreen === 'chat'
                  ? () => setMobileScreen('list')
                  : undefined
              }
            />
          </div>
        )}
      </section>

      {/* Column 3: Customer Information (Desktop >= 1280px) */}
      <section
        aria-label="Informações do cliente"
        className="hidden xl:flex xl:col-span-3 flex-col rounded-2xl border border-[#0B5226]/12 bg-white overflow-y-auto p-4 min-w-0"
      >
        {renderClientDetails()}
      </section>

      {/* Secondary Customer Info Drawer for Smartphones & Tablets */}
      {infoDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/45 xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Detalhes do cliente"
          onClick={() => setInfoDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white h-full overflow-y-auto p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F4F4F2]">
              <h3 className="font-display text-sm font-bold text-[#0B5226]">
                Informações do cliente
              </h3>
              <button
                type="button"
                onClick={() => setInfoDrawerOpen(false)}
                aria-label="Fechar detalhes do cliente"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-[#526058] hover:bg-[#E3F6EA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderClientDetails()}
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferModalOpen && activeConv && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#0B5226]/15 bg-white p-6 shadow-xl">
            <h3 id="transfer-title" className="font-display text-lg font-bold text-[#0B5226]">
              Transferir conversa para operador
            </h3>
            <p className="mt-1 text-[13px] text-[#526058]">
              Selecione o operador da equipa que irá assumir o atendimento de {activeConv.contactName}.
            </p>
            <div className="mt-4">
              <label
                htmlFor="transfer-operator-select"
                className="block text-[13px] font-medium text-[#0B5226] mb-1.5"
              >
                Operador de destino
              </label>
              <select
                id="transfer-operator-select"
                value={selectedOperatorForTransfer}
                onChange={(e) => setSelectedOperatorForTransfer(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-[#0B5226]/20 bg-white px-3 py-2.5 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
              >
                {operators.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.name} — {op.department} ({op.online ? 'Online' : 'Offline'})
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="min-h-[44px] rounded-xl border border-[#0B5226]/20 px-4 py-2 text-[13px] font-semibold text-[#0B5226] hover:bg-[#F4F4F2]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedOperatorForTransfer) {
                    onTransferToOperator(activeConv.id, selectedOperatorForTransfer);
                  }
                  setTransferModalOpen(false);
                }}
                className="min-h-[44px] rounded-xl bg-[#178A3F] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#137334]"
              >
                Confirmar transferência
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
