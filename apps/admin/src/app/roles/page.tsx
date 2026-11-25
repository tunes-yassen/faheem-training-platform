'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Plus,
  Save,
  Lock,
  Users,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { RBAC_MODULES } from '@/lib/demo-data';
import type { PermissionAction, RoleDefinition } from '@/lib/types';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { Badge, Modal, PageHeader } from '@/components/ui/Primitives';

const ACTIONS: { key: PermissionAction; label: string }[] = [
  { key: 'view', label: 'عرض' },
  { key: 'create', label: 'إنشاء' },
  { key: 'edit', label: 'تعديل' },
  { key: 'delete', label: 'حذف' },
  { key: 'approve', label: 'اعتماد' },
];

function computeSecurityLevel(role: RoleDefinition): {
  label: string;
  score: number;
  variant: 'emerald' | 'sky' | 'amber' | 'rose';
} {
  let score = 0;
  for (const mod of RBAC_MODULES) {
    const perms = role.permissions[mod.key] || [];
    if (mod.sensitive) {
      if (perms.includes('delete') || perms.includes('approve')) score += 25;
      else if (perms.includes('edit') || perms.includes('create')) score += 15;
      else if (perms.includes('view')) score += 5;
    } else {
      score += perms.length * 2;
    }
  }
  const normalized = Math.min(100, score);
  if (normalized >= 75) return { label: 'حرج (صلاحيات عليا)', score: normalized, variant: 'rose' };
  if (normalized >= 45) return { label: 'مرتفع (حساس)', score: normalized, variant: 'amber' };
  if (normalized >= 20) return { label: 'متوسط', score: normalized, variant: 'sky' };
  return { label: 'منخفض (محدود)', score: normalized, variant: 'emerald' };
}

