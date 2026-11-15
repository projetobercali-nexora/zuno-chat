import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeAccountOverviewMetrics,
  computeAnalyticsSummary,
  computePipelineMetrics,
  computeWorkflowStats,
  countUnreadInboxMessages,
  countUnreadNotifications,
  deleteNotificationById,
  filterContacts,
  filterConversations,
  filterKnowledgeDocs,
  filterNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  simulateAssistantReply,
  validateWorkflow,
} from './zunoLogic';
import {
  addContactInTenant,
  deleteAssistantInTenant,
  deleteContactInTenant,
  deleteKnowledgeDocInTenant,
  deleteOperatorInTenant,
  deleteWorkflowInTenant,
  markAllNotifsReadInTenant,
  recordWorkflowTestRunInTenant,
  resolveConversationInTenant,
  toggleAssistantInTenant,
  toggleWorkflowInTenant,
  upsertAssistantInTenant,
} from '../data/zunoMutations';
import type {
  AIAssistant,
  Contact,
  Conversation,
  KnowledgeDoc,
  NotificationItem,
  Workflow,
  WorkspaceTenant,
} from '../types/zuno';

const sampleConversations: Conversation[] = [
  {
    id: 'c1',
    contactId: 'ct1',
    contactName: 'Marta Ferreira',
    phone: '+351 912 345 678',
    companyName: 'Lojas Moda Viva',
    status: 'waiting_human',
    lastMessage: 'Precisamos de confirmar os prazos de entrega.',
    lastTimestamp: '12:42',
    unreadCount: 2,
    department: 'Comercial',
    tags: ['VIP', 'B2B'],
    messages: [
      {
        id: 'm1',
        sender: 'customer',
        senderName: 'Marta Ferreira',
        content: 'Precisamos de confirmar os prazos de entrega.',
        timestamp: '12:42',
      },
    ],
  },
  {
    id: 'c2',
    contactId: 'ct2',
    contactName: 'Carlos Santos',
    phone: '+351 934 210 990',
    companyName: 'Global Logistics S.A.',
    status: 'ai_active',
    lastMessage: 'Obrigado pela tabela de preços.',
    lastTimestamp: '12:38',
    unreadCount: 0,
    department: 'Suporte',
    tags: ['Logística'],
    messages: [
      {
        id: 'm2',
        sender: 'ai',
        senderName: 'Zuno IA',
        content: 'Obrigado pela tabela de preços.',
        timestamp: '12:38',
      },
    ],
  },
];

const sampleDocs: KnowledgeDoc[] = [
  {
    id: 'k1',
    title: 'Política de Devoluções e Trocas',
    category: 'Políticas',
    sourceType: 'PDF',
    content: 'O prazo de devolução para clientes empresariais é de 30 dias após a emissão da fatura.',
    chunksCount: 18,
    status: 'indexed',
    updatedAt: 'Hoje',
    linkedAssistants: ['a1'],
  },
  {
    id: 'k2',
    title: 'Catálogo Plano Empresarial',
    category: 'Produtos',
    sourceType: 'Manual',
    content: 'Inclui atendimento automático 24/7 via WhatsApp com CRM integrado.',
    chunksCount: 12,
    status: 'processing',
    updatedAt: 'Ontem',
    linkedAssistants: ['a1'],
  },
];

const sampleAssistant: AIAssistant = {
  id: 'a1',
  name: 'Zuno Vendas Pro',
  description: 'Assistente comercial',
  personality: 'Consultivo',
  customInstructions: 'Responder com clareza',
  objective: 'Qualificar clientes e esclarecer dúvidas comerciais',
  serviceType: 'Comercial',
  language: 'Português (PT)',
  tone: 'Profissional',
  schedule: '24/7',
  active: true,
  resolutionRate: 94.2,
  avgResponseSec: 2.1,
  conversationsToday: 128,
  linkedKnowledgeIds: ['k1', 'k2'],
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
};

const sampleWorkflow: Workflow = {
  id: 'w1',
  name: 'Triagem Automática',
  description: 'Encaminhamento automático',
  category: 'Atendimento',
  active: true,
  executionsTotal: 100,
  successRate: 99,
  avgDurationSec: 3,
  errorsCount: 1,
  lastRunAt: 'Agora',
  nodes: [
    { id: 'n1', type: 'trigger', title: 'Mensagem', subtitle: 'WhatsApp', configSummary: 'Qualquer', params: {} },
    { id: 'n2', type: 'ai', title: 'IA', subtitle: 'Zuno', configSummary: 'Responde', params: {} },
  ],
};

