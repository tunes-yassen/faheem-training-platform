'use client';

import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Wallet,
  Lock,
  Bell,
  Video,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import type { GuardianChildLink } from '@/lib/governance-types';
import { formatSAR } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { Badge, Modal, PageHeader } from '@/components/ui/Primitives';

export default function GuardiansGovernancePage() {
  const { guardians, setGuardians, notify, appendAuditLog } = useAdmin();
  const [revokeTarget, setRevokeTarget] = useState<{
    guardianId: string;
    guardianName: string;
    child: GuardianChildLink;
  } | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const handleApproveLink = async (guardianId: string, guardianName: string, link: GuardianChildLink) => {
    setGuardians((prev) =>
      prev.map((g) =>
        g.id === guardianId
          ? {
              ...g,
              children: g.children.map((c) =>
                c.linkId === link.linkId ? { ...c, status: 'APPROVED' } : c
              ),
            }
          : g
      )
    );
    await apiRequest(`/admin/guardians/links/${link.linkId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'VERIFIED' }),
    });
    appendAuditLog({
      module: 'إدارة أولياء الأمور',
      action: 'GUARDIAN_LINK_APPROVED',
      severity: 'INFO',
      summary: `اعتماد ربط ولي الأمر ${guardianName} بالطالب ${link.studentName}`,
    });
    notify(`تم اعتماد ربط الطالب ${link.studentName}`);
  };

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeTarget || !revokeReason.trim()) return;
    setGuardians((prev) =>
      prev.map((g) =>
        g.id === revokeTarget.guardianId
          ? {
              ...g,
              children: g.children.map((c) =>
                c.linkId === revokeTarget.child.linkId
                  ? { ...c, status: 'REVOKED', revokeReason: revokeReason.trim() }
                  : c
              ),
            }
          : g
      )
    );
    await apiRequest(`/admin/guardians/links/${revokeTarget.child.linkId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'REVOKED', reason: revokeReason.trim() }),
    });
    appendAuditLog({
      module: 'إدارة أولياء الأمور',
      action: 'GUARDIAN_LINK_REVOKED',
      severity: 'CRITICAL',
      summary: `إلغاء ربط ${revokeTarget.guardianName} بالطالب ${revokeTarget.child.studentName} — السبب: ${revokeReason.trim()}`,
    });
    notify('تم إلغاء الربط الأسري وتوثيق السبب في سجل التدقيق', 'warning');
    setRevokeTarget(null);
    setRevokeReason('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة أولياء الأمور والربط الأسري"
        subtitle="مراجعة إثباتات الولاية والموافقات، اعتماد أو إلغاء ربط الأبناء، ومتابعة الميزانيات الشهرية وضوابط الحجز الأسرية."
        badge={
          <Badge variant="teal">
            <Users className="h-3.5 w-3.5" /> {guardians.length} حسابات أولياء أمور
          </Badge>
        }
      />

      <div className="space-y-5">
        {guardians.map((g) => (
          <div key={g.id} className="surface-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/70 p-5">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  {g.guardianName}
                </h2>
                <p className="text-xs text-slate-500" dir="ltr">
                  {g.email} • {g.phone}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs">
                  <span className="text-slate-500">رصيد المحفظة: </span>
                  <strong className="text-teal-700">{formatSAR(g.walletBalanceSar)}</strong>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs">
                  <span className="text-slate-500">إنفاق الشهر: </span>
                  <strong className="text-slate-900">{formatSAR(g.totalSpentMonthSar)}</strong>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
              {g.children.map((child) => (
                <div
                  key={child.linkId}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-sm font-bold text-slate-900">
                        {child.studentName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {child.grade} • صلة القرابة: {child.relationship}
                      </p>
                    </div>
                    <Badge
                      variant={
                        child.status === 'APPROVED'
                          ? 'emerald'
                          : child.status === 'PENDING'
                          ? 'amber'
                          : 'rose'
                      }
                    >
                      {child.status === 'APPROVED'
                        ? 'ربط معتمد'
                        : child.status === 'PENDING'
                        ? 'بانتظار الاعتماد'
                        : 'ملغي'}
                    </Badge>
                  </div>

                  <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                    <span>{child.consentProof}</span>
                  </p>

                  {/* Family Controls Snapshot */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 rounded-lg bg-teal-50/60 px-2.5 py-1.5 font-semibold text-teal-800">
                      <Wallet className="h-3.5 w-3.5" /> سقف شهري:{' '}
                      {formatSAR(child.monthlyBudgetLimitSar)}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700">
                      <Lock className="h-3.5 w-3.5 text-sky-600" />
                      موافقة الحجز: {child.requireBookingApproval ? 'إلزامية' : 'اختيارية'}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700">
                      <Video className="h-3.5 w-3.5 text-amber-600" />
                      تسجيل الجلسات: {child.allowSessionRecording ? 'مسموح' : 'ممنوع'}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700">
                      <Bell className="h-3.5 w-3.5 text-indigo-600" />
                      تنبيه قبل الحصة: {child.notifyBeforeSession ? 'مفعّل' : 'معطّل'}
                    </div>
                  </div>

                  {child.revokeReason && (
                    <p className="mt-2 text-xs text-rose-600">سبب الإلغاء: {child.revokeReason}</p>
                  )}

                  <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                    {child.status === 'PENDING' && (
                      <button
                        onClick={() => handleApproveLink(g.id, g.guardianName, child)}
                        className="btn-primary flex-1 py-1.5 text-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> اعتماد الربط الأسري
                      </button>
                    )}
                    {child.status !== 'REVOKED' && (
                      <button
                        onClick={() => {
                          setRevokeTarget({ guardianId: g.id, guardianName: g.guardianName, child });
                          setRevokeReason('');
                        }}
                        className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                      >
                        <XCircle className="inline h-3.5 w-3.5" /> إلغاء الربط
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title="إلغاء الربط الأسري"
        subtitle={
          revokeTarget
            ? `ولي الأمر: ${revokeTarget.guardianName} — الطالب: ${revokeTarget.child.studentName}`
            : undefined
        }
      >
        <form onSubmit={handleRevokeSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">سبب الإلغاء (إلزامي)</label>
            <textarea
              required
              rows={3}
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="مثال: بناءً على طلب ولي الأمر أو عدم مطابقة إثبات الولاية..."
              className="input-base"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRevokeTarget(null)} className="btn-secondary">
              تراجع
            </button>
            <button type="submit" className="btn-danger">
              تأكيد الإلغاء
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