export default function RbacMatrixPage() {
  const { roles, setRoles, notify, appendAuditLog } = useAdmin();
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || '');
  const [isNewRoleOpen, setIsNewRoleOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ name: '', code: '', description: '' });

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];
  const security = computeSecurityLevel(selectedRole);

  const togglePermission = (moduleKey: string, action: PermissionAction) => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== selectedRole.id) return role;
        const current = role.permissions[moduleKey] || [];
        const exists = current.includes(action);
        const updated = exists ? current.filter((a) => a !== action) : [...current, action];
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [moduleKey]: updated,
          },
        };
      })
    );
  };

  const toggleAllForModule = (moduleKey: string) => {
    const current = selectedRole.permissions[moduleKey] || [];
    const allSelected = current.length === ACTIONS.length;
    setRoles((prev) =>
      prev.map((role) =>
        role.id === selectedRole.id
          ? {
              ...role,
              permissions: {
                ...role.permissions,
                [moduleKey]: allSelected ? [] : ACTIONS.map((a) => a.key),
              },
            }
          : role
      )
    );
  };

  const handleSaveMatrix = async () => {
    await apiRequest(`/admin/roles/${selectedRole.id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions: selectedRole.permissions }),
    });
    appendAuditLog({
      module: 'الصلاحيات والأدوار (RBAC)',
      action: 'ROLE_PERMISSIONS_UPDATED',
      severity: 'CRITICAL',
      summary: `تحديث مصفوفة الصلاحيات للدور "${selectedRole.name}" (مستوى الحساسية: ${security.label})`,
    });
    notify(`تم حفظ صلاحيات دور "${selectedRole.name}" بنجاح`);
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleForm.name.trim()) return;
    const created: RoleDefinition = {
      id: `role-${Date.now()}`,
      name: newRoleForm.name.trim(),
      code:
        newRoleForm.code.trim().toUpperCase() ||
        `CUSTOM_${Math.floor(100 + Math.random() * 900)}`,
      description: newRoleForm.description.trim() || 'دور إداري مخصص',
      usersCount: 0,
      isSystem: false,
      permissions: { dashboard: ['view'] },
    };
    setRoles((prev) => [...prev, created]);
    setSelectedRoleId(created.id);
    setIsNewRoleOpen(false);
    setNewRoleForm({ name: '', code: '', description: '' });
    appendAuditLog({
      module: 'الصلاحيات والأدوار (RBAC)',
      action: 'ROLE_CREATED',
      severity: 'WARNING',
      summary: `إنشاء دور إداري جديد "${created.name}" (${created.code})`,
    });
    notify('تم إنشاء الدور الجديد');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="الأدوار ومصفوفة الصلاحيات (Dynamic RBAC)"
        subtitle="إنشاء وتخصيص الأدوار الإدارية والتحكم الدقيق بصلاحيات كل وحدة مع مؤشر أمني فوري لمستوى الخطورة."
        actions={
          <button onClick={() => setIsNewRoleOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> إنشاء دور جديد
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Roles List */}
        <div className="space-y-3 lg:col-span-4">
          {roles.map((role) => {
            const lvl = computeSecurityLevel(role);
            const active = role.id === selectedRole.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={cn(
                  'surface-card block w-full p-4 text-right transition-all',
                  active ? 'border-teal-500 ring-2 ring-teal-500/20' : 'hover:border-slate-300'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold text-slate-900">{role.name}</span>
                  <Badge variant={lvl.variant}>{lvl.label}</Badge>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{role.description}</p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {role.usersCount} مستخدمين
                  </span>
                  <span className="font-mono text-slate-400">{role.code}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Permissions Matrix */}
        <div className="surface-card overflow-hidden lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/70 p-5">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-600" />
                <h2 className="font-display text-base font-bold text-slate-900">
                  مصفوفة صلاحيات: {selectedRole.name}
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{selectedRole.description}</p>
            </div>

            {/* Visual Security Indicator */}
            <div className="min-w-[210px] rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">المؤشر الأمني</span>
                <Badge variant={security.variant}>{security.label}</Badge>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    security.variant === 'rose'
                      ? 'bg-rose-500'
                      : security.variant === 'amber'
                      ? 'bg-amber-500'
                      : security.variant === 'sky'
                      ? 'bg-sky-500'
                      : 'bg-emerald-500'
                  )}
                  style={{ width: `${Math.max(10, security.score)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="border-b border-slate-100 bg-white text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">الوحدة / النظام</th>
                  {ACTIONS.map((act) => (
                    <th key={act.key} className="px-3 py-3.5 text-center">
                      {act.label}
                    </th>
                  ))}
                  <th className="px-4 py-3.5 text-center">الكل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {RBAC_MODULES.map((mod) => {
                  const perms = selectedRole.permissions[mod.key] || [];
                  const allSelected = perms.length === ACTIONS.length;
                  return (
                    <tr key={mod.key} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{mod.label}</span>
                          {mod.sensitive && (
                            <span
                              title="وحدة حساسة أمنياً"
                              className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700"
                            >
                              <Lock className="h-3 w-3" /> حساس
                            </span>
                          )}
                        </div>
                      </td>
                      {ACTIONS.map((act) => {
                        const checked = perms.includes(act.key);
                        return (
                          <td key={act.key} className="px-3 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => togglePermission(mod.key, act.key)}
                              className={cn(
                                'inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-all',
                                checked
                                  ? 'border-teal-600 bg-teal-600 text-white shadow-sm'
                                  : 'border-slate-200 bg-white text-slate-300 hover:border-teal-400'
                              )}
                            >
                              {checked ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleAllForModule(mod.key)}
                          className="text-xs font-bold text-teal-600 hover:text-teal-800"
                        >
                          {allSelected ? 'إلغاء' : 'تحديد'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              أي تعديل على الصلاحيات يسري فوراً على جميع مستخدمي الدور.
            </span>
            <button onClick={handleSaveMatrix} className="btn-primary">
              <Save className="h-4 w-4" /> حفظ مصفوفة الصلاحيات
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={isNewRoleOpen}
        onClose={() => setIsNewRoleOpen(false)}
        title="إنشاء دور إداري جديد"
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">اسم الدور</label>
            <input
              required
              value={newRoleForm.name}
              onChange={(e) => setNewRoleForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="مثال: مراجع جودة الدورات"
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">الرمز البرمجي (Code)</label>
            <input
              dir="ltr"
              value={newRoleForm.code}
              onChange={(e) => setNewRoleForm((s) => ({ ...s, code: e.target.value }))}
              placeholder="QUALITY_AUDITOR"
              className="input-base font-mono text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">الوصف</label>
            <textarea
              rows={2}
              value={newRoleForm.description}
              onChange={(e) => setNewRoleForm((s) => ({ ...s, description: e.target.value }))}
              className="input-base"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsNewRoleOpen(false)} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              إنشاء الدور
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
