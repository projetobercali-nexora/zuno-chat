import type {
  AIAssistant,
  Contact,
  Conversation,
  ConversationStatus,
  CRMStage,
  DepartmentConfig,
  KnowledgeCategory,
  KnowledgeDoc,
  NotificationItem,
  Operator,
  Workflow,
  WorkflowExecutionLog,
} from '../types/zuno';

export const CRM_STAGES: { id: CRMStage; label: string }[] = [
  { id: 'new_contact', label: 'Novo contacto' },
  { id: 'first_contact', label: 'Primeiro atendimento' },
  { id: 'interested', label: 'Interessado' },
  { id: 'negotiating', label: 'Em negociação' },
  { id: 'converted', label: 'Cliente convertido' },
  { id: 'lost', label: 'Cliente perdido' },
];

export function filterConversations(
  conversations: Conversation[],
  searchQuery: string,
  statusFilter: ConversationStatus | 'all'
): Conversation[] {
  const q = searchQuery.trim().toLowerCase();
  return conversations.filter((conv) => {
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    if (!matchesStatus) return false;
    if (!q) return true;
    return (
      conv.contactName.toLowerCase().includes(q) ||
      conv.phone.toLowerCase().includes(q) ||
      conv.companyName.toLowerCase().includes(q) ||
      conv.lastMessage.toLowerCase().includes(q) ||
      conv.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

export function filterKnowledgeDocs(
  docs: KnowledgeDoc[],
  searchQuery: string,
  categoryFilter: KnowledgeCategory | 'all'
): KnowledgeDoc[] {
  const q = searchQuery.trim().toLowerCase();
  return docs.filter((doc) => {
    const matchesCat = categoryFilter === 'all' || doc.category === categoryFilter;
    if (!matchesCat) return false;
    if (!q) return true;
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.content.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q)
    );
  });
}

export function filterContacts(
  contacts: Contact[],
  searchQuery: string,
  stageFilter: CRMStage | 'all',
  originFilter: string
): Contact[] {
  const q = searchQuery.trim().toLowerCase();
  return contacts.filter((c) => {
    if (stageFilter !== 'all' && c.stage !== stageFilter) return false;
    if (originFilter !== 'all' && c.origin !== originFilter) return false;
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

export interface PipelineMetrics {
  totalValueEur: number;
  activeDealsCount: number;
  convertedCount: number;
  conversionRatePct: number;
  stageCounts: Record<CRMStage, number>;
}

export function computePipelineMetrics(contacts: Contact[]): PipelineMetrics {
  const stageCounts: Record<CRMStage, number> = {
    new_contact: 0,
    first_contact: 0,
    interested: 0,
    negotiating: 0,
    converted: 0,
    lost: 0,
  };

  let totalValueEur = 0;
  let activeDealsCount = 0;

  for (const contact of contacts) {
    stageCounts[contact.stage] += 1;
    if (contact.stage !== 'lost') {
      totalValueEur += contact.estimatedValueEur;
    }
    if (contact.stage !== 'converted' && contact.stage !== 'lost') {
      activeDealsCount += 1;
    }
  }

  const closedTotal = stageCounts.converted + stageCounts.lost;
  const conversionRatePct =
    closedTotal > 0 ? Math.round((stageCounts.converted / closedTotal) * 100) : 0;

  return {
    totalValueEur,
    activeDealsCount,
    convertedCount: stageCounts.converted,
    conversionRatePct,
    stageCounts,
  };
}

export interface SimulatedReplyResult {
  replyText: string;
  matchedDocTitle: string | null;
  confidence: number;
  shouldTransferToHuman: boolean;
  detectedIntent: string;
}

export function simulateAssistantReply(
  userMessage: string,
  assistant: AIAssistant,
  knowledgeDocs: KnowledgeDoc[]
): SimulatedReplyResult {
  const normalized = userMessage.toLowerCase();

  if (
    normalized.includes('humano') ||
    normalized.includes('operador') ||
    normalized.includes('falar com alguém') ||
    normalized.includes('reclamação') ||
    normalized.includes('urgente')
  ) {
    return {
      replyText: `Compreendido. Vou encaminhar a sua conversa imediatamente para um especialista da equipa (${assistant.serviceType}) com todo o contexto registado.`,
      matchedDocTitle: null,
      confidence: 0.96,
      shouldTransferToHuman: true,
      detectedIntent: 'Transferência para Operador',
    };
  }

  const activeDocs = knowledgeDocs.filter((doc) => doc.status === 'indexed');
  let bestDoc: KnowledgeDoc | null = null;
  let bestScore = 0;

  const queryWords = normalized
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  for (const doc of activeDocs) {
    const haystack = `${doc.title} ${doc.category} ${doc.content}`.toLowerCase();
    let hits = 0;
    for (const word of queryWords) {
      if (haystack.includes(word)) hits += 1;
    }
    if (hits > bestScore) {
      bestScore = hits;
      bestDoc = doc;
    }
  }

  const greetingPrefix =
    assistant.tone === 'Formal'
      ? 'Com os melhores cumprimentos.'
      : assistant.tone === 'Empático'
      ? 'Com todo o gosto ajudo!'
      : 'Claro, aqui está a informação solicitada:';

  if (bestDoc && bestScore > 0) {
    const snippet = bestDoc.content.split('.').slice(0, 2).join('.').trim();
    const personalizedTail = assistant.capabilities.responsePersonalization
      ? ' Caso deseje, posso avançar com o registo no atendimento ou enviar o documento completo em PDF.'
      : '';
    return {
      replyText: `${greetingPrefix} De acordo com "${bestDoc.title}": ${snippet}.${personalizedTail}`,
      matchedDocTitle: bestDoc.title,
      confidence: Math.min(0.98, 0.78 + bestScore * 0.05),
      shouldTransferToHuman: false,
      detectedIntent: `Consulta KB (${bestDoc.category})`,
    };
  }

  return {
    replyText: `Sou o assistente ${assistant.name} (${assistant.serviceType}). ${assistant.objective}. Pode detalhar um pouco mais a sua questão sobre os nossos produtos, serviços ou suporte para que possa consultar a base de conhecimento?`,
    matchedDocTitle: null,
    confidence: 0.74,
    shouldTransferToHuman: false,
    detectedIntent: 'Esclarecimento Contextual',
  };
}

export interface WorkflowValidationResult {
  valid: boolean;
  warnings: string[];
}

export function validateWorkflow(workflow: Workflow): WorkflowValidationResult {
  const warnings: string[] = [];
  if (workflow.nodes.length === 0) {
    warnings.push('O workflow necessita de pelo menos um bloco.');
  } else if (workflow.nodes[0].type !== 'trigger') {
    warnings.push('O primeiro bloco do fluxo deve ser um Gatilho.');
  }
  const hasOutputAction = workflow.nodes.some(
    (n) =>
      n.type === 'whatsapp' ||
      n.type === 'action' ||
      n.type === 'crm' ||
      n.type === 'ai'
  );
  if (!hasOutputAction) {
    warnings.push('Adicione pelo menos uma ação de IA, WhatsApp ou CRM.');
  }
  return {
    valid: warnings.length === 0,
    warnings,
  };
}

export interface WorkflowAggregateStats {
  activeCount: number;
  totalCount: number;
  totalExecutions: number;
  totalErrors: number;
  successCount: number;
  avgSuccessRate: number;
}

export function computeWorkflowStats(
  workflows: Workflow[],
  logs: WorkflowExecutionLog[] = []
): WorkflowAggregateStats {
  const activeCount = workflows.filter((w) => w.active).length;
  const totalExecutions = workflows.reduce((s, w) => s + w.executionsTotal, 0);
  const workflowErrors = workflows.reduce((s, w) => s + w.errorsCount, 0);
  const extraLogErrors = logs.filter(
    (l) => l.status === 'error' && !workflows.some((w) => w.id === l.workflowId && w.errorsCount > 0)
  ).length;
  const totalErrors = workflowErrors + extraLogErrors;
  const successCount = Math.max(0, totalExecutions - totalErrors);

  const avgSuccessRate =
    totalExecutions > 0
      ? Number(
          (
            workflows.reduce((acc, w) => acc + w.successRate * w.executionsTotal, 0) /
            totalExecutions
          ).toFixed(1)
        )
      : workflows.length > 0
      ? Number(
          (
            workflows.reduce((acc, w) => acc + w.successRate, 0) / workflows.length
          ).toFixed(1)
        )
      : 100;

  return {
    activeCount,
    totalCount: workflows.length,
    totalExecutions,
    totalErrors,
    successCount,
    avgSuccessRate,
  };
}

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly';

export interface AnalyticsDepartmentRow {
  name: string;
  chats: number;
  resolved: number;
  sla: string;
}

export interface AnalyticsSnapshot {
  periodLabel: string;
  totalConversations: number;
  totalMessages: number;
  newClients: number;
  returningClients: number;
  resolvedConversations: number;
  pendingConversations: number;
  aiHandled: number;
  autoResolutionRate: number;
  humanTransfers: number;
  avgResponseSec: number;
  workflowExecutions: number;
  workflowSuccessCount: number;
  workflowErrorCount: number;
  series: { label: string; ai: number; human: number }[];
  deptProductivity: AnalyticsDepartmentRow[];
}

export interface AnalyticsInput {
  assistants: AIAssistant[];
  conversations: Conversation[];
  contacts: Contact[];
  operators: Operator[];
  departments: DepartmentConfig[];
  workflows: Workflow[];
  workflowLogs: WorkflowExecutionLog[];
}

export function computeAnalyticsSummary(
  period: AnalyticsPeriod,
  input: AnalyticsInput
): AnalyticsSnapshot {
  const {
    assistants,
    conversations,
    contacts,
    operators,
    departments,
    workflows,
    workflowLogs,
  } = input;

  // Exact live store counts so totals match Dashboard, Inbox, CRM & Flows
  const totalConversations = conversations.length;
  const totalMessages = conversations.reduce((sum, c) => sum + c.messages.length, 0);
  const resolvedConversations = conversations.filter(
    (c) => c.status === 'resolved'
  ).length;
  const pendingConversations = totalConversations - resolvedConversations;

  const newClients = contacts.filter(
    (c) => c.stage === 'new_contact' || c.stage === 'first_contact'
  ).length;
  const returningClients = Math.max(0, contacts.length - newClients);

  const aiHandled = conversations.filter(
    (c) =>
      c.status === 'ai_active' ||
      (c.status === 'resolved' && !c.assignedOperatorId)
  ).length;
  const humanTransfers = conversations.filter(
    (c) =>
      c.status === 'waiting_human' ||
      c.status === 'human_active' ||
      (c.status === 'resolved' && Boolean(c.assignedOperatorId))
  ).length;

  const autoResolutionRate =
    totalConversations > 0
      ? Number(((aiHandled / totalConversations) * 100).toFixed(1))
      : assistants.length > 0
      ? Number(
          (
            assistants.reduce((s, a) => s + a.resolutionRate, 0) / assistants.length
          ).toFixed(1)
        )
      : 0;

  const avgResponseSec =
    assistants.length > 0
      ? Number(
          (
            assistants.reduce((s, a) => s + a.avgResponseSec, 0) / assistants.length
          ).toFixed(1)
        )
      : 0;

  const wfStats = computeWorkflowStats(workflows, workflowLogs);

  // Build chart distribution directly from real assistant/operator totals scaled cleanly by interval
  const assistantChatTotal = assistants.reduce((s, a) => s + a.conversationsToday, 0);
  const operatorChatTotal = operators.reduce(
    (s, o) => s + o.activeChats + Math.round(o.resolvedTotal / 30),
    0
  );
  const aiSeed = Math.max(aiHandled, assistantChatTotal);
  const humanSeed = Math.max(humanTransfers, operatorChatTotal);

  const buildSeries = (labels: string[], weights: number[], periodScale: number) =>
    labels.map((label, idx) => ({
      label,
      ai: Math.round((aiSeed * weights[idx] * periodScale) / labels.length),
      human: Math.round((humanSeed * weights[idx] * periodScale) / labels.length),
    }));

  const series =
    period === 'daily'
      ? buildSeries(['09h', '11h', '13h', '15h', '17h', '19h'], [0.7, 1.1, 0.9, 1.3, 1.0, 0.6], 0.35)
      : period === 'weekly'
      ? buildSeries(
          ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
          [0.95, 1.1, 1.0, 1.25, 1.15, 0.65, 0.5],
          1
        )
      : buildSeries(['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'], [0.85, 0.95, 1.05, 1.15], 3.8);

  const deptProductivity: AnalyticsDepartmentRow[] = departments.map((dept) => {
    const deptOps = operators.filter((o) => o.department === dept.name);
    const deptConvs = conversations.filter((c) => c.department === dept.name);
    const resolvedByOps = deptOps.reduce((s, o) => s + o.resolvedTotal, 0);
    const activeByOps = deptOps.reduce((s, o) => s + o.activeChats, 0);
    const chats = deptConvs.length + activeByOps + resolvedByOps;
    const resolved =
      deptConvs.filter((c) => c.status === 'resolved').length + resolvedByOps;
    const slaPct = chats > 0 ? Math.min(99, Math.max(85, 100 - Math.round(dept.slaMinutes / 2))) : 100;
    return {
      name: dept.name,
      chats,
      resolved,
      sla: `${slaPct}%`,
    };
  });

  return {
    periodLabel:
      period === 'daily'
        ? 'Hoje'
        : period === 'weekly'
        ? 'Últimos 7 dias'
        : 'Últimos 30 dias',
    totalConversations,
    totalMessages,
    newClients,
    returningClients,
    resolvedConversations,
    pendingConversations,
    aiHandled,
    autoResolutionRate,
    humanTransfers,
    avgResponseSec,
    workflowExecutions: wfStats.totalExecutions,
    workflowSuccessCount: wfStats.successCount,
    workflowErrorCount: wfStats.totalErrors,
    series,
    deptProductivity,
  };
}

export function countUnreadNotifications(notifications: NotificationItem[]): number {
  return notifications.reduce((count, item) => (item.read ? count : count + 1), 0);
}

export function countUnreadInboxMessages(conversations: Conversation[]): number {
  return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
}

export function markNotificationAsRead(
  notifications: NotificationItem[],
  id: string
): NotificationItem[] {
  return notifications.map((item) =>
    item.id === id ? { ...item, read: true } : item
  );
}

export function markAllNotificationsAsRead(
  notifications: NotificationItem[]
): NotificationItem[] {
  return notifications.map((item) => (item.read ? item : { ...item, read: true }));
}

export function deleteNotificationById(
  notifications: NotificationItem[],
  id: string
): NotificationItem[] {
  return notifications.filter((item) => item.id !== id);
}

export function filterNotifications(
  notifications: NotificationItem[],
  filter: 'all' | 'unread'
): NotificationItem[] {
  if (filter === 'unread') {
    return notifications.filter((item) => !item.read);
  }
  return notifications;
}

export interface AccountOverviewMetrics {
  totalAgents: number;
  activeAgents: number;
  activeConversations: number;
  totalConversations: number;
  waitingHumanCount: number;
  totalContacts: number;
  activeWorkflows: number;
  totalWorkflows: number;
  whatsappConnected: boolean;
  unreadNotifications: number;
  unreadInboxCount: number;
}

export function computeAccountOverviewMetrics(
  assistants: AIAssistant[],
  conversations: Conversation[],
  contacts: Contact[],
  workflows: Workflow[],
  whatsappStatus: 'connected' | 'disconnected' | 'pairing',
  notifications: NotificationItem[] = []
): AccountOverviewMetrics {
  const activeAgents = assistants.filter((a) => a.active).length;
  const activeConversations = conversations.filter((c) => c.status !== 'resolved').length;
  const waitingHumanCount = conversations.filter((c) => c.status === 'waiting_human').length;
  const activeWorkflows = workflows.filter((w) => w.active).length;

  return {
    totalAgents: assistants.length,
    activeAgents,
    activeConversations,
    totalConversations: conversations.length,
    waitingHumanCount,
    totalContacts: contacts.length,
    activeWorkflows,
    totalWorkflows: workflows.length,
    whatsappConnected: whatsappStatus === 'connected',
    unreadNotifications: countUnreadNotifications(notifications),
    unreadInboxCount: countUnreadInboxMessages(conversations),
  };
}
