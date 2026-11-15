import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, LogIn, X } from 'lucide-react';
import {
  addContactInTenant,
  addContactNoteInTenant,
  defaultZunoRepository,
  deleteAssistantInTenant,
  deleteContactInTenant,
  deleteKnowledgeDocInTenant,
  deleteNotifInTenant,
  deleteOperatorInTenant,
  deleteWorkflowInTenant,
  markAllNotifsReadInTenant,
  markConversationReadInTenant,
  markNotifReadInTenant,
  recordWorkflowTestRunInTenant,
  resolveConversationInTenant,
  saveSettingsInTenant,
  sendInboxMessageInTenant,
  toggleAssistantInTenant,
  toggleOperatorOnlineInTenant,
  toggleWorkflowInTenant,
  updateContactStageInTenant,
  updateDepartmentRoutingInTenant,
  updateWhatsAppSessionInTenant,
  upsertAssistantInTenant,
  upsertKnowledgeDocInTenant,
  upsertOperatorInTenant,
  upsertWorkflowInTenant,
} from './data/zunoStore';
import type {
  AIAssistant,
  AppSettings,
  Contact,
  CRMStage,
  DepartmentConfig,
  KnowledgeDoc,
  MessageAttachment,
  NavPage,
  NotificationItem,
  Operator,
  WhatsAppSession,
  Workflow,
  WorkspaceTenant,
} from './types/zuno';
import { Sidebar } from './components/Sidebar';
import { Topbar, type GlobalSearchTarget } from './components/Topbar';
import { DashboardView, type DashboardQuickAction } from './components/DashboardView';
import { IntegrationsView } from './components/IntegrationsView';
import { InboxView } from './components/InboxView';
import { AgentsView } from './components/AgentsView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { AutomationsView } from './components/AutomationsView';
import { CRMView } from './components/CRMView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView, type SettingsCategory } from './components/SettingsView';
import { AppErrorBoundary, ErrorBanner, PageSkeleton } from './components/PageSkeleton';
import { ZunoLogo } from './components/ZunoLogo';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTenant, setActiveTenant] = useState<WorkspaceTenant>(() => {
    try {
      return defaultZunoRepository.load();
    } catch (err) {
      return defaultZunoRepository.reset();
    }
  });

  const [activePage, setActivePage] = useState<NavPage>('overview');
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    typeof window !== 'undefined'
      ? window.innerWidth > 768 && window.innerWidth < 1024
      : false
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string>(
    activeTenant.conversations[0]?.id ?? ''
  );
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const pageTimerRef = useRef<number | null>(null);

  const [autoOpenAgentCreate, setAutoOpenAgentCreate] = useState(false);
  const [autoOpenContactCreate, setAutoOpenContactCreate] = useState(false);
  const [autoOpenFlowCreate, setAutoOpenFlowCreate] = useState(false);
  const [focusedAgentId, setFocusedAgentId] = useState<string | null>(null);
  const [focusedContactId, setFocusedContactId] = useState<string | null>(null);
  const [focusedDocId, setFocusedDocId] = useState<string | null>(null);
  const [settingsInitialCat, setSettingsInitialCat] = useState<
    SettingsCategory | undefined
  >(undefined);

  useEffect(() => {
    const syncSidebarForViewport = () => {
      const w = window.innerWidth;
      if (w > 768 && w < 1024) {
        setSidebarCollapsed(true);
      } else if (w >= 1024) {
        setSidebarCollapsed(false);
      }
      if (w > 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', syncSidebarForViewport);
    return () => window.removeEventListener('resize', syncSidebarForViewport);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (pageTimerRef.current) window.clearTimeout(pageTimerRef.current);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToast({ id, message, type });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3400);
  };

  const navigateTo = (page: NavPage) => {
    if (page === activePage) return;
    if (pageTimerRef.current) window.clearTimeout(pageTimerRef.current);
    setActivePage(page);
    setIsPageLoading(true);
    pageTimerRef.current = window.setTimeout(() => {
      setIsPageLoading(false);
    }, 150);
  };

  const updateActiveTenant = (
    updater: (tenant: WorkspaceTenant) => WorkspaceTenant
  ) => {
    setActiveTenant((prev) => {
      const next = updater(prev);
      defaultZunoRepository.save(next);
      return next;
    });
  };

  const handleRetryLoad = () => {
    try {
      const fresh = defaultZunoRepository.load();
      setActiveTenant(fresh);
      setLoadError(null);
      showToast('Dados da plataforma recarregados com sucesso.');
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar os dados.'
      );
    }
  };

  const handleOpenConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    updateActiveTenant((t) => markConversationReadInTenant(t, conversationId));
    navigateTo('inbox');
  };

  const handleUpdateWhatsApp = (
    updater: (prev: WhatsAppSession) => WhatsAppSession
  ) => {
    let nextStatus: WhatsAppSession['status'] = activeTenant.whatsapp.status;
    updateActiveTenant((t) => {
      const updated = updateWhatsAppSessionInTenant(t, updater);
      nextStatus = updated.whatsapp.status;
      return updated;
    });
    if (nextStatus === 'disconnected') {
      showToast('Sessão WhatsApp desconectada.', 'error');
    } else if (nextStatus === 'connected') {
      showToast('WhatsApp conectado e ativo.');
    } else {
      showToast('Estado da ligação WhatsApp atualizado.');
    }
  };

  const handleSendMessage = (
    conversationId: string,
    text: string,
    attachment?: MessageAttachment
  ) => {
    const nowTime = new Date().toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });
    updateActiveTenant((t) =>
      sendInboxMessageInTenant(t, conversationId, text, nowTime, attachment)
    );
  };

  const handleTransferToOperator = (
    conversationId: string,
    operatorId: string
  ) => {
    const op = activeTenant.operators.find((o) => o.id === operatorId);
    const nowTime = new Date().toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });
    updateActiveTenant((t) => ({
      ...t,
      conversations: t.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              status: 'human_active',
              assignedOperatorId: operatorId,
              department: op?.department ?? c.department,
              messages: [
                ...c.messages,
                {
                  id: `sys-${Date.now()}`,
                  sender: 'system',
                  senderName: 'Zuno Routing',
                  content: `Conversa transferida para ${op?.name ?? 'Operador'} (${op?.department ?? 'Equipa'}).`,
                  timestamp: nowTime,
                },
              ],
            }
          : c
      ),
    }));
    showToast(`Conversa transferida para ${op?.name ?? 'operador'}.`);
  };

  const handleReturnToAI = (conversationId: string, assistantId: string) => {
    const ast = activeTenant.assistants.find((a) => a.id === assistantId);
    const nowTime = new Date().toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });
    updateActiveTenant((t) => ({
      ...t,
      conversations: t.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              status: 'ai_active',
              assignedAssistantId: assistantId,
              assignedOperatorId: undefined,
              messages: [
                ...c.messages,
                {
                  id: `sys-${Date.now()}`,
                  sender: 'system',
                  senderName: 'Zuno IA',
                  content: `Atendimento retomado pelo assistente ${ast?.name ?? 'IA'}.`,
                  timestamp: nowTime,
                },
              ],
            }
          : c
      ),
    }));
    showToast('Assistente IA reativado nesta conversa.');
  };

  const handleResolveConversation = (conversationId: string) => {
    updateActiveTenant((t) => resolveConversationInTenant(t, conversationId));
    showToast('Conversa marcada como resolvida.');
  };

  const handleSaveAssistant = (assistant: AIAssistant, isNew: boolean) => {
    updateActiveTenant((t) => upsertAssistantInTenant(t, assistant, isNew));
    showToast(
      isNew
        ? `Agente "${assistant.name}" criado com sucesso.`
        : `Alterações em "${assistant.name}" guardadas.`
    );
  };

  const handleDeleteAssistant = (id: string) => {
    const found = activeTenant.assistants.find((a) => a.id === id);
    updateActiveTenant((t) => deleteAssistantInTenant(t, id));
    showToast(
      found
        ? `Agente "${found.name}" eliminado.`
        : 'Agente eliminado com sucesso.'
    );
  };

  const handleToggleAssistant = (id: string) => {
    const target = activeTenant.assistants.find((a) => a.id === id);
    updateActiveTenant((t) => toggleAssistantInTenant(t, id));
    if (target) {
      showToast(
        target.active
          ? `Agente "${target.name}" pausado.`
          : `Agente "${target.name}" ativado.`
      );
    }
  };

  const handleDuplicateAssistant = (assistant: AIAssistant) => {
    const copy: AIAssistant = {
      ...assistant,
      id: `ast-${Date.now()}`,
      name: `${assistant.name} (Cópia)`,
      active: false,
      conversationsToday: 0,
      lastActivityAt: 'Criado agora',
    };
    updateActiveTenant((t) => upsertAssistantInTenant(t, copy, true));
    showToast(`Agente "${copy.name}" duplicado.`);
  };

  const handleQuickAction = (action: DashboardQuickAction) => {
    switch (action) {
      case 'create_agent':
        setAutoOpenAgentCreate(true);
        navigateTo('agents');
        break;
      case 'open_inbox':
        navigateTo('inbox');
        break;
      case 'add_contact':
        setAutoOpenContactCreate(true);
        navigateTo('crm');
        break;
      case 'create_flow':
        setAutoOpenFlowCreate(true);
        navigateTo('flows');
        break;
      case 'configure_whatsapp':
        navigateTo('integrations');
        break;
      case 'view_reports':
        navigateTo('analytics');
        break;
    }
  };

  const handleSaveKnowledgeDoc = (doc: KnowledgeDoc, isNew: boolean) => {
    updateActiveTenant((t) => upsertKnowledgeDocInTenant(t, doc, isNew));
    showToast(
      isNew
        ? `Documento "${doc.title}" adicionado à base de conhecimento.`
        : `Documento "${doc.title}" atualizado.`
    );
  };

  const handleDeleteKnowledgeDoc = (id: string) => {
    updateActiveTenant((t) => deleteKnowledgeDocInTenant(t, id));
    showToast('Conteúdo eliminado da base de conhecimento.');
  };

  const handleReprocessKnowledgeDoc = (id: string) => {
    updateActiveTenant((t) => ({
      ...t,
      knowledgeDocs: t.knowledgeDocs.map((d) =>
        d.id === id
          ? { ...d, status: 'indexed', updatedAt: 'Agora mesmo' }
          : d
      ),
    }));
    showToast('Documento indexado e disponível para a IA.');
  };

  const handleSaveWorkflow = (wf: Workflow, isNew: boolean) => {
    updateActiveTenant((t) => upsertWorkflowInTenant(t, wf, isNew));
    showToast(
      isNew
        ? `Automação "${wf.name}" criada.`
        : `Fluxo "${wf.name}" guardado.`
    );
  };

  const handleDeleteWorkflow = (id: string) => {
    const found = activeTenant.workflows.find((w) => w.id === id);
    updateActiveTenant((t) => deleteWorkflowInTenant(t, id));
    showToast(
      found
        ? `Automação "${found.name}" eliminada.`
        : 'Automação eliminada.'
    );
  };

  const handleToggleWorkflow = (id: string) => {
    const found = activeTenant.workflows.find((w) => w.id === id);
    updateActiveTenant((t) => toggleWorkflowInTenant(t, id));
    if (found) {
      showToast(
        found.active
          ? `Automação "${found.name}" pausada.`
          : `Automação "${found.name}" ativada.`
      );
    }
  };

  const handleRunTestWorkflow = (wf: Workflow) => {
    updateActiveTenant((t) => recordWorkflowTestRunInTenant(t, wf));
    showToast(`Execução simulada de "${wf.name}" concluída com sucesso.`);
  };

  const handleAddContact = (contact: Contact) => {
    updateActiveTenant((t) => addContactInTenant(t, contact));
    showToast(`Contacto "${contact.name}" adicionado ao CRM.`);
  };

  const handleDeleteContact = (contactId: string) => {
    const found = activeTenant.contacts.find((c) => c.id === contactId);
    updateActiveTenant((t) => deleteContactInTenant(t, contactId));
    showToast(
      found
        ? `Contacto "${found.name}" eliminado do CRM.`
        : 'Contacto eliminado do CRM.'
    );
  };

  const handleUpdateContactStage = (contactId: string, stage: CRMStage) => {
    updateActiveTenant((t) => updateContactStageInTenant(t, contactId, stage));
    showToast('Etapa comercial atualizada.');
  };

  const handleAddContactNote = (contactId: string, content: string) => {
    updateActiveTenant((t) => addContactNoteInTenant(t, contactId, content));
    showToast('Nota interna registada.');
  };

  const handleOpenWhatsAppChatFromCRM = (contactId: string) => {
    const foundConv = activeTenant.conversations.find(
      (c) => c.contactId === contactId
    );
    if (foundConv) {
      handleOpenConversation(foundConv.id);
    } else {
      navigateTo('inbox');
      showToast('A abrir Caixa de Entrada.');
    }
  };

  const handleSaveOperator = (op: Operator, isNew: boolean) => {
    updateActiveTenant((t) => upsertOperatorInTenant(t, op, isNew));
    showToast(
      isNew
        ? `Operador "${op.name}" adicionado à equipa.`
        : `Dados de "${op.name}" atualizados.`
    );
  };

  const handleDeleteOperator = (id: string) => {
    const found = activeTenant.operators.find((o) => o.id === id);
    updateActiveTenant((t) => deleteOperatorInTenant(t, id));
    showToast(
      found
        ? `Operador "${found.name}" removido da equipa.`
        : 'Operador removido da equipa.'
    );
  };

  const handleToggleOperatorOnline = (id: string) => {
    const found = activeTenant.operators.find((o) => o.id === id);
    updateActiveTenant((t) => toggleOperatorOnlineInTenant(t, id));
    if (found) {
      showToast(
        found.online
          ? `${found.name} marcado como Offline.`
          : `${found.name} marcado como Online.`
      );
    }
  };

  const handleUpdateDepartmentRouting = (
    deptId: string,
    routingMode: DepartmentConfig['routingMode']
  ) => {
    updateActiveTenant((t) =>
      updateDepartmentRoutingInTenant(t, deptId, routingMode)
    );
    showToast('Regra de distribuição do departamento atualizada.');
  };

  const handleSaveSettings = (updated: AppSettings) => {
    updateActiveTenant((t) => saveSettingsInTenant(t, updated));
    showToast('Configurações guardadas com sucesso.');
  };

  const handleMarkNotificationRead = (id: string) => {
    updateActiveTenant((t) => markNotifReadInTenant(t, id));
  };

  const handleMarkAllNotificationsRead = () => {
    updateActiveTenant((t) => markAllNotifsReadInTenant(t));
    showToast('Todas as notificações foram marcadas como lidas.');
  };

  const handleDeleteNotification = (id: string) => {
    updateActiveTenant((t) => deleteNotifInTenant(t, id));
    showToast('Notificação eliminada.');
  };

  const handleOpenNotification = (notification: NotificationItem) => {
    updateActiveTenant((t) => markNotifReadInTenant(t, notification.id));
    if (notification.conversationId) {
      setSelectedConversationId(notification.conversationId);
    }
    navigateTo(notification.targetPage);
  };

  const handleSelectSearchTarget = (target: GlobalSearchTarget) => {
    if (target.kind === 'agent') {
      setFocusedAgentId(target.itemId);
      navigateTo('agents');
    } else if (target.kind === 'contact') {
      setFocusedContactId(target.itemId);
      navigateTo('crm');
    } else if (target.kind === 'doc') {
      setFocusedDocId(target.itemId);
      navigateTo('storage');
    } else if (target.kind === 'conversation') {
      handleOpenConversation(target.itemId);
    }
  };

  if (isLoggedOut) {
    return (
      <div
        data-testid="login-screen"
        className="min-h-[100dvh] flex items-center justify-center bg-[#F4F4F2] p-4"
      >
        <div className="w-full max-w-md rounded-2xl border border-[#0B5226]/12 bg-white p-6 sm:p-8 shadow-sm text-center space-y-5">
          <div className="flex justify-center">
            <ZunoLogo darkBackground={false} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-[#0B5226]">
              Sessão terminada
            </h1>
            <p className="mt-1.5 text-sm text-[#526058]">
              Saíste da conta operacional de {activeTenant.name}. Podes voltar a entrar com um clique para continuar a gerir o atendimento.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsLoggedOut(false);
              setActivePage('overview');
              showToast(`Bem-vindo de volta, ${activeTenant.adminName}.`);
            }}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#178A3F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#137334] transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Entrar no ZUNO CHAT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex bg-[#F4F4F2] text-[#0B5226] overflow-x-hidden">
      <Sidebar
        activePage={activePage}
        onSelectPage={navigateTo}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        activeTenant={activeTenant}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          activePage={activePage}
          tenant={activeTenant}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNavigate={navigateTo}
          onSelectSearchTarget={handleSelectSearchTarget}
          onOpenPreferences={() => {
            setSettingsInitialCat('servicePreferences');
            navigateTo('settings');
          }}
          onLogout={() => setIsLoggedOut(true)}
          onOpenNotification={handleOpenNotification}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onDeleteNotification={handleDeleteNotification}
        />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 xl:p-8 max-w-[1800px] w-full mx-auto min-w-0">
          {loadError ? (
            <ErrorBanner message={loadError} onRetry={handleRetryLoad} />
          ) : (
            <AppErrorBoundary onReset={() => setActivePage('overview')}>
              {isPageLoading ? (
                <PageSkeleton />
              ) : (
                <>
                  {activePage === 'overview' && (
                    <DashboardView
                      tenant={activeTenant}
                      onNavigate={navigateTo}
                      onQuickAction={handleQuickAction}
                    />
                  )}

                  {activePage === 'agents' && (
                    <AgentsView
                      assistants={activeTenant.assistants}
                      knowledgeDocs={activeTenant.knowledgeDocs}
                      conversations={activeTenant.conversations}
                      workflows={activeTenant.workflows}
                      autoOpenCreate={autoOpenAgentCreate}
                      onClearAutoOpen={() => setAutoOpenAgentCreate(false)}
                      focusedAgentId={focusedAgentId}
                      onClearFocusedAgent={() => setFocusedAgentId(null)}
                      onSaveAssistant={handleSaveAssistant}
                      onDeleteAssistant={handleDeleteAssistant}
                      onToggleAssistant={handleToggleAssistant}
                      onDuplicateAssistant={handleDuplicateAssistant}
                      onOpenConversation={handleOpenConversation}
                      onToggleWorkflow={handleToggleWorkflow}
                      onRunTestWorkflow={handleRunTestWorkflow}
                      onOpenFlows={() => navigateTo('flows')}
                    />
                  )}

                  {activePage === 'inbox' && (
                    <InboxView
                      conversations={activeTenant.conversations}
                      selectedConversationId={selectedConversationId}
                      onSelectConversation={(id) => {
                        setSelectedConversationId(id);
                        updateActiveTenant((t) =>
                          markConversationReadInTenant(t, id)
                        );
                      }}
                      assistants={activeTenant.assistants}
                      operators={activeTenant.operators}
                      contacts={activeTenant.contacts}
                      onSendMessage={handleSendMessage}
                      onTransferToOperator={handleTransferToOperator}
                      onReturnToAI={handleReturnToAI}
                      onResolveConversation={handleResolveConversation}
                      onOpenIntegrations={() => navigateTo('integrations')}
                    />
                  )}

                  {activePage === 'crm' && (
                    <CRMView
                      contacts={activeTenant.contacts}
                      operators={activeTenant.operators}
                      autoOpenCreate={autoOpenContactCreate}
                      onClearAutoOpen={() => setAutoOpenContactCreate(false)}
                      focusedContactId={focusedContactId}
                      onClearFocusedContact={() => setFocusedContactId(null)}
                      onAddContact={handleAddContact}
                      onDeleteContact={handleDeleteContact}
                      onUpdateContactStage={handleUpdateContactStage}
                      onAddContactNote={handleAddContactNote}
                      onOpenWhatsAppChat={handleOpenWhatsAppChatFromCRM}
                    />
                  )}

                  {activePage === 'flows' && (
                    <AutomationsView
                      workflows={activeTenant.workflows}
                      logs={activeTenant.workflowLogs}
                      autoOpenCreate={autoOpenFlowCreate}
                      onClearAutoOpen={() => setAutoOpenFlowCreate(false)}
                      onSaveWorkflow={handleSaveWorkflow}
                      onDeleteWorkflow={handleDeleteWorkflow}
                      onToggleWorkflow={handleToggleWorkflow}
                      onRunTestWorkflow={handleRunTestWorkflow}
                      onNotify={showToast}
                    />
                  )}

                  {activePage === 'storage' && (
                    <KnowledgeBaseView
                      docs={activeTenant.knowledgeDocs}
                      assistants={activeTenant.assistants}
                      focusedDocId={focusedDocId}
                      onClearFocusedDoc={() => setFocusedDocId(null)}
                      onSaveDoc={handleSaveKnowledgeDoc}
                      onDeleteDoc={handleDeleteKnowledgeDoc}
                      onReprocessDoc={handleReprocessKnowledgeDoc}
                    />
                  )}

                  {activePage === 'integrations' && (
                    <IntegrationsView
                      session={activeTenant.whatsapp}
                      companyName={activeTenant.name}
                      onUpdateSession={handleUpdateWhatsApp}
                      onNotify={showToast}
                    />
                  )}

                  {activePage === 'analytics' && (
                    <AnalyticsView
                      assistants={activeTenant.assistants}
                      conversations={activeTenant.conversations}
                      contacts={activeTenant.contacts}
                      operators={activeTenant.operators}
                      departments={activeTenant.departments}
                      workflows={activeTenant.workflows}
                      workflowLogs={activeTenant.workflowLogs}
                      companyName={activeTenant.name}
                      onNotifyExport={(fmt) =>
                        showToast(
                          `Relatório exportado em formato ${fmt} com sucesso.`
                        )
                      }
                    />
                  )}

                  {activePage === 'settings' && (
                    <SettingsView
                      settings={activeTenant.settings}
                      departments={activeTenant.departments}
                      operators={activeTenant.operators}
                      initialCategory={settingsInitialCat}
                      onClearInitialCategory={() =>
                        setSettingsInitialCat(undefined)
                      }
                      onSaveSettings={handleSaveSettings}
                      onSaveOperator={handleSaveOperator}
                      onDeleteOperator={handleDeleteOperator}
                      onToggleOperatorOnline={handleToggleOperatorOnline}
                      onUpdateDepartmentRouting={handleUpdateDepartmentRouting}
                    />
                  )}
                </>
              )}
            </AppErrorBoundary>
          )}
        </main>
      </div>

      {/* Feedback Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          data-testid="app-toast"
          className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 left-4 sm:left-auto z-[80] flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-white shadow-xl border ${
            toast.type === 'error'
              ? 'bg-[#D63B3A] border-[#791F1F]/40'
              : 'bg-[#0B5226] border-[#178A3F]/40'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toast.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-white shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-[#E3F6EA] shrink-0" />
            )}
            <span className="truncate">{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Fechar aviso"
            className="min-h-[44px] min-w-[44px] -mr-2 inline-flex items-center justify-center rounded-lg text-white/85 hover:bg-white/15 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