const sampleTenant: WorkspaceTenant = {
  id: 'tenant-1',
  name: 'Lusitano Tech',
  sector: 'Tecnologia',
  clusterRegion: 'Europa (Lisboa)',
  adminName: 'Rodrigo Silva',
  adminRole: 'Administrador',
  adminAvatar: '',
  whatsapp: {
    status: 'connected',
    phoneNumber: '+351 910 000 100',
    sessionName: 'Principal',
    deviceModel: 'ZUNO Cloud Gateway',
    apiProvider: 'WhatsApp Business Cloud API',
    connectedSince: 'Hoje',
    webhookUrl: 'https://api.zuno.chat/webhook/test',
    latencyMs: 38,
    qrSeed: 'zuno-qr',
    history: [],
  },
  assistants: [sampleAssistant],
  knowledgeDocs: sampleDocs,
  conversations: sampleConversations,
  contacts: [
    {
      id: 'ct1',
      name: 'Marta Ferreira',
      company: 'Lojas Moda Viva',
      phone: '+351 912 345 678',
      email: 'marta@modaviva.pt',
      tags: ['VIP'],
      origin: 'WhatsApp Direto',
      stage: 'negotiating',
      responsibleOperatorId: 'op1',
      estimatedValueEur: 4800,
      lastContactAt: 'Hoje',
      notes: [],
      conversationSummary: 'Cliente interessado.',
    },
  ],
  workflows: [sampleWorkflow],
  workflowLogs: [
    {
      id: 'log-1',
      workflowId: 'w1',
      workflowName: 'Triagem Automática',
      contactName: 'Marta Ferreira',
      startedAt: 'Hoje',
      durationMs: 900,
      status: 'error',
      detail: 'Timeout simulado.',
    },
  ],
  operators: [
    {
      id: 'op1',
      name: 'Ana Rodrigues',
      email: 'ana@lusitano.pt',
      role: 'Supervisor',
      department: 'Comercial',
      online: true,
      activeChats: 3,
      resolvedTotal: 42,
      avgHandleTimeMin: 4.5,
      permissions: ['Caixa de Entrada'],
    },
  ],
  departments: [
    {
      id: 'dept-1',
      name: 'Comercial',
      description: 'Vendas e propostas',
      routingMode: 'Round-Robin',
      slaMinutes: 10,
      activeOperators: 1,
    },
    {
      id: 'dept-2',
      name: 'Suporte',
      description: 'Apoio técnico',
      routingMode: 'Menor Carga',
      slaMinutes: 8,
      activeOperators: 0,
    },
  ],
  notifications: [
    {
      id: 'n1',
      title: 'Nova mensagem prioritária',
      description: 'Marta Ferreira aguarda resposta comercial.',
      time: 'Agora',
      read: false,
      targetPage: 'inbox',
      category: 'inbox',
    },
  ],
  settings: {
    company: {
      name: 'Lusitano Tech',
      nif: '509123456',
      sector: 'Tecnologia',
      website: 'https://lusitano.pt',
      supportEmail: 'suporte@lusitano.pt',
    },
    identity: {
      brandColor: 'royal-blue',
      showAssistantTag: true,
      signatureName: 'Equipa Lusitano',
    },
    whatsapp: {
      autoReadReceipts: true,
      typingSimulation: true,
      mediaAutoDownload: true,
      reconnectAlerts: true,
    },
    aiGeneral: {
      confidenceThreshold: 80,
      autoTransferOnLowConfidence: true,
      fallbackMessage: 'Vou transferir para um operador.',
      maxTurnsBeforeHumanCheck: 6,
    },
    servicePreferences: {
      businessHours: '09:00 - 18:00',
      outOfHoursAutoReply: true,
      autoCloseIdleHours: 24,
      slaTargetMinutes: 10,
    },
    notifications: {
      newHumanQueueAlert: true,
      slaBreachAlert: true,
      whatsappDisconnectAlert: true,
      dailySummaryEmail: false,
    },
    regional: {
      currency: 'EUR',
      dateFormat: 'DD/MM/AAAA',
      phoneFormat: 'Internacional (+351 / +55)',
    },
    localization: {
      interfaceLanguage: 'Português (Portugal)',
      timezone: 'Europe/Lisbon (GMT+0)',
    },
  },
};

