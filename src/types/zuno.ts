export type NavPage =
  | 'overview'
  | 'agents'
  | 'inbox'
  | 'crm'
  | 'flows'
  | 'storage'
  | 'integrations'
  | 'analytics'
  | 'settings';

export type ConversationStatus =
  | 'ai_active'
  | 'waiting_human'
  | 'human_active'
  | 'resolved';

export type MessageSender = 'customer' | 'ai' | 'operator' | 'system';

export interface MessageAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio';
  sizeLabel: string;
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  senderName: string;
  content: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  attachment?: MessageAttachment;
  aiMeta?: {
    assistantName: string;
    confidence: number;
    knowledgeSource?: string;
    responseTimeMs: number;
  };
}

export interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  contactAvatar?: string;
  phone: string;
  companyName: string;
  status: ConversationStatus;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  assignedAssistantId?: string;
  assignedOperatorId?: string;
  department: string;
  tags: string[];
  messages: ChatMessage[];
}

export interface AssistantCapabilities {
  contextualMemory: boolean;
  interactionHistory: boolean;
  audioRecognition: boolean;
  imageInterpretation: boolean;
  documentInterpretation: boolean;
  contextualResponses: boolean;
  conversationContinuity: boolean;
  responsePersonalization: boolean;
}

export interface AIAssistant {
  id: string;
  name: string;
  description: string;
  personality: string;
  customInstructions: string;
  objective: string;
  serviceType: 'Comercial' | 'Suporte Técnico' | 'Agendamento' | 'Financeiro' | 'Triagem Geral';
  language: 'Português (PT)' | 'Português (BR)' | 'Inglês' | 'Espanhol' | 'Multilíngue Automático';
  tone: 'Profissional' | 'Consultivo' | 'Empático' | 'Direto' | 'Formal';
  schedule: string;
  active: boolean;
  resolutionRate: number;
  avgResponseSec: number;
  conversationsToday: number;
  lastActivityAt?: string;
  linkedKnowledgeIds?: string[];
  confidenceThreshold?: number;
  handoffDepartment?: DepartmentName;
  capabilities: AssistantCapabilities;
}

export type KnowledgeCategory =
  | 'FAQ'
  | 'Produtos'
  | 'Serviços'
  | 'Políticas'
  | 'Manuais PDF'
  | 'Conteúdo Manual';

export type KnowledgeStatus = 'indexed' | 'processing' | 'error';

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: KnowledgeCategory;
  sourceType: 'PDF' | 'Texto' | 'Manual' | 'FAQ';
  content: string;
  fileSize?: string;
  chunksCount: number;
  status: KnowledgeStatus;
  updatedAt: string;
  linkedAssistants: string[];
}

export type WorkflowBlockType =
  | 'trigger'
  | 'condition'
  | 'ai'
  | 'action'
  | 'whatsapp'
  | 'crm'
  | 'wait'
  | 'branch';

export interface WorkflowNode {
  id: string;
  type: WorkflowBlockType;
  title: string;
  subtitle: string;
  configSummary: string;
  branchLabel?: string;
  params: Record<string, string>;
}

export interface WorkflowExecutionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  contactName: string;
  startedAt: string;
  durationMs: number;
  status: 'success' | 'error';
  detail: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  active: boolean;
  executionsTotal: number;
  successRate: number;
  avgDurationSec: number;
  errorsCount: number;
  lastRunAt: string;
  nodes: WorkflowNode[];
}

export type CRMStage =
  | 'new_contact'
  | 'first_contact'
  | 'interested'
  | 'negotiating'
  | 'converted'
  | 'lost';

export interface ContactNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  avatar?: string;
  tags: string[];
  origin: 'WhatsApp Direto' | 'Campanha QR' | 'Indicação' | 'Importação CRM';
  stage: CRMStage;
  responsibleOperatorId: string;
  estimatedValueEur: number;
  lastContactAt: string;
  notes: ContactNote[];
  conversationSummary: string;
}

export type DepartmentName = 'Comercial' | 'Suporte' | 'Financeiro' | 'Atendimento geral';

export interface Operator {
  id: string;
  name: string;
  email: string;
  role: 'Administrador' | 'Supervisor' | 'Operador Sénior' | 'Operador';
  department: DepartmentName;
  avatar?: string;
  online: boolean;
  activeChats: number;
  resolvedTotal: number;
  avgHandleTimeMin: number;
  permissions: string[];
}

export interface DepartmentConfig {
  id: string;
  name: DepartmentName;
  description: string;
  routingMode: 'Round-Robin' | 'Menor Carga' | 'Manual';
  slaMinutes: number;
  activeOperators: number;
}

export interface WhatsAppConnectionHistoryItem {
  id: string;
  event: string;
  detail: string;
  timestamp: string;
  type: 'connected' | 'disconnected' | 'reconnected' | 'warning';
}

export interface WhatsAppSession {
  status: 'connected' | 'disconnected' | 'pairing';
  phoneNumber: string;
  sessionName: string;
  deviceModel: string;
  apiProvider: string;
  connectedSince: string;
  webhookUrl: string;
  latencyMs: number;
  qrSeed: string;
  history: WhatsAppConnectionHistoryItem[];
}

export interface AppSettings {
  company: {
    name: string;
    nif: string;
    sector: string;
    website: string;
    supportEmail: string;
  };
  identity: {
    brandColor: 'royal-blue' | 'indigo-violet' | 'deep-navy';
    signatureName: string;
    showAssistantTag: boolean;
  };
  whatsapp: {
    autoReadReceipts: boolean;
    typingSimulation: boolean;
    mediaAutoDownload: boolean;
    reconnectAlerts: boolean;
  };
  aiGeneral: {
    confidenceThreshold: number;
    autoTransferOnLowConfidence: boolean;
    maxTurnsBeforeHumanCheck: number;
    fallbackMessage: string;
  };
  servicePreferences: {
    businessHours: string;
    outOfHoursAutoReply: boolean;
    autoCloseIdleHours: number;
    slaTargetMinutes: number;
  };
  notifications: {
    newHumanQueueAlert: boolean;
    slaBreachAlert: boolean;
    whatsappDisconnectAlert: boolean;
    dailySummaryEmail: boolean;
  };
  regional: {
    currency: 'EUR' | 'BRL' | 'USD';
    dateFormat: 'DD/MM/AAAA' | 'AAAA-MM-DD';
    phoneFormat: 'Internacional (+351 / +55)';
  };
  localization: {
    interfaceLanguage: 'Português (Portugal)' | 'Português (Brasil)';
    timezone: 'Europe/Lisbon (GMT+0)' | 'America/Sao_Paulo (GMT-3)' | 'UTC';
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  targetPage: NavPage;
  category?: 'inbox' | 'whatsapp' | 'knowledge' | 'automation' | 'crm' | 'system';
  conversationId?: string;
}

export interface WorkspaceTenant {
  id: string;
  name: string;
  sector: string;
  clusterRegion: string;
  adminName: string;
  adminRole: string;
  adminAvatar: string;
  whatsapp: WhatsAppSession;
  conversations: Conversation[];
  assistants: AIAssistant[];
  knowledgeDocs: KnowledgeDoc[];
  workflows: Workflow[];
  workflowLogs: WorkflowExecutionLog[];
  contacts: Contact[];
  operators: Operator[];
  departments: DepartmentConfig[];
  settings: AppSettings;
  notifications: NotificationItem[];
}
