import { INITIAL_TENANT } from './seedData';
import type { WorkspaceTenant } from '../types/zuno';

export * from './zunoMutations';

export interface ZunoRepository {
  load: () => WorkspaceTenant;
  save: (tenant: WorkspaceTenant) => void;
  reset: () => WorkspaceTenant;
}

const DEFAULT_STORAGE_KEY = 'zuno_chat_workspace_v1';

function cloneTenant(tenant: WorkspaceTenant): WorkspaceTenant {
  return JSON.parse(JSON.stringify(tenant)) as WorkspaceTenant;
}

export function createLocalZunoRepository(
  storageKey: string = DEFAULT_STORAGE_KEY
): ZunoRepository {
  return {
    load: () => {
      if (typeof window === 'undefined') {
        return cloneTenant(INITIAL_TENANT);
      }
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) {
          return cloneTenant(INITIAL_TENANT);
        }
        const parsed = JSON.parse(raw) as Partial<WorkspaceTenant>;
        if (
          !parsed ||
          !Array.isArray(parsed.assistants) ||
          !Array.isArray(parsed.conversations) ||
          !Array.isArray(parsed.contacts) ||
          !Array.isArray(parsed.workflows) ||
          !Array.isArray(parsed.knowledgeDocs) ||
          !Array.isArray(parsed.operators) ||
          !Array.isArray(parsed.notifications)
        ) {
          return cloneTenant(INITIAL_TENANT);
        }
        return {
          ...cloneTenant(INITIAL_TENANT),
          ...parsed,
        };
      } catch {
        throw new Error(
          'Não foi possível carregar os dados locais do ZUNO CHAT.'
        );
      }
    },
    save: (tenant: WorkspaceTenant) => {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(tenant));
      } catch {
        // Ignore storage quota errors cleanly in browser demo mode
      }
    },
    reset: () => {
      const fresh = cloneTenant(INITIAL_TENANT);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(fresh));
        } catch {
          // Ignore storage errors
        }
      }
      return fresh;
    },
  };
}

export const defaultZunoRepository = createLocalZunoRepository();