test('filterConversations filters by status and search text', () => {
  assert.equal(filterConversations(sampleConversations, '', 'all').length, 2);
  assert.equal(filterConversations(sampleConversations, '', 'waiting_human').length, 1);
  assert.equal(filterConversations(sampleConversations, 'Moda Viva', 'all')[0].id, 'c1');
  assert.equal(filterConversations(sampleConversations, '934 210', 'all')[0].id, 'c2');
});

test('filterKnowledgeDocs filters by category and search term', () => {
  assert.equal(filterKnowledgeDocs(sampleDocs, '', 'Políticas').length, 1);
  assert.equal(filterKnowledgeDocs(sampleDocs, 'fatura', 'all').length, 1);
  assert.equal(filterKnowledgeDocs(sampleDocs, 'inexistente', 'all').length, 0);
});

test('simulateAssistantReply matches indexed knowledge base and handles human escalation', () => {
  const kbReply = simulateAssistantReply('Qual é o prazo de devolução?', sampleAssistant, sampleDocs);
  assert.equal(kbReply.matchedDocTitle, 'Política de Devoluções e Trocas');
  assert.equal(kbReply.shouldTransferToHuman, false);
  assert.ok(kbReply.replyText.includes('30 dias'));

  const humanReply = simulateAssistantReply('Quero falar com um operador humano', sampleAssistant, sampleDocs);
  assert.equal(humanReply.shouldTransferToHuman, true);
});

test('computePipelineMetrics aggregates values, active deals, and conversion rate', () => {
  const contacts: Contact[] = [
    {
      id: '1',
      name: 'A',
      company: 'Emp A',
      phone: '+351910000001',
      email: 'a@emp.pt',
      tags: [],
      origin: 'WhatsApp Direto',
      stage: 'converted',
      responsibleOperatorId: 'op1',
      estimatedValueEur: 5000,
      lastContactAt: 'Hoje',
      notes: [],
      conversationSummary: '',
    },
    {
      id: '2',
      name: 'B',
      company: 'Emp B',
      phone: '+351910000002',
      email: 'b@emp.pt',
      tags: [],
      origin: 'Campanha QR',
      stage: 'negotiating',
      responsibleOperatorId: 'op1',
      estimatedValueEur: 3000,
      lastContactAt: 'Hoje',
      notes: [],
      conversationSummary: '',
    },
    {
      id: '3',
      name: 'C',
      company: 'Emp C',
      phone: '+351910000003',
      email: 'c@emp.pt',
      tags: [],
      origin: 'Indicação',
      stage: 'lost',
      responsibleOperatorId: 'op1',
      estimatedValueEur: 2000,
      lastContactAt: 'Ontem',
      notes: [],
      conversationSummary: '',
    },
  ];

  const metrics = computePipelineMetrics(contacts);
  assert.equal(metrics.totalValueEur, 8000);
  assert.equal(metrics.activeDealsCount, 1);
  assert.equal(metrics.convertedCount, 1);
  assert.equal(metrics.conversionRatePct, 50);
  assert.equal(filterContacts(contacts, 'Emp B', 'all', 'all').length, 1);
});

test('validateWorkflow enforces trigger first and at least one execution block', () => {
  assert.equal(validateWorkflow(sampleWorkflow).valid, true);
  const invalidWf: Workflow = { ...sampleWorkflow, nodes: [sampleWorkflow.nodes[1]] };
  assert.equal(validateWorkflow(invalidWf).valid, false);
});

test('computeAnalyticsSummary & computeWorkflowStats compute exact consistent metrics from central store', () => {
  const daily = computeAnalyticsSummary('daily', sampleTenant);
  const monthly = computeAnalyticsSummary('monthly', sampleTenant);
  const wfStats = computeWorkflowStats(sampleTenant.workflows, sampleTenant.workflowLogs);

  assert.equal(daily.totalConversations, sampleTenant.conversations.length);
  assert.equal(daily.totalMessages, 2);
  assert.equal(daily.workflowExecutions, wfStats.totalExecutions);
  assert.equal(daily.workflowErrorCount, wfStats.totalErrors);
  assert.equal(daily.deptProductivity.length, sampleTenant.departments.length);
  assert.equal(daily.series.length, 6);
  assert.equal(monthly.series.length, 4);

  const afterSim = recordWorkflowTestRunInTenant(sampleTenant, sampleTenant.workflows[0]);
  const afterAnalytics = computeAnalyticsSummary('weekly', afterSim);
  const afterWfStats = computeWorkflowStats(afterSim.workflows, afterSim.workflowLogs);
  assert.equal(afterAnalytics.workflowExecutions, wfStats.totalExecutions + 1);
  assert.equal(afterWfStats.totalExecutions, wfStats.totalExecutions + 1);
});

