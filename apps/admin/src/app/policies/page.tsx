'use client';

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Plus,
  CheckCircle2,
  Clock,
  Percent,
  ShieldAlert,
  Save,
  Sparkles,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import type { PolicyVersion } from '@/lib/types';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { Badge, Modal, PageHeader } from '@/components/ui/Primitives';

export default function PoliciesEnginePage() {
  const { policies, setPolicies, currentAdmin, notify, appendAuditLog } = useAdmin();
  const [selectedId, setSelectedId] = useState<string>(policies[0]?.id || '');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVersion, setNewVersion] = useState('v3.4-draft');

  const selected = policies.find((p) => p.id === selectedId) || policies[0];

  const updateSelected = (patch: Partial<PolicyVersion>) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === selected.id ? { ...p, ...patch, updatedBy: currentAdmin.name } : p))
    );
  };

  const handleActivate = async (pol: PolicyVersion) => {
    setPolicies((prev) =>
      prev.map((p) => ({
        ...p,
        status: p.id === pol.id ? 'ACTIVE' : p.status === 'ACTIVE' ? 'ARCHIVED' : p.status,
      }))
    );
    await apiRequest(`/admin/policies/${pol.id}/activate`, { method: 'PATCH' });
    appendAuditLog({
      module: 'محرك السياسات',
      action: 'POLICY_ACTIVATED',
      severity: 'CRITICAL',
      summary: `تفعيل إصدار السياسة ${pol.version} (${pol.title}) كسياسة تشغيلية معتمدة`,
      after: {
        version: pol.version,
        cancellationFreeWindowHours: pol.cancellationFreeWindowHours,
        noShowPenaltyPercent: pol.noShowPenaltyPercent,
        teacherCompModel: pol.teacherCompModel,
      },
    });
    notify(`تم تفعيل السياسة ${pol.version} على مستوى المنصة`, 'success');
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiRequest('/admin/policies', {
      method: 'POST',
      body: JSON.stringify(selected),
    });
    appendAuditLog({
      module: 'محرك السياسات',
      action: 'POLICY_SAVED',
      severity: 'WARNING',
      summary: `تحديث قواعد إصدار السياسة ${selected.version}`,
      after: {
        cancellationFreeWindowHours: selected.cancellationFreeWindowHours,
        noShowPenaltyPercent: selected.noShowPenaltyPercent,
        teacherCompModel: selected.teacherCompModel,
        platformCommissionPercent: selected.platformCommissionPercent,
      },
    });
    notify('تم حفظ تعديلات السياسة بنجاح');
  };

  const handleCreateVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created: PolicyVersion = {
      ...selected,
      id: `pol-${Date.now()}`,
      version: newVersion.trim() || `v${policies.length + 1}.0`,
      title: newTitle.trim(),
      status: 'DRAFT',
      effectiveFrom: new Date().toISOString().slice(0, 10),
      updatedBy: currentAdmin.name,
    };
    setPolicies((prev) => [created, ...prev]);
    setSelectedId(created.id);
    setIsNewModalOpen(false);
    setNewTitle('');
    appendAuditLog({
      module: 'محرك السياسات',
      action: 'POLICY_DRAFT_CREATED',
      severity: 'INFO',
      summary: `إنشاء مسودة سياسة جديدة ${created.version} (${created.title})`,
    });
    notify('تم إنشاء مسودة السياسة الجديدة');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="محرك السياسات والتعويضات (Policy Engine)"
        subtitle="تحكّم بإصدارات السياسات التشغيلية: نوافذ الإلغاء المجاني، غرامات عدم الحضور، قواعد الاسترداد، ونماذج تعويض المعلمين."
        actions={
          <button onClick={() => setIsNewModalOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            <span>إصدار سياسة جديد</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Versions List */}
        <div className="space-y-3 lg:col-span-4">
          {policies.map((pol) => {
            const isSel = pol.id === selected.id;
            return (
              <button
                key={pol.id}
                onClick={() => setSelectedId(pol.id)}
                className={cn(
                  'surface-card block w-full p-4 text-right transition-all',
                  isSel ? 'border-teal-500 ring-2 ring-teal-500/20' : 'hover:border-slate-300'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-teal-700">
                    {pol.version}
                  </span>
                  <Badge
                    variant={
                      pol.status === 'ACTIVE'
                        ? 'emerald'
                        : pol.status === 'DRAFT'
                        ? 'amber'
                        : 'slate'
                    }
                  >
                    {pol.status === 'ACTIVE'
                      ? 'نشط حالياً'
                      : pol.status === 'DRAFT'
                      ? 'مسودة'
                      : 'مؤرشف'}
                  </Badge>
                </div>
                <p className="mt-2 font-display text-sm font-bold text-slate-900">{pol.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  سارية منذ {pol.effectiveFrom} • بواسطة {pol.updatedBy}
                </p>
              </button>
            );
          })}
        </div>

        {/* Policy Editor */}
        {selected && (
          <form onSubmit={handleSaveChanges} className="surface-card p-6 lg:col-span-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-teal-600" />
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    {selected.title}
                  </h2>
                  <Badge variant="teal">{selected.version}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  التعديلات تُطبق على جميع الحجوزات الجديدة فور التفعيل دون التأثير على الحجوزات السابقة.
                </p>
              </div>
              {selected.status !== 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => handleActivate(selected)}
                  className="btn-primary"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>تفعيل هذا الإصدار</span>
                </button>
              )}
            </div>

            {/* Cancellation & Refund Rules */}
            <div className="mb-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                <Clock className="h-4 w-4 text-sky-600" />
                <span>قواعد الإلغاء، عدم الحضور، والاسترداد</span>
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    نافذة الإلغاء المجاني (بالساعات قبل الجلسة)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={72}
                    value={selected.cancellationFreeWindowHours}
                    onChange={(e) =>
                      updateSelected({ cancellationFreeWindowHours: Number(e.target.value) })
                    }
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    غرامة عدم الحضور (No-Show Penalty %)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={selected.noShowPenaltyPercent}
                    onChange={(e) =>
                      updateSelected({ noShowPenaltyPercent: Number(e.target.value) })
                    }
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    الحد الأقصى لطلب الاسترداد (بالأيام)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={selected.refundMaxDays}
                    onChange={(e) => updateSelected({ refundMaxDays: Number(e.target.value) })}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    مهلة المطابقة التلقائية للطلبات المفتوحة (بالدقائق)
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={120}
                    value={selected.autoMatchTimeoutMinutes}
                    onChange={(e) =>
                      updateSelected({ autoMatchTimeoutMinutes: Number(e.target.value) })
                    }
                    className="input-base"
                  />
                </div>
              </div>
            </div>

            {/* Teacher Compensation Model */}
            <div className="mb-6 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                <Percent className="h-4 w-4 text-teal-600" />
                <span>نموذج تعويض المعلمين والمدربين</span>
              </h3>
              <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {[
                  { id: 'COMMISSION', label: 'نسبة عمولة (%)', desc: 'نسبة مئوية من قيمة الجلسة' },
                  { id: 'HOURLY', label: 'أجر بالساعة (ر.س)', desc: 'سعر ساعة ثابت للمعلم' },
                  { id: 'FIXED', label: 'مبلغ مقطوع للجلسة', desc: 'قيمة ثابتة لكل جلسة مكتملة' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      updateSelected({
                        teacherCompModel: m.id as PolicyVersion['teacherCompModel'],
                      })
                    }
                    className={cn(
                      'rounded-xl border p-3 text-right transition-all',
                      selected.teacherCompModel === m.id
                        ? 'border-teal-500 bg-teal-50/80 text-teal-900 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    )}
                  >
                    <p className="text-xs font-extrabold">{m.label}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{m.desc}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    حصة المعلم (نسبة %)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={95}
                    value={selected.teacherCommissionPercent}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      updateSelected({
                        teacherCommissionPercent: v,
                        platformCommissionPercent: Math.max(0, 100 - v),
                      });
                    }}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    أجر الساعة القياسي (ر.س)
                  </label>
                  <input
                    type="number"
                    value={selected.teacherHourlyRate}
                    onChange={(e) => updateSelected({ teacherHourlyRate: Number(e.target.value) })}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    عمولة المنصة التلقائية (%)
                  </label>
                  <input
                    type="number"
                    value={selected.platformCommissionPercent}
                    disabled
                    className="input-base bg-slate-100 font-bold text-teal-700"
                  />
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="mb-1 block text-xs font-bold text-slate-700">ملاحظات الإصدار</label>
              <textarea
                rows={2}
                value={selected.notes}
                onChange={(e) => updateSelected({ notes: e.target.value })}
                className="input-base"
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                يتم حفظ نسخة غير قابلة للتغيير عند كل تفعيل
              </span>
              <button type="submit" className="btn-primary">
                <Save className="h-4 w-4" />
                <span>حفظ تعديلات الإصدار</span>
              </button>
            </div>
          </form>
        )}
      </div>

      <Modal
        open={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="إنشاء إصدار سياسة جديد"
        subtitle="سيتم نسخ الإعدادات الحالية كمسودة جديدة قابلة للتعديل قبل التفعيل."
      >
        <form onSubmit={handleCreateVersion} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">رقم الإصدار</label>
            <input
              dir="ltr"
              required
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              className="input-base font-mono"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">عنوان السياسة</label>
            <input
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="مثال: سياسة الفصل الدراسي الثاني 2027"
              className="input-base"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsNewModalOpen(false)} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              <Sparkles className="h-4 w-4" /> إنشاء المسودة
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
