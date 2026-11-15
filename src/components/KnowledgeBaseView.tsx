import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  AIAssistant,
  KnowledgeCategory,
  KnowledgeDoc,
  KnowledgeStatus,
} from '../types/zuno';
import { filterKnowledgeDocs } from '../utils/zunoLogic';
import { ConfirmModal } from './ConfirmModal';
import { EmptyState } from './EmptyState';

interface KnowledgeBaseViewProps {
  docs: KnowledgeDoc[];
  assistants: AIAssistant[];
  focusedDocId?: string | null;
  onClearFocusedDoc?: () => void;
  onSaveDoc: (doc: KnowledgeDoc, isNew: boolean) => void;
  onDeleteDoc: (id: string) => void;
  onReprocessDoc: (id: string) => void;
}

const CATEGORIES: (KnowledgeCategory | 'all')[] = [
  'all',
  'FAQ',
  'Produtos',
  'Serviços',
  'Políticas',
  'Manuais PDF',
  'Conteúdo Manual',
];

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  docs,
  assistants,
  focusedDocId,
  onClearFocusedDoc,
  onSaveDoc,
  onDeleteDoc,
  onReprocessDoc,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<KnowledgeCategory | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [formDoc, setFormDoc] = useState<KnowledgeDoc | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeDoc | null>(null);

  useEffect(() => {
    if (focusedDocId) {
      const target = docs.find((d) => d.id === focusedDocId);
      if (target) {
        setIsNew(false);
        setFormDoc({ ...target });
        setModalOpen(true);
      }
      onClearFocusedDoc?.();
    }
  }, [focusedDocId, docs]);

  const filtered = filterKnowledgeDocs(docs, searchQuery, categoryFilter);

  const indexedCount = docs.filter((d) => d.status === 'indexed').length;
  const processingCount = docs.filter((d) => d.status === 'processing').length;
  const totalChunks = docs.reduce((sum, d) => sum + d.chunksCount, 0);

  const openNewDocModal = (
    presetCategory: KnowledgeCategory = 'FAQ',
    presetSource: KnowledgeDoc['sourceType'] = 'Manual'
  ) => {
    setIsNew(true);
    setFormDoc({
      id: `kb-${Date.now()}`,
      title: '',
      category: presetCategory,
      sourceType: presetSource,
      content: '',
      fileSize: presetSource === 'PDF' ? '1.4 MB' : undefined,
      chunksCount: 12,
      status: 'indexed',
      updatedAt: 'Agora mesmo',
      linkedAssistants: assistants.map((a) => a.id),
    });
    setModalOpen(true);
  };

  const openEditDocModal = (doc: KnowledgeDoc) => {
    setIsNew(false);
    setFormDoc({ ...doc });
    setModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const newDoc: KnowledgeDoc = {
      id: `kb-${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, ''),
      category: isPdf ? 'Manuais PDF' : 'Conteúdo Manual',
      sourceType: isPdf ? 'PDF' : 'Texto',
      fileSize: `${Math.max(12, Math.round(file.size / 1024))} KB`,
      content: `Conteúdo importado de ${file.name}. Disponível para consulta contextual pelos assistentes IA da empresa.`,
      chunksCount: 16,
      status: 'indexed',
      updatedAt: 'Agora mesmo',
      linkedAssistants: assistants.map((a) => a.id),
    };
    onSaveDoc(newDoc, true);
    e.target.value = '';
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDoc || !formDoc.title.trim() || !formDoc.content.trim()) return;
    const estimatedChunks = Math.max(4, Math.ceil(formDoc.content.length / 80));
    onSaveDoc(
      {
        ...formDoc,
        chunksCount: estimatedChunks,
        updatedAt: 'Agora mesmo',
      },
      isNew
    );
    setModalOpen(false);
  };

  const renderStatus = (status: KnowledgeStatus) => {
    if (status === 'indexed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg bg-[#E3F6EA] px-2.5 py-1 text-[13px] font-semibold text-[#0B5226]">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#178A3F]" />
          Indexado
        </span>
      );
    }
    if (status === 'processing') {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg bg-[#FCEBEB] px-2.5 py-1 text-[13px] font-semibold text-[#791F1F]">
          <Clock className="h-3.5 w-3.5 text-[#D63B3A]" />
          A processar
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-[#FCEBEB] px-2.5 py-1 text-[13px] font-semibold text-[#791F1F]">
        <AlertCircle className="h-3.5 w-3.5 text-[#D63B3A]" />
        Erro no ficheiro
      </span>
    );
  };

  const hasFilters = Boolean(searchQuery.trim() || categoryFilter !== 'all');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0B5226]">
            Armazenamento e Base de Conhecimento
          </h2>
          <p className="mt-1 text-[13px] sm:text-sm text-[#526058]">
            Carregue e organize PDFs, documentos, ficheiros, FAQs e políticas utilizados pelos agentes IA do ZUNO CHAT.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-[#178A3F]/30 bg-[#E3F6EA] px-3.5 py-2 text-[13px] font-semibold text-[#0B5226] hover:bg-[#d2efdd] transition-colors min-h-[44px]">
            <Upload className="h-4 w-4 text-[#178A3F]" />
            Importar PDF / TXT
            <input
              type="file"
              accept=".pdf,.txt,.md,.csv"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
          <button
            type="button"
            onClick={() => openNewDocModal('FAQ', 'FAQ')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#178A3F] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#137334] transition-colors min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            Adicionar conteúdo
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#0B5226]/12 bg-white p-4">
          <p className="text-[13px] text-[#526058]">Documentos ativos</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-[#0B5226] tabular-nums">
            {docs.length}
          </p>
          <p className="mt-0.5 text-[13px] text-[#526058]">
            {indexedCount} indexados · {processingCount} em processamento
          </p>
        </div>
        <div className="rounded-2xl border border-[#0B5226]/12 bg-white p-4">
          <p className="text-[13px] text-[#526058]">Segmentos de conhecimento</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-[#178A3F] tabular-nums">
            {totalChunks}
          </p>
          <p className="mt-0.5 text-[13px] text-[#526058]">
            Prontos para consulta contextual pela IA
          </p>
        </div>
        <div className="rounded-2xl border border-[#0B5226]/12 bg-white p-4">
          <p className="text-[13px] text-[#526058]">Adição rápida por tipo</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(
              [
                { label: '+ FAQ', cat: 'FAQ', src: 'FAQ' },
                { label: '+ Produto', cat: 'Produtos', src: 'Manual' },
                { label: '+ Serviço', cat: 'Serviços', src: 'Manual' },
                { label: '+ Política', cat: 'Políticas', src: 'Manual' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => openNewDocModal(btn.cat, btn.src)}
                className="min-h-[44px] rounded-xl border border-[#178A3F]/25 bg-[#E3F6EA] px-3 py-2 text-[13px] font-semibold text-[#0B5226] hover:bg-[#d2efdd] transition-colors"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="rounded-2xl border border-[#0B5226]/12 bg-white p-4 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#526058]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar documentos, FAQs ou políticas..."
              aria-label="Pesquisar base de conhecimento"
              className="w-full rounded-xl border border-[#0B5226]/15 bg-[#F4F4F2] pl-9 pr-3 py-2 text-[13px] text-[#0B5226] focus:border-[#178A3F] focus:bg-white focus:outline-none min-h-[44px]"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`min-h-[44px] rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-[#0B5226] text-white'
                    : 'bg-[#F4F4F2] text-[#0B5226] hover:bg-[#E3F6EA]'
                }`}
              >
                {cat === 'all' ? 'Todas' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Document List */}
        {filtered.length > 0 ? (
          <div className="divide-y divide-[#F4F4F2] pt-2">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E3F6EA] text-[#178A3F]">
                    {doc.sourceType === 'PDF' ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <BookOpen className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-sm sm:text-[15px] font-semibold text-[#0B5226]">
                        {doc.title}
                      </h3>
                      <span className="text-[13px] text-[#526058]">
                        · {doc.category} · {doc.sourceType}
                        {doc.fileSize ? ` (${doc.fileSize})` : ''}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-[#1A241E]/85 line-clamp-2 max-w-3xl">
                      {doc.content}
                    </p>
                    <p className="mt-1.5 text-[13px] text-[#526058] tabular-nums">
                      {doc.chunksCount} fragmentos · Atualizado: {doc.updatedAt}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                  {renderStatus(doc.status)}

                  {doc.status !== 'indexed' && (
                    <button
                      type="button"
                      onClick={() => onReprocessDoc(doc.id)}
                      title="Concluir / reprocessar indexação"
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#178A3F]/30 bg-[#E3F6EA] px-3 py-2 text-[13px] font-semibold text-[#0B5226] hover:bg-[#d2efdd]"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reprocessar
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openEditDocModal(doc)}
                    aria-label={`Editar ${doc.title}`}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#0B5226]/15 p-2 text-[#0B5226] hover:bg-[#E3F6EA]"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(doc)}
                    aria-label={`Eliminar ${doc.title}`}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#D63B3A]/25 p-2 text-[#D63B3A] hover:bg-[#FCEBEB]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pt-2">
            <EmptyState
              icon={BookOpen}
              title="Nenhum documento encontrado."
              description={
                hasFilters
                  ? 'Nenhum conteúdo corresponde aos filtros aplicados.'
                  : 'Adicione FAQs, catálogos em PDF ou políticas para alimentar os agentes IA.'
              }
              actionLabel={hasFilters ? 'Limpar filtros' : 'Adicionar conteúdo'}
              onAction={() => {
                if (hasFilters) {
                  setSearchQuery('');
                  setCategoryFilter('all');
                } else {
                  openNewDocModal('FAQ', 'FAQ');
                }
              }}
              testId="knowledge-empty-state"
            />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && formDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kb-modal-title"
        >
          <form
            onSubmit={handleSaveModal}
            className="w-full max-w-xl max-h-[90dvh] overflow-y-auto rounded-2xl border border-[#0B5226]/15 bg-white p-5 sm:p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3
                id="kb-modal-title"
                className="font-display text-lg font-bold text-[#0B5226]"
              >
                {isNew
                  ? 'Adicionar conteúdo à Base de Conhecimento'
                  : 'Editar conteúdo'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar modal"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#526058] hover:bg-[#E3F6EA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[13px] font-medium text-[#0B5226] mb-1">
                  Categoria
                </label>
                <select
                  value={formDoc.category}
                  onChange={(e) =>
                    setFormDoc({
                      ...formDoc,
                      category: e.target.value as KnowledgeCategory,
                    })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-[#0B5226]/20 bg-white px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                >
                  <option value="FAQ">FAQ</option>
                  <option value="Produtos">Produtos</option>
                  <option value="Serviços">Serviços</option>
                  <option value="Políticas">Políticas</option>
                  <option value="Manuais PDF">Manuais PDF</option>
                  <option value="Conteúdo Manual">Conteúdo Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#0B5226] mb-1">
                  Formato de origem
                </label>
                <select
                  value={formDoc.sourceType}
                  onChange={(e) =>
                    setFormDoc({
                      ...formDoc,
                      sourceType: e.target.value as KnowledgeDoc['sourceType'],
                    })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-[#0B5226]/20 bg-white px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                >
                  <option value="FAQ">Perguntas e Respostas (FAQ)</option>
                  <option value="Manual">Conteúdo Manual</option>
                  <option value="Texto">Ficheiro de Texto</option>
                  <option value="PDF">Documento PDF</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#0B5226] mb-1">
                Título do documento / assunto
              </label>
              <input
                type="text"
                required
                value={formDoc.title}
                onChange={(e) =>
                  setFormDoc({ ...formDoc, title: e.target.value })
                }
                placeholder="Ex.: Tabela de Preços e Prazos de Entrega"
                className="w-full min-h-[44px] rounded-xl border border-[#0B5226]/20 px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#0B5226] mb-1">
                Conteúdo utilizado pela IA
              </label>
              <textarea
                rows={5}
                required
                value={formDoc.content}
                onChange={(e) =>
                  setFormDoc({ ...formDoc, content: e.target.value })
                }
                placeholder="Introduza perguntas frequentes, detalhes de produtos, serviços ou políticas da empresa..."
                className="w-full rounded-xl border border-[#0B5226]/20 px-3 py-2 text-sm text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-h-[44px] rounded-xl border border-[#0B5226]/20 px-4 py-2 text-sm font-semibold text-[#0B5226] hover:bg-[#F4F4F2]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[44px] rounded-xl bg-[#178A3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#137334]"
              >
                Guardar e indexar
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Eliminar documento"
        description={
          deleteTarget
            ? `Tem a certeza de que pretende eliminar "${deleteTarget.title}" da base de conhecimento?`
            : ''
        }
        confirmLabel="Eliminar"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteDoc(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};
