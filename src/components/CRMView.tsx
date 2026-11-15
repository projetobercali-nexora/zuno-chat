import React, { useEffect, useState } from 'react';
import {
  Kanban,
  MessageSquare,
  Plus,
  Search,
  Table as TableIcon,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type { Contact, CRMStage, Operator } from '../types/zuno';
import {
  computePipelineMetrics,
  CRM_STAGES,
  filterContacts,
} from '../utils/zunoLogic';
import { Avatar } from './Avatar';
import { ConfirmModal } from './ConfirmModal';
import { EmptyState } from './EmptyState';

interface CRMViewProps {
  contacts: Contact[];
  operators: Operator[];
  autoOpenCreate?: boolean;
  onClearAutoOpen?: () => void;
  focusedContactId?: string | null;
  onClearFocusedContact?: () => void;
  onAddContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
  onUpdateContactStage: (contactId: string, stage: CRMStage) => void;
  onAddContactNote: (contactId: string, content: string) => void;
  onOpenWhatsAppChat: (contactId: string) => void;
}

export const CRMView: React.FC<CRMViewProps> = ({
  contacts,
  operators,
  autoOpenCreate = false,
  onClearAutoOpen,
  focusedContactId,
  onClearFocusedContact,
  onAddContact,
  onDeleteContact,
  onUpdateContactStage,
  onAddContactNote,
  onOpenWhatsAppChat,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<CRMStage | 'all'>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [confirmDeleteContact, setConfirmDeleteContact] = useState<Contact | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [newModalOpen, setNewModalOpen] = useState(false);

  useEffect(() => {
    if (autoOpenCreate) {
      setNewModalOpen(true);
      onClearAutoOpen?.();
    }
  }, [autoOpenCreate]);

  useEffect(() => {
    if (focusedContactId) {
      setSelectedContactId(focusedContactId);
      onClearFocusedContact?.();
    }
  }, [focusedContactId]);

  const [newForm, setNewForm] = useState({
    name: '',
    company: '',
    phone: '+351 ',
    email: '',
    origin: 'WhatsApp Direto' as Contact['origin'],
    estimatedValueEur: '2500',
    tags: 'WhatsApp, Lead',
  });

  const filtered = filterContacts(contacts, searchQuery, stageFilter, originFilter);
  const metrics = computePipelineMetrics(contacts);
  const selectedContact =
    contacts.find((c) => c.id === selectedContactId) ?? null;

  const hasFilters =
    searchQuery.trim() !== '' || stageFilter !== 'all' || originFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStageFilter('all');
    setOriginFilter('all');
  };

  const getOperatorName = (id: string) =>
    operators.find((o) => o.id === id)?.name ?? 'Não atribuído';

  const getStageLabel = (stage: CRMStage) =>
    CRM_STAGES.find((s) => s.id === stage)?.label ?? stage;

  const getStageBadgeClass = (stage: CRMStage) => {
    if (stage === 'lost') return 'bg-[#FCEBEB] text-[#791F1F]';
    if (stage === 'converted') return 'bg-[#E3F6EA] text-[#0B5226]';
    return 'bg-[#F4F4F2] text-[#0B5226]';
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.phone.trim()) return;
    const created: Contact = {
      id: `ct-${Date.now()}`,
      name: newForm.name.trim(),
      company: newForm.company.trim() || 'Cliente Particular',
      phone: newForm.phone.trim(),
      email: newForm.email.trim() || 'contacto@empresa.pt',
      tags: newForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      origin: newForm.origin,
      stage: 'new_contact',
      responsibleOperatorId: operators[0]?.id ?? '',
      estimatedValueEur: Number(newForm.estimatedValueEur) || 0,
      lastContactAt: 'Agora mesmo',
      conversationSummary: 'Contacto registado manualmente no CRM.',
      notes: [],
    };
    onAddContact(created);
    setNewModalOpen(false);
    setNewForm({
      name: '',
      company: '',
      phone: '+351 ',
      email: '',
      origin: 'WhatsApp Direto',
      estimatedValueEur: '2500',
      tags: 'WhatsApp, Lead',
    });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !noteInput.trim()) return;
    onAddContactNote(selectedContact.id, noteInput.trim());
    setNoteInput('');
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0B5226]">
            Contactos e Pipeline CRM
          </h2>
          <p className="mt-1 text-sm text-[#526058]">
            CRM integrado diretamente com o WhatsApp. Acompanhe oportunidades desde o primeiro contacto até à conversão.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded-xl border border-[#E2E7E3] bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[#0B5226] text-white'
                  : 'text-[#526058] hover:text-[#0B5226]'
              }`}
            >
              <Kanban className="h-4 w-4" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#0B5226] text-white'
                  : 'text-[#526058] hover:text-[#0B5226]'
              }`}
            >
              <TableIcon className="h-4 w-4" />
              Tabela
            </button>
          </div>

          <button
            type="button"
            onClick={() => setNewModalOpen(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#178A3F] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#137334] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo contacto
          </button>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#E2E7E3] bg-white p-4">
          <p className="text-[13px] text-[#526058]">Total de contactos</p>
          <p className="mt-1 font-display text-2xl font-bold text-[#0B5226] tabular-nums">
            {contacts.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E2E7E3] bg-white p-4">
          <p className="text-[13px] text-[#526058]">Valor total no pipeline</p>
          <p className="mt-1 font-display text-2xl font-bold text-[#0B5226] tabular-nums">
            €{metrics.totalValueEur.toLocaleString('pt-PT')}
          </p>
        </div>
        <div className="rounded-2xl border border-[#178A3F]/20 bg-[#E3F6EA]/50 p-4">
          <p className="text-[13px] text-[#0B5226]">Oportunidades ativas</p>
          <p className="mt-1 font-display text-2xl font-bold text-[#178A3F] tabular-nums">
            {metrics.activeDealsCount}
          </p>
        </div>
        <div className="rounded-2xl border border-[#178A3F]/20 bg-white p-4">
          <p className="text-[13px] text-[#526058]">Taxa de conversão</p>
          <p className="mt-1 font-display text-2xl font-bold text-[#178A3F] tabular-nums">
            {metrics.conversionRatePct}%
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#E2E7E3] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#526058]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar nome, empresa, telefone ou etiqueta..."
            aria-label="Pesquisar contactos CRM"
            className="w-full min-h-[44px] rounded-xl border border-[#E2E7E3] bg-[#F4F4F2] pl-9 pr-3 py-2 text-[13px] text-[#1A241E] focus:border-[#178A3F] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as CRMStage | 'all')}
            aria-label="Filtrar por etapa comercial"
            className="min-h-[44px] rounded-xl border border-[#E2E7E3] bg-white px-3 py-2 text-[13px] font-medium text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
          >
            <option value="all">Todas as etapas</option>
            {CRM_STAGES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.label}
              </option>
            ))}
          </select>

          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            aria-label="Filtrar por origem"
            className="min-h-[44px] rounded-xl border border-[#E2E7E3] bg-white px-3 py-2 text-[13px] font-medium text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
          >
            <option value="all">Todas as origens</option>
            <option value="WhatsApp Direto">WhatsApp Direto</option>
            <option value="Campanha QR">Campanha QR</option>
            <option value="Indicação">Indicação</option>
            <option value="Importação CRM">Importação CRM</option>
          </select>
        </div>
      </div>

      {/* Empty State when no matching contacts */}
      {filtered.length === 0 ? (
        <EmptyState
          testId="crm-empty-state"
          icon={Users}
          title={
            hasFilters
              ? 'Nenhum contacto encontrado'
              : 'Sem contactos no CRM'
          }
          description={
            hasFilters
              ? 'Nenhum contacto corresponde aos filtros aplicados.'
              : 'Adiciona o primeiro contacto ou inicia conversas no WhatsApp para preencher o pipeline.'
          }
          actionLabel={hasFilters ? 'Limpar filtros' : 'Novo contacto'}
          onAction={hasFilters ? clearFilters : () => setNewModalOpen(true)}
        />
      ) : (
        <>
          {/* KANBAN VIEW */}
          {viewMode === 'kanban' && (
            <div className="min-w-0 w-full flex gap-4 overflow-x-auto pb-4">
              {CRM_STAGES.map((stage) => {
                const stageContacts = filtered.filter((c) => c.stage === stage.id);
                const isLost = stage.id === 'lost';
                const isConverted = stage.id === 'converted';
                return (
                  <div
                    key={stage.id}
                    className={`w-[272px] sm:w-72 shrink-0 rounded-2xl border p-3 flex flex-col ${
                      isLost
                        ? 'border-[#D63B3A]/25 bg-[#FCEBEB]/45'
                        : isConverted
                        ? 'border-[#178A3F]/25 bg-[#E3F6EA]/50'
                        : 'border-[#E2E7E3] bg-[#F4F4F2]'
                    }`}
                  >
                    <div className="flex items-center justify-between px-1 pb-3">
                      <h3
                        className={`font-display text-[13px] font-bold ${
                          isLost ? 'text-[#791F1F]' : 'text-[#0B5226]'
                        }`}
                      >
                        {stage.label}
                      </h3>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[13px] font-semibold tabular-nums ${
                          isLost
                            ? 'bg-[#FCEBEB] text-[#791F1F]'
                            : 'bg-white text-[#0B5226]'
                        }`}
                      >
                        {stageContacts.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {stageContacts.length > 0 ? (
                        stageContacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="rounded-xl border border-[#E2E7E3] bg-white p-3.5 hover:border-[#178A3F]/50 transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedContactId(contact.id)}
                              className="w-full text-left"
                            >
                              <div className="flex items-center gap-2.5">
                                <Avatar
                                  name={contact.name}
                                  src={contact.avatar}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-[#1A241E] truncate">
                                    {contact.name}
                                  </p>
                                  <p className="text-[13px] text-[#526058] truncate">
                                    {contact.company}
                                  </p>
                                </div>
                              </div>

                              <p className="mt-2 font-mono text-[13px] text-[#526058]">
                                {contact.phone}
                              </p>
                              <p className="mt-1 text-[13px] text-[#526058]">
                                {contact.origin} · €
                                {contact.estimatedValueEur.toLocaleString('pt-PT')}
                              </p>
                              {contact.tags.length > 0 && (
                                <p className="mt-1.5 inline-block max-w-full rounded-md bg-[#E3F6EA] px-2 py-0.5 text-[13px] font-medium text-[#0B5226] truncate">
                                  {contact.tags.join(' · ')}
                                </p>
                              )}
                            </button>

                            <div className="mt-3 pt-2.5 border-t border-[#E2E7E3] flex items-center justify-between gap-2 text-[13px]">
                              <span className="text-[#526058] truncate">
                                {getOperatorName(contact.responsibleOperatorId)}
                              </span>
                              <select
                                value={contact.stage}
                                onChange={(e) =>
                                  onUpdateContactStage(
                                    contact.id,
                                    e.target.value as CRMStage
                                  )
                                }
                                aria-label={`Alterar etapa de ${contact.name}`}
                                className="min-h-[38px] rounded-md border border-[#E2E7E3] bg-[#F4F4F2] px-2 py-1 text-[13px] font-medium text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                              >
                                {CRM_STAGES.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-[#E2E7E3] bg-white/60 p-4 text-center text-[13px] text-[#526058]">
                          Sem contactos nesta etapa
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="rounded-2xl border border-[#E2E7E3] bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-[13px]">
                  <thead className="border-b border-[#E2E7E3] bg-[#F4F4F2] text-[#526058]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Contacto</th>
                      <th className="px-4 py-3 font-semibold">Telefone</th>
                      <th className="px-4 py-3 font-semibold">Etapa comercial</th>
                      <th className="px-4 py-3 font-semibold">Origem</th>
                      <th className="px-4 py-3 font-semibold">Responsável</th>
                      <th className="px-4 py-3 font-semibold text-right">Valor</th>
                      <th className="px-4 py-3 font-semibold text-right">Último contacto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E7E3]">
                    {filtered.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedContactId(c.id)}
                        className="cursor-pointer hover:bg-[#E3F6EA]/40 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={c.name} src={c.avatar} size="sm" />
                            <div>
                              <p className="font-semibold text-[#1A241E]">{c.name}</p>
                              <p className="text-[13px] text-[#526058]">{c.company}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[#1A241E]">{c.phone}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 font-semibold ${getStageBadgeClass(
                              c.stage
                            )}`}
                          >
                            {getStageLabel(c.stage)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#526058]">{c.origin}</td>
                        <td className="px-4 py-3 text-[#1A241E]">
                          {getOperatorName(c.responsibleOperatorId)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-[#0B5226] tabular-nums">
                          €{c.estimatedValueEur.toLocaleString('pt-PT')}
                        </td>
                        <td className="px-4 py-3 text-right text-[#526058] tabular-nums">
                          {c.lastContactAt}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Contact Detail Drawer */}
      {selectedContact && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-[#0B5226]/35 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="crm-drawer-title"
          onClick={() => setSelectedContactId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white h-full overflow-y-auto p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#E2E7E3] pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  name={selectedContact.name}
                  src={selectedContact.avatar}
                  size="lg"
                />
                <div className="min-w-0">
                  <h3
                    id="crm-drawer-title"
                    className="font-display text-lg font-bold text-[#0B5226] truncate"
                  >
                    {selectedContact.name}
                  </h3>
                  <p className="text-[13px] text-[#526058] truncate">{selectedContact.company}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContactId(null)}
                aria-label="Fechar ficha de contacto"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-1 text-[#526058] hover:bg-[#F4F4F2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenWhatsAppChat(selectedContact.id);
                  setSelectedContactId(null);
                }}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#178A3F] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#137334] transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                Abrir conversa no WhatsApp
              </button>

              <button
                type="button"
                onClick={() => setConfirmDeleteContact(selectedContact)}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#D63B3A]/30 bg-[#FCEBEB] px-4 py-2 text-[13px] font-semibold text-[#791F1F] hover:bg-[#D63B3A] hover:text-white transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar contacto
              </button>
            </div>

            <div className="space-y-3 text-[13px] border-b border-[#E2E7E3] pb-4">
              <div className="flex justify-between gap-3">
                <span className="text-[#526058]">Telefone</span>
                <span className="font-mono font-semibold text-[#1A241E]">
                  {selectedContact.phone}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#526058]">Email</span>
                <span className="text-[#1A241E] truncate">{selectedContact.email}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#526058]">Origem</span>
                <span className="text-[#1A241E]">{selectedContact.origin}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#526058]">Responsável</span>
                <span className="text-[#1A241E]">
                  {getOperatorName(selectedContact.responsibleOperatorId)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-[#526058]">Estado comercial</span>
                <select
                  value={selectedContact.stage}
                  onChange={(e) =>
                    onUpdateContactStage(
                      selectedContact.id,
                      e.target.value as CRMStage
                    )
                  }
                  className="min-h-[44px] rounded-lg border border-[#E2E7E3] bg-[#F4F4F2] px-2.5 py-1.5 text-[13px] font-semibold text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                >
                  {CRM_STAGES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <h4 className="text-[13px] font-semibold text-[#0B5226]">
                Resumo do histórico de conversas
              </h4>
              <p className="mt-1.5 rounded-xl border border-[#178A3F]/20 bg-[#E3F6EA]/50 p-3 text-[13px] text-[#1A241E] leading-relaxed">
                {selectedContact.conversationSummary}
              </p>
            </div>

            <div>
              <h4 className="text-[13px] font-semibold text-[#0B5226]">
                Notas internas
              </h4>
              <div className="mt-2 space-y-2">
                {selectedContact.notes.length > 0 ? (
                  selectedContact.notes.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl border border-[#E2E7E3] bg-[#F4F4F2] p-3 text-[13px]"
                    >
                      <p className="text-[#1A241E]">{n.content}</p>
                      <p className="mt-1 text-[13px] text-[#526058]">
                        {n.author} · {n.createdAt}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-[13px] text-[#526058]">
                    Ainda sem notas internas registadas.
                  </p>
                )}
              </div>

              <form onSubmit={handleAddNote} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Adicionar nota interna..."
                  aria-label="Adicionar nota interna"
                  className="flex-1 min-w-0 min-h-[44px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-[13px] text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                />
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-[#0B5226] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#178A3F] transition-colors shrink-0"
                >
                  Guardar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* New Contact Modal */}
      {newModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B5226]/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-contact-title"
        >
          <form
            onSubmit={handleCreateContact}
            className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border border-[#E2E7E3] bg-white p-5 sm:p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3
                id="new-contact-title"
                className="font-display text-lg font-bold text-[#0B5226]"
              >
                Novo contacto CRM
              </h3>
              <button
                type="button"
                onClick={() => setNewModalOpen(false)}
                aria-label="Fechar modal"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-1 text-[#526058] hover:bg-[#F4F4F2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                Nome completo
              </label>
              <input
                type="text"
                required
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                className="w-full min-h-[44px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                  Empresa
                </label>
                <input
                  type="text"
                  value={newForm.company}
                  onChange={(e) =>
                    setNewForm({ ...newForm, company: e.target.value })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                  WhatsApp
                </label>
                <input
                  type="text"
                  required
                  value={newForm.phone}
                  onChange={(e) =>
                    setNewForm({ ...newForm, phone: e.target.value })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                  Origem
                </label>
                <select
                  value={newForm.origin}
                  onChange={(e) =>
                    setNewForm({
                      ...newForm,
                      origin: e.target.value as Contact['origin'],
                    })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-[#E2E7E3] bg-white px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                >
                  <option value="WhatsApp Direto">WhatsApp Direto</option>
                  <option value="Campanha QR">Campanha QR</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Importação CRM">Importação CRM</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                  Valor estimado (€)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newForm.estimatedValueEur}
                  onChange={(e) =>
                    setNewForm({
                      ...newForm,
                      estimatedValueEur: e.target.value,
                    })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewModalOpen(false)}
                className="min-h-[44px] rounded-xl border border-[#E2E7E3] px-4 py-2 text-[13px] font-semibold text-[#526058] hover:bg-[#F4F4F2]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[44px] rounded-xl bg-[#178A3F] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#137334]"
              >
                Criar contacto
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={confirmDeleteContact !== null}
        title="Eliminar contacto"
        description={
          confirmDeleteContact
            ? `Tens a certeza que queres eliminar "${confirmDeleteContact.name}" do CRM? Esta ação não pode ser anulada.`
            : ''
        }
        confirmLabel="Eliminar"
        onCancel={() => setConfirmDeleteContact(null)}
        onConfirm={() => {
          if (confirmDeleteContact) {
            onDeleteContact(confirmDeleteContact.id);
            if (selectedContactId === confirmDeleteContact.id) {
              setSelectedContactId(null);
            }
          }
          setConfirmDeleteContact(null);
        }}
      />
    </div>
  );
};
