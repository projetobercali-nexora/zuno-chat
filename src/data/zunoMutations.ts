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
} from '../types/zuno';
import {
  deleteNotificationById,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../utils/zunoLogic';

export function upsertAssistantInTenant(
  tenant: WorkspaceTenant,
  assistant: AIAssistant,
  isNew: boolean
): WorkspaceTenant {
  return {
    ...tenant,
    assistants: isNew
      ? [assistant, ...tenant.assistants]
      : tenant.assistants.map((a) => (a.id === assistant.id ? assistant : a)),
  };
}

export function toggleAssistantInTenant(
  tenant: WorkspaceTenant,
  assistantId: string
): WorkspaceTenant {
  return {
    ...tenant,
    assistants: tenant.assistants.map((a) =>
      a.id === assistantId ? { ...a, active: !a.active } : a
    ),
  };
}

export function deleteAssistantInTenant(
  tenant: WorkspaceTenant,
  assistantId: string
): WorkspaceTenant {
  return {
    ...tenant,
    assistants: tenant.assistants.filter((a) => a.id !== assistantId),
  };
}

export function upsertKnowledgeDocInTenant(
  tenant: WorkspaceTenant,
  doc: KnowledgeDoc,
  isNew: boolean
): WorkspaceTenant {
  return {
    ...tenant,
    knowledgeDocs: isNew
      ? [doc, ...tenant.knowledgeDocs]
      : tenant.knowledgeDocs.map((d) => (d.id === doc.id ? doc : d)),
  };
}

export function deleteKnowledgeDocInTenant(
  tenant: WorkspaceTenant,
  docId: string
): WorkspaceTenant {
  return {
    ...tenant,
    knowledgeDocs: tenant.knowledgeDocs.filter((d) => d.id !== docId),
    assistants: tenant.assistants.map((a) => ({
      ...a,
      linkedKnowledgeIds: a.linkedKnowledgeIds?.filter((id) => id !== docId),
    })),
  };
}

export function upsertWorkflowInTenant(
  tenant: WorkspaceTenant,
  wf: Workflow,
  isNew: boolean
): WorkspaceTenant {
  return {
    ...tenant,
    workflows: isNew
      ? [wf, ...tenant.workflows]
      : tenant.workflows.map((w) => (w.id === wf.id ? wf : w)),
  };
}

export function toggleWorkflowInTenant(
  tenant: WorkspaceTenant,
  wfId: string
): WorkspaceTenant {
  return {
    ...tenant,
    workflows: tenant.workflows.map((w) =>
      w.id === wfId ? { ...w, active: !w.active } : w
    ),
  };
}

export function deleteWorkflowInTenant(
  tenant: WorkspaceTenant,
  wfId: string
): WorkspaceTenant {
  return {
    ...tenant,
    workflows: tenant.workflows.filter((w) => w.id !== wfId),
  };
}

export function recordWorkflowTestRunInTenant(
  tenant: WorkspaceTenant,
  wf: Workflow
): WorkspaceTenant {
  return {
    ...tenant,
    workflows: tenant.workflows.map((w) =>
      w.id === wf.id
        ? {
            ...w,
            executionsTotal: w.executionsTotal + 1,
            lastRunAt: 'Agora mesmo',
          }
        : w
    ),
    workflowLogs: [
      {
        id: `log-${Date.now()}`,
        workflowId: wf.id,
        workflowName: wf.name,
        contactName: 'Teste de Simulação',
        startedAt: 'Agora mesmo',
        durationMs: 1280,
        status: 'success',
        detail: `${wf.nodes.length} blocos executados sem erros.`,
      },
      ...tenant.workflowLogs,
    ],
  };
}

export function addContactInTenant(
  tenant: WorkspaceTenant,
  contact: Contact
): WorkspaceTenant {
  return {
    ...tenant,
    contacts: [contact, ...tenant.contacts],
  };
}

export function deleteContactInTenant(
  tenant: WorkspaceTenant,
  contactId: string
): WorkspaceTenant {
  return {
    ...tenant,
    contacts: tenant.contacts.filter((c) => c.id !== contactId),
  };
}

export function updateContactStageInTenant(
  tenant: WorkspaceTenant,
  contactId: string,
  stage: CRMStage
): WorkspaceTenant {
  return {
    ...tenant,
    contacts: tenant.contacts.map((c) =>
      c.id === contactId ? { ...c, stage } : c
    ),
  };
}

export function addContactNoteInTenant(
  tenant: WorkspaceTenant,
  contactId: string,
  content: string
): WorkspaceTenant {
  return {
    ...tenant,
    contacts: tenant.contacts.map((c) =>
      c.id === contactId
        ? {
            ...c,
            notes: [
              {
                id: `note-${Date.now()}`,
                author: tenant.adminName,
                content,
                createdAt: 'Agora mesmo',
              },
              ...c.notes,
            ],
          }
        : c
    ),
  };
}

export function upsertOperatorInTenant(
  tenant: WorkspaceTenant,
  op: Operator,
  isNew: boolean
): WorkspaceTenant {
  return {
    ...tenant,
    operators: isNew
      ? [...tenant.operators, op]
      : tenant.operators.map((o) => (o.id === op.id ? op : o)),
  };
}

export function deleteOperatorInTenant(
  tenant: WorkspaceTenant,
  operatorId: string
): WorkspaceTenant {
  return {
    ...tenant,
    operators: tenant.operators.filter((o) => o.id !== operatorId),
  };
}

export function toggleOperatorOnlineInTenant(
  tenant: WorkspaceTenant,
  operatorId: string
): WorkspaceTenant {
  return {
    ...tenant,
    operators: tenant.operators.map((o) =>
      o.id === operatorId ? { ...o, online: !o.online } : o
    ),
  };
}

export function updateDepartmentRoutingInTenant(
  tenant: WorkspaceTenant,
  deptId: string,
  routingMode: DepartmentConfig['routingMode']
): WorkspaceTenant {
  return {
    ...tenant,
    departments: tenant.departments.map((d) =>
      d.id === deptId ? { ...d, routingMode } : d
    ),
  };
}

export function sendInboxMessageInTenant(
  tenant: WorkspaceTenant,
  conversationId: string,
  text: string,
  timeLabel: string,
  attachment?: MessageAttachment
): WorkspaceTenant {
  return {
    ...tenant,
    conversations: tenant.conversations.map((c) => {
      if (c.id !== conversationId) return c;
      return {
        ...c,
        lastMessage: text,
        lastTimestamp: timeLabel,
        unreadCount: 0,
        status: c.status === 'resolved' ? 'human_active' : c.status,
        messages: [
          ...c.messages,
          {
            id: `msg-${Date.now()}`,
            sender: 'operator',
            senderName: tenant.adminName,
            content: text,
            timestamp: timeLabel,
            status: 'delivered',
            attachment,
          },
        ],
      };
    }),
  };
}

export function markConversationReadInTenant(
  tenant: WorkspaceTenant,
  conversationId: string
): WorkspaceTenant {
  return {
    ...tenant,
    conversations: tenant.conversations.map((c) =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    ),
  };
}

export function resolveConversationInTenant(
  tenant: WorkspaceTenant,
  conversationId: string
): WorkspaceTenant {
  return {
    ...tenant,
    conversations: tenant.conversations.map((c) =>
      c.id === conversationId ? { ...c, status: 'resolved', unreadCount: 0 } : c
    ),
  };
}

export function updateWhatsAppSessionInTenant(
  tenant: WorkspaceTenant,
  updater: (prev: WhatsAppSession) => WhatsAppSession
): WorkspaceTenant {
  const nextSession = updater(tenant.whatsapp);
  const statusChanged = nextSession.status !== tenant.whatsapp.status;
  const newNotif: NotificationItem[] = statusChanged
    ? [
        {
          id: `notif-${Date.now()}`,
          title:
            nextSession.status === 'connected'
              ? 'WhatsApp conectado com sucesso'
              : nextSession.status === 'disconnected'
              ? 'Sessão WhatsApp desconectada'
              : 'Emparelhamento WhatsApp em curso',
          description: `Sessão ${nextSession.sessionName} (${nextSession.phoneNumber}) atualizada para ${
            nextSession.status === 'connected'
              ? 'ativa'
              : nextSession.status === 'disconnected'
              ? 'inativa'
              : 'aguardar leitura de QR Code'
          }.`,
          time: 'Agora mesmo',
          read: false,
          targetPage: 'integrations' as NavPage,
          category: 'whatsapp',
        },
      ]
    : [];

  return {
    ...tenant,
    whatsapp: nextSession,
    notifications: [...newNotif, ...tenant.notifications],
  };
}

export function saveSettingsInTenant(
  tenant: WorkspaceTenant,
  updated: AppSettings
): WorkspaceTenant {
  return {
    ...tenant,
    name: updated.company.name || tenant.name,
    sector: updated.company.sector || tenant.sector,
    settings: updated,
  };
}

export function markNotifReadInTenant(
  tenant: WorkspaceTenant,
  id: string
): WorkspaceTenant {
  return {
    ...tenant,
    notifications: markNotificationAsRead(tenant.notifications, id),
  };
}

export function markAllNotifsReadInTenant(
  tenant: WorkspaceTenant
): WorkspaceTenant {
  return {
    ...tenant,
    notifications: markAllNotificationsAsRead(tenant.notifications),
  };
}

export function deleteNotifInTenant(
  tenant: WorkspaceTenant,
  id: string
): WorkspaceTenant {
  return {
    ...tenant,
    notifications: deleteNotificationById(tenant.notifications, id),
  };
}
