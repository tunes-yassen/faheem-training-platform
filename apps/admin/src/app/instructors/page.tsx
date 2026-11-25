'use client';

import React, { useState } from 'react';
import {
  Star,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  ShieldBan,
  Save,
  BookOpen,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import type { InstructorPermissions, InstructorProfile } from '@/lib/governance-types';
import { cn, formatSAR } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { Badge, Modal, PageHeader, Switch } from '@/components/ui/Primitives';

const PERM_LABELS: { key: keyof InstructorPermissions; label: string }[] = [
  { key: 'canUploadMaterials', label: 'رفع الحقائب والملفات التعليمية' },
  { key: 'canGrade', label: 'إدخال وتعديل درجات الاختبارات' },
  { key: 'canIssueDraftCerts', label: 'ترشيح وإصدار مسودات الشهادات' },
  { key: 'canAcceptOpenRequests', label: 'استقبال وقبول طلبات التقوية المفتوحة' },
];

export default function InstructorsGovernancePage() {
  const { instructors, setInstructors, notify, appendAuditLog } = useAdmin();
  const [filterType, setFilterType] = useState<'ALL' | 'TRAINER' | 'TUTOR'>('ALL');
  const [editTarget, setEditTarget] = useState<InstructorProfile | null>(null);
  const [newAssignment, setNewAssignment] = useState('');

  const filtered = instructors.filter((i) => filterType === 'ALL' || i.type === filterType);

  const toggleStatus = async (ins: InstructorProfile) => {
    const nextStatus = ins.status === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';
    setInstructors((prev) => prev.map((i) => (i.id === ins.id ? { ...i, status: nextStatus } : i)));
    await apiRequest(`/admin/instructors/${ins.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    });
    appendAuditLog({
      module: 'إدارة المدربين والمعلمين',
      action: nextStatus === 'SUSPENDED' ? 'INSTRUCTOR_SUSPENDED' : 'INSTRUCTOR_APPROVED',
      severity: 'WARNING',
      summary: `${nextStatus === 'SUSPENDED' ? 'إيقاف' : 'اعتماد وتفعيل'} ${ins.name}`,
    });
    notify(
      nextStatus === 'SUSPENDED' ? `تم إيقاف ${ins.name}` : `تم تفعيل واعتماد ${ins.name}`,
      nextStatus === 'SUSPENDED' ? 'warning' : 'success'
    );
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setInstructors((prev) => prev.map((i) => (i.id === editTarget.id ? editTarget : i)));
    await apiRequest(`/admin/instructors/${editTarget.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        compensationModel: editTarget.compModel,
        compensationRate: editTarget.compRate,
        instructorFlags: editTarget.permissions,
      }),
    });
    appendAuditLog({
      module: 'إدارة المدربين والمعلمين',
      action: 'INSTRUCTOR_CONFIG_UPDATED',
      severity: 'CRITICAL',
      summary: `تحديث نموذج التعويض (${editTarget.compModel}: ${editTarget.compRate}) وصلاحيات ${editTarget.name}`,
      after: { permissions: editTarget.permissions, compModel: editTarget.compModel, compRate: editTarget.compRate },
    });
    notify(`تم حفظ صلاحيات وإعدادات ${editTarget.name}`);
    setEditTarget(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المدربين والمعلمين والصلاحيات"
        subtitle="تحكم مركزي في المدربين المهنيين ومعلمي التقوية: الاعتماد والإيقاف، نماذج التعويض (بالساعة / عمولة / مقطوع)، إسناد الدورات والمواد، والصلاحيات التفصيلية."
      />

      <div className="inline-flex rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-soft">
        {[
          { key: 'ALL', label: `الكل (${instructors.length})` },
          {
            key: 'TRAINER',
            label: `المدربون المهنيون (${instructors.filter((i) => i.type === 'TRAINER').length})`,
          },
          {
            key: 'TUTOR',
            label: `معلمو التقوية (${instructors.filter((i) => i.type === 'TUTOR').length})`,
          },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilterType(t.key as typeof filterType)}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all',
              filterType === t.key ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((ins) => (
          <div key={ins.id} className="surface-card flex flex-col justify-between p-5">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-slate-900">{ins.name}</h3>
                    <Badge variant={ins.type === 'TRAINER' ? 'indigo' : 'teal'}>
                      {ins.type === 'TRAINER' ? 'مدرب مهني' : 'معلم تقوية'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400" dir="ltr">
                    {ins.email} • {ins.phone}
                  </p>
                </div>
                <Badge variant={ins.status === 'APPROVED' ? 'emerald' : 'rose'}>
                  {ins.status === 'APPROVED' ? 'معتمد ونشط' : 'موقوف'}
                </Badge>
              </div>

              {/* Metrics */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center text-xs">
                <div>
                  <p className="text-slate-500">التقييم العام</p>
                  <p className="mt-0.5 flex items-center justify-center gap-1 font-extrabold text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {ins.ratingAvg}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">الالتزام بالحضور</p>
                  <p className="mt-0.5 font-extrabold text-teal-700">{ins.attendanceRate}%</p>
                </div>
                <div>
                  <p className="text-slate-500">نموذج التعويض</p>
                  <p className="mt-0.5 font-extrabold text-slate-900">
                    {ins.compModel === 'COMMISSION'
                      ? `عمولة ${ins.compRate}%`
                      : ins.compModel === 'HOURLY'
                      ? `${formatSAR(ins.compRate)}/س`
                      : `${formatSAR(ins.compRate)} مقطوع`}
                  </p>
                </div>
              </div>

              {/* Assigned Courses / Subjects */}
              <div className="mt-3">
                <p className="mb-1.5 flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <BookOpen className="h-3.5 w-3.5 text-sky-600" /> الدورات / المواد المسندة:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(ins.assignedItems ?? []).map((item) => (
                    <Badge key={item} variant="sky">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Permissions Summary */}
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                {PERM_LABELS.map((p) => (
                  <span
                    key={p.key}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold',
                      ins.permissions[p.key]
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-400 line-through'
                    )}
                  >
                    <ShieldCheck className="h-3 w-3" /> {p.label.split(' ').slice(0, 2).join(' ')}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => {
                  setEditTarget({ ...ins, permissions: { ...ins.permissions }, assignedItems: [...ins.assignedItems] });
                  setNewAssignment('');
                }}
                className="btn-primary flex-1 py-2 text-xs"
              >
                <Sliders className="h-3.5 w-3.5" /> الصلاحيات والتعويض والإسناد
              </button>
              <button
                onClick={() => toggleStatus(ins)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold',
                  ins.status === 'APPROVED'
                    ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                )}
              >
                {ins.status === 'APPROVED' ? (
                  <>
                    <ShieldBan className="h-3.5 w-3.5" /> إيقاف
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> تفعيل
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Instructor Permissions & Compensation Modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`إدارة صلاحيات وتعويض: ${editTarget?.name}`}
      >
        {editTarget && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">نموذج التعويض</label>
                <select
                  value={editTarget.compModel}
                  onChange={(e) =>
                    setEditTarget({
                      ...editTarget,
                      compModel: e.target.value as InstructorProfile['compModel'],
                    })
                  }
                  className="input-base"
                >
                  <option value="COMMISSION">نسبة عمولة (%)</option>
                  <option value="HOURLY">أجر بالساعة (ر.س)</option>
                  <option value="FIXED">مبلغ مقطوع (ر.س)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  القيمة ({editTarget.compModel === 'COMMISSION' ? '%' : 'ر.س'})
                </label>
                <input
                  type="number"
                  value={editTarget.compRate}
                  onChange={(e) =>
                    setEditTarget({ ...editTarget, compRate: Number(e.target.value) })
                  }
                  className="input-base"
                />
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-bold text-slate-800">صلاحيات المدرب / المعلم التفصيلية</p>
              {PERM_LABELS.map((p) => (
                <div key={p.key} className="flex items-center justify-between py-1">
                  <span className="text-xs font-medium text-slate-700">{p.label}</span>
                  <Switch
                    checked={editTarget.permissions[p.key]}
                    onChange={(val) =>
                      setEditTarget({
                        ...editTarget,
                        permissions: { ...editTarget.permissions, [p.key]: val },
                      })
                    }
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                إسناد دورة / دفعة / مادة جديدة
              </label>
              <div className="flex gap-2">
                <input
                  value={newAssignment}
                  onChange={(e) => setNewAssignment(e.target.value)}
                  placeholder="مثال: الفيزياء — الثاني ثانوي"
                  className="input-base text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newAssignment.trim()) return;
                    setEditTarget({
                      ...editTarget,
                      assignedItems: [...editTarget.assignedItems, newAssignment.trim()],
                    });
                    setNewAssignment('');
                  }}
                  className="btn-secondary shrink-0 text-xs"
                >
                  إضافة
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {editTarget.assignedItems.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setEditTarget({
                        ...editTarget,
                        assignedItems: editTarget.assignedItems.filter((x) => x !== item),
                      })
                    }
                    className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 hover:bg-rose-50 hover:text-rose-700"
                    title="اضغط للإزالة"
                  >
                    {item} ×
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditTarget(null)} className="btn-secondary">
                إلغاء
              </button>
              <button type="submit" className="btn-primary">
                <Save className="h-4 w-4" /> حفظ التعديلات
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
