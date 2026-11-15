import React, { useState } from 'react';
import {
  Edit3,
  Plus,
  Shield,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react';
import type {
  DepartmentConfig,
  DepartmentName,
  Operator,
} from '../types/zuno';
import { Avatar } from './Avatar';
import { ConfirmModal } from './ConfirmModal';
import { EmptyState } from './EmptyState';

interface TeamViewProps {
  operators: Operator[];
  departments: DepartmentConfig[];
  onSaveOperator: (op: Operator, isNew: boolean) => void;
  onDeleteOperator: (id: string) => void;
  onToggleOperatorOnline: (id: string) => void;
  onUpdateDepartmentRouting: (
    deptId: string,
    routingMode: DepartmentConfig['routingMode']
  ) => void;
}

const DEPARTMENT_FILTER_OPTIONS: (DepartmentName | 'all')[] = [
  'all',
  'Comercial',
  'Suporte',
  'Financeiro',
  'Atendimento geral',
];

export const TeamView: React.FC<TeamViewProps> = ({
  operators,
  departments,
  onSaveOperator,
  onDeleteOperator,
  onToggleOperatorOnline,
  onUpdateDepartmentRouting,
}) => {
  const [deptFilter, setDeptFilter] = useState<DepartmentName | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [formOp, setFormOp] = useState<Operator | null>(null);
  const [pendingDeleteOp, setPendingDeleteOp] = useState<Operator | null>(null);

  const filteredOperators =
    deptFilter === 'all'
      ? operators
      : operators.filter((o) => o.department === deptFilter);

  const openCreateModal = () => {
    setIsNew(true);
    setFormOp({
      id: `op-${Date.now()}`,
      name: '',
      email: '',
      role: 'Operador',
      department: 'Atendimento geral',
      online: true,
      activeChats: 0,
      resolvedTotal: 0,
      avgHandleTimeMin: 5.0,
      permissions: ['Caixa de Entrada', 'CRM Contactos'],
    });
    setModalOpen(true);
  };

  const openEditModal = (op: Operator) => {
    setIsNew(false);
    setFormOp({ ...op });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOp || !formOp.name.trim() || !formOp.email.trim()) return;
    onSaveOperator(formOp, isNew);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0B5226]">
            Equipa e Departamentos
          </h2>
          <p className="mt-1 text-sm text-[#526058]">
            Gira operadores, permissões, estado de disponibilidade, distribuição de conversas e desempenho individual.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#178A3F] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#137334] transition-colors self-start sm:self-auto shrink-0"
        >
          <Plus className="h-4 w-4" />
          Criar operador
        </button>
      </div>

      {/* Departments Overview & Distribution */}
      <section aria-label="Departamentos e distribuição" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {departments.map((dept) => {
          const onlineInDept = operators.filter(
            (o) => o.department === dept.name && o.online
          ).length;
          return (
            <div
              key={dept.id}
              className="rounded-2xl border border-[#E2E7E3] bg-white p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-sm font-bold text-[#0B5226]">
                    {dept.name}
                  </h3>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[13px] font-semibold tabular-nums ${
                      onlineInDept > 0
                        ? 'bg-[#E3F6EA] text-[#0B5226]'
                        : 'bg-[#FCEBEB] text-[#791F1F]'
                    }`}
                  >
                    {onlineInDept} online
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-[#526058] leading-relaxed">
                  {dept.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2E7E3] flex items-center justify-between gap-2 text-[13px]">
                <span className="text-[#526058]">Distribuição</span>
                <select
                  value={dept.routingMode}
                  onChange={(e) =>
                    onUpdateDepartmentRouting(
                      dept.id,
                      e.target.value as DepartmentConfig['routingMode']
                    )
                  }
                  aria-label={`Modo de distribuição de ${dept.name}`}
                  className="min-h-[44px] rounded-lg border border-[#E2E7E3] bg-[#F4F4F2] px-2.5 py-1.5 text-[13px] font-semibold text-[#0B5226] focus:border-[#178A3F] focus:outline-none"
                >
                  <option value="Round-Robin">Round-Robin</option>
                  <option value="Menor Carga">Menor Carga</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>
            </div>
          );
        })}
      </section>

      {/* Operators List */}
      <div className="rounded-2xl border border-[#E2E7E3] bg-white overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#E2E7E3] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-[#178A3F]" />
            <h3 className="font-display text-base font-semibold text-[#0B5226]">
              Operadores ({filteredOperators.length})
            </h3>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DEPARTMENT_FILTER_OPTIONS.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => setDeptFilter(dept)}
                className={`min-h-[44px] rounded-lg px-3 py-2 text-[13px] font-medium transition-colors whitespace-nowrap ${
                  deptFilter === dept
                    ? 'bg-[#0B5226] text-white'
                    : 'bg-[#F4F4F2] text-[#526058] hover:bg-[#E3F6EA] hover:text-[#0B5226]'
                }`}
              >
                {dept === 'all' ? 'Todos' : dept}
              </button>
            ))}
          </div>
        </div>

        {filteredOperators.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-[13px]">
              <thead className="border-b border-[#E2E7E3] bg-[#F4F4F2] text-[#526058]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Operador</th>
                  <th className="px-4 py-3 font-semibold">Departamento & Função</th>
                  <th className="px-4 py-3 font-semibold">Permissões</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Ativas</th>
                  <th className="px-4 py-3 font-semibold text-right">Resolvidas</th>
                  <th className="px-4 py-3 font-semibold text-right">Tempo Médio</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7E3]">
                {filteredOperators.map((op) => (
                  <tr key={op.id} className="hover:bg-[#E3F6EA]/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={op.name}
                          src={op.avatar}
                          size="sm"
                          online={op.online}
                        />
                        <div>
                          <p className="font-semibold text-[#1A241E]">{op.name}</p>
                          <p className="text-[13px] text-[#526058]">{op.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[#0B5226]">{op.department}</p>
                      <p className="text-[13px] text-[#526058]">{op.role}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-[#526058]">
                        <Shield className="h-4 w-4 text-[#178A3F] shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {op.permissions.join(' · ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => onToggleOperatorOnline(op.id)}
                        className={`min-h-[44px] rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                          op.online
                            ? 'bg-[#E3F6EA] text-[#0B5226] hover:bg-[#178A3F]/20'
                            : 'bg-[#FCEBEB] text-[#791F1F] hover:bg-[#D63B3A]/20'
                        }`}
                      >
                        {op.online ? 'Online' : 'Offline'}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-[#0B5226] tabular-nums">
                      {op.activeChats}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-[#178A3F] font-semibold tabular-nums">
                      {op.resolvedTotal}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-[#526058] tabular-nums">
                      {op.avgHandleTimeMin.toFixed(1)} min
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(op)}
                          aria-label={`Editar ${op.name}`}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-[#E2E7E3] p-2 text-[#526058] hover:bg-[#E3F6EA] hover:text-[#0B5226]"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteOp(op)}
                          aria-label={`Eliminar ${op.name}`}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-[#D63B3A]/25 bg-[#FCEBEB]/70 p-2 text-[#791F1F] hover:bg-[#D63B3A] hover:text-white transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              testId="team-empty-state"
              icon={UsersRound}
              title={
                deptFilter !== 'all'
                  ? 'Nenhum operador neste departamento'
                  : 'Sem operadores registados'
              }
              description={
                deptFilter !== 'all'
                  ? `Não existem operadores atribuídos a ${deptFilter}.`
                  : 'Adiciona um operador para distribuir conversas humanas da plataforma.'
              }
              actionLabel={deptFilter !== 'all' ? 'Ver todos' : 'Criar operador'}
              onAction={
                deptFilter !== 'all' ? () => setDeptFilter('all') : openCreateModal
              }
            />
          </div>
        )}
      </div>

      {/* Create / Edit Operator Modal */}
      {modalOpen && formOp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B5226]/40 backdrop-blur-[1px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="operator-modal-title"
        >
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl border border-[#E2E7E3] bg-white p-5 sm:p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3
                id="operator-modal-title"
                className="font-display text-lg font-bold text-[#0B5226]"
              >
                {isNew ? 'Criar novo operador' : `Editar ${formOp.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar modal"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-1 text-[#526058] hover:bg-[#F4F4F2]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  value={formOp.name}
                  onChange={(e) =>
                    setFormOp({ ...formOp, name: e.target.value })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                  Email profissional
                </label>
                <input
                  type="email"
                  required
                  value={formOp.email}
                  onChange={(e) =>
                    setFormOp({ ...formOp, email: e.target.value })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-[#E2E7E3] px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                  Departamento
                </label>
                <select
                  value={formOp.department}
                  onChange={(e) =>
                    setFormOp({
                      ...formOp,
                      department: e.target.value as DepartmentName,
                    })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-[#E2E7E3] bg-white px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                >
                  <option value="Comercial">Comercial</option>
                  <option value="Suporte">Suporte</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Atendimento geral">Atendimento geral</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#1A241E] mb-1">
                  Perfil / Função
                </label>
                <select
                  value={formOp.role}
                  onChange={(e) =>
                    setFormOp({
                      ...formOp,
                      role: e.target.value as Operator['role'],
                    })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-[#E2E7E3] bg-white px-3 py-2 text-sm text-[#1A241E] focus:border-[#178A3F] focus:outline-none"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Operador Sénior">Operador Sénior</option>
                  <option value="Operador">Operador</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A241E] mb-1.5">
                Permissões atribuídas
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Caixa de Entrada',
                  'CRM Contactos',
                  'Base de Conhecimento',
                  'Assistentes IA',
                  'Automações',
                  'Analytics & Relatórios',
                ].map((perm) => {
                  const has = formOp.permissions.includes(perm);
                  return (
                    <button
                      key={perm}
                      type="button"
                      onClick={() =>
                        setFormOp({
                          ...formOp,
                          permissions: has
                            ? formOp.permissions.filter((p) => p !== perm)
                            : [...formOp.permissions, perm],
                        })
                      }
                      className={`min-h-[44px] rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${
                        has
                          ? 'border-[#178A3F] bg-[#E3F6EA] text-[#0B5226]'
                          : 'border-[#E2E7E3] bg-white text-[#526058] hover:bg-[#F4F4F2]'
                      }`}
                    >
                      {perm}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-h-[44px] rounded-xl border border-[#E2E7E3] px-4 py-2 text-[13px] font-semibold text-[#526058] hover:bg-[#F4F4F2]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[44px] rounded-xl bg-[#178A3F] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#137334]"
              >
                Guardar operador
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={pendingDeleteOp !== null}
        title="Eliminar operador"
        description={
          pendingDeleteOp
            ? `Tens a certeza que queres remover "${pendingDeleteOp.name}" da equipa?`
            : ''
        }
        confirmLabel="Eliminar"
        onCancel={() => setPendingDeleteOp(null)}
        onConfirm={() => {
          if (pendingDeleteOp) {
            onDeleteOperator(pendingDeleteOp.id);
          }
          setPendingDeleteOp(null);
        }}
      />
    </div>
  );
};