test('notification helpers update read state, delete items, filter unread, and compute unread counts', () => {
  const sample: NotificationItem[] = [
    {
      id: 'n1',
      title: 'Nova mensagem prioritária',
      description: 'Marta Ferreira aguarda resposta comercial.',
      time: 'Agora',
      read: false,
      targetPage: 'inbox',
      category: 'inbox',
    },
    {
      id: 'n2',
      title: 'Documento indexado',
      description: 'Catálogo 2026 pronto para consulta da IA.',
      time: 'Há 10 min',
      read: false,
      targetPage: 'storage',
      category: 'knowledge',
    },
    {
      id: 'n3',
      title: 'WhatsApp estável',
      description: 'Ligação verificada sem falhas.',
      time: 'Há 1h',
      read: true,
      targetPage: 'integrations',
      category: 'whatsapp',
    },
  ];

  assert.equal(countUnreadNotifications(sample), 2);
  assert.equal(filterNotifications(sample, 'unread').length, 2);
  assert.equal(filterNotifications(sample, 'all').length, 3);

  const afterSingleRead = markNotificationAsRead(sample, 'n1');
  assert.equal(countUnreadNotifications(afterSingleRead), 1);
  assert.equal(afterSingleRead[0].read, true);

  const afterDelete = deleteNotificationById(afterSingleRead, 'n2');
  assert.equal(afterDelete.length, 2);
  assert.equal(countUnreadNotifications(afterDelete), 0);

  const afterAllRead = markAllNotificationsAsRead(sample);
  assert.equal(countUnreadNotifications(afterAllRead), 0);
  assert.equal(filterNotifications(afterAllRead, 'unread').length, 0);
});

test('central store CRUD mutations stay synchronized across Dashboard, Inbox, CRM, Flows, Storage & Notifications', () => {
  let tenant = upsertAssistantInTenant(sampleTenant, { ...sampleAssistant, id: 'ast-new' }, true);
  assert.equal(tenant.assistants.length, sampleTenant.assistants.length + 1);

  tenant = toggleAssistantInTenant(tenant, 'ast-new');
  assert.equal(tenant.assistants.find((a) => a.id === 'ast-new')?.active, false);

  tenant = deleteAssistantInTenant(tenant, 'ast-new');
  assert.equal(tenant.assistants.length, sampleTenant.assistants.length);

  tenant = addContactInTenant(tenant, {
    id: 'ct-new',
    name: 'Novo Cliente',
    company: 'Empresa Teste',
    phone: '+351910000999',
    email: 'teste@empresa.pt',
    tags: [],
    origin: 'WhatsApp Direto',
    stage: 'new_contact',
    responsibleOperatorId: 'op1',
    estimatedValueEur: 1200,
    lastContactAt: 'Agora',
    notes: [],
    conversationSummary: 'Resumo',
  });
  assert.equal(
    computeAccountOverviewMetrics(
      tenant.assistants,
      tenant.conversations,
      tenant.contacts,
      tenant.workflows,
      tenant.whatsapp.status,
      tenant.notifications
    ).totalContacts,
    sampleTenant.contacts.length + 1
  );

  tenant = deleteContactInTenant(tenant, 'ct-new');
  assert.equal(tenant.contacts.length, sampleTenant.contacts.length);

  const firstDocId = tenant.knowledgeDocs[0].id;
  tenant = deleteKnowledgeDocInTenant(tenant, firstDocId);
  assert.equal(tenant.knowledgeDocs.length, sampleTenant.knowledgeDocs.length - 1);
  assert.equal(
    tenant.assistants.some((a) => a.linkedKnowledgeIds?.includes(firstDocId)),
    false
  );

  tenant = toggleWorkflowInTenant(tenant, tenant.workflows[0].id);
  tenant = deleteWorkflowInTenant(tenant, tenant.workflows[0].id);
  assert.equal(tenant.workflows.length, sampleTenant.workflows.length - 1);

  tenant = deleteOperatorInTenant(tenant, tenant.operators[tenant.operators.length - 1].id);
  assert.equal(tenant.operators.length, sampleTenant.operators.length - 1);

  const unreadBefore = countUnreadInboxMessages(tenant.conversations);
  tenant = resolveConversationInTenant(tenant, 'c1');
  assert.ok(countUnreadInboxMessages(tenant.conversations) < unreadBefore);

  tenant = markAllNotifsReadInTenant(tenant);
  assert.equal(countUnreadNotifications(tenant.notifications), 0);
});
