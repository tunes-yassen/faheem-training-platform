'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  BookOpenCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Clock,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import type { DisputeItem, TutorApplication } from '@/lib/types';
import { cn, formatSAR } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { Badge, Modal, PageHeader } from '@/components/ui/Primitives';

export default function TutoringApprovalsPage() {
  const {
    tutorApplications,
    setTutorApplications,
    tutoringRequests,
    disputes,
    setDisputes,
    currentAdmin,
    notify,
    appendAuditLog,
  } = useAdmin();

  const [tab, setTab] = useState<'applications' | 'requests' | 'disputes'>('applications');
  const [decisionTarget, setDecisionTarget] = useState<{
    app: TutorApplication;
    action: 'APPROVED' | 'REJECTED';
  } | null>(null);
  const [decisionReason, setDecisionReason] = useState('');

  const [disputeTarget, setDisputeTarget] = useState<DisputeItem | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionTarget || !decisionReason.trim()) return;
    const { app, action } = decisionTarget;

    setTutorApplications((prev) =>
      prev.map((a) =>
        a.id === app.id
          ? {
              ...a,
              status: action,
              decisionReason: decisionReason.trim(),
              decidedBy: currentAdmin.name,
            }
          : a
      )
    );

    await apiRequest(`/tutoring/applications/${app.id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status: action, decisionReason: decisionReason.trim() }),
    });

    appendAuditLog({
      module: 'اعتماد المعلمين',
      action: action === 'APPROVED' ? 'TUTOR_APPROVED' : 'TUTOR_REJECTED',
      severity: action === 'APPROVED' ? 'INFO' : 'WARNING',
      summary: `${action === 'APPROVED' ? 'اعتماد' : 'رفض'} طلب المعلم ${app.name} — السبب: ${decisionReason.trim()}`,
      after: { applicationId: app.id, status: action, reason: decisionReason.trim() },
    });

    notify(
      action === 'APPROVED' ? `تم اعتماد المعلم ${app.name}` : `تم رفض طلب ${app.name}`,
      action === 'APPROVED' ? 'success' : 'warning'
    );
    setDecisionTarget(null);
    setDecisionReason('');
  };

  const handleResolveDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeTarget || !resolutionText.trim()) return;
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeTarget.id
          ? { ...d, status: 'RESOLVED', resolution: resolutionText.trim() }
          : d
      )
    );
    appendAuditLog({
      module: 'نزاعات الدروس',
      action: 'DISPUTE_RESOLVED',
      severity: 'WARNING',
      summary: `إغلاق النزاع ${disputeTarget.bookingRef} — القرار: ${resolutionText.trim()}`,
    });
    notify('تم توثيق قرار النزاع وإغلاقه بنجاح');
    setDisputeTarget(null);
    setResolutionText('');
  };

  const pendingCount = tutorApplications.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="دروس التقوية واعتماد المعلمين"
        subtitle="مراجعة واعتماد طلبات المعلمين الجدد (مع إلزامية توثيق سبب القرار)، متابعة طلبات الدروس عبر المسارات الثلاثة، ومعالجة النزاعات."
        badge={pendingCount > 0 ? <Badge variant="amber">{pendingCount} طلبات بانتظار القرار</Badge> : undefined}
      />

      <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-soft">
        <button
          onClick={() => setTab('applications')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
            tab === 'applications'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          <UserCheck className="h-4 w-4" /> طلبات اعتماد المعلمين ({tutorApplications.length})
        </button>
        <button
          onClick={() => setTab('requests')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
            tab === 'requests'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          <BookOpenCheck className="h-4 w-4" /> طلبات وحجوزات الدروس ({tutoringRequests.length})
        </button>
        <button
          onClick={() => setTab('disputes')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
            tab === 'disputes'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          <AlertTriangle className="h-4 w-4" /> النزاعات والشكاوى ({disputes.length})
        </button>
      </div>

      {/* Tutor Applications */}
      {tab === 'applications' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {tutorApplications.map((app) => (
            <div key={app.id} className="surface-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">{app.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500" dir="ltr">
                    {app.email} • {app.phone}
                  </p>
                </div>
                <Badge
                  variant={
                    app.status === 'APPROVED'
                      ? 'emerald'
                      : app.status === 'REJECTED'
                      ? 'rose'
                      : 'amber'
                  }
                >
                  {app.status === 'APPROVED'
                    ? 'معتمد'
                    : app.status === 'REJECTED'
                    ? 'مرفوض'
                    : 'قيد المراجعة'}
                </Badge>
              </div>

              <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3.5 text-xs">
                <p className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <GraduationCap className="h-4 w-4 text-teal-600" /> {app.qualification}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(app.subjects ?? []).map((sub) => (
                    <Badge key={sub} variant="sky">
                      {sub}
                    </Badge>
                  ))}
                  <Badge variant="slate">خبرة {app.experienceYears} سنوات</Badge>
                  <Badge variant="teal">السعر المقترح: {formatSAR(app.hourlyRateRequested)}/س</Badge>
                </div>
              </div>

              {app.decisionReason && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                  <p className="font-bold text-slate-700">
                    سبب القرار (بواسطة {app.decidedBy}):
                  </p>
                  <p className="mt-0.5 text-slate-600">{app.decisionReason}</p>
                </div>
              )}

              {app.status === 'PENDING' && (
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => {
                      setDecisionTarget({ app, action: 'APPROVED' });
                      setDecisionReason('');
                    }}
                    className="btn-primary flex-1 py-2 text-xs"
                  >
                    <CheckCircle2 className="h-4 w-4" /> اعتماد المعلم
                  </button>
                  <button
                    onClick={() => {
                      setDecisionTarget({ app, action: 'REJECTED' });
                      setDecisionReason('');
                    }}
                    className="btn-danger flex-1 py-2 text-xs"
                  >
                    <XCircle className="h-4 w-4" /> رفض الطلب
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tutoring Requests */}
      {tab === 'requests' && (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">المرجع</th>
                  <th className="px-5 py-3.5">الطالب</th>
                  <th className="px-5 py-3.5">المادة والمرحلة</th>
                  <th className="px-5 py-3.5">مسار الحجز</th>
                  <th className="px-5 py-3.5">المعلم المسند</th>
                  <th className="px-5 py-3.5">الموعد</th>
                  <th className="px-5 py-3.5">القيمة</th>
                  <th className="px-5 py-3.5">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tutoringRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-teal-700">
                      #{req.id}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{req.studentName}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {req.subject} • <span className="text-xs text-slate-400">{req.grade}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          req.path === 'OPEN_AUTO_MATCH'
                            ? 'teal'
                            : req.path === 'DIRECT'
                            ? 'sky'
                            : 'amber'
                        }
                      >
                        {req.path === 'OPEN_AUTO_MATCH'
                          ? 'مطابقة تلقائية'
                          : req.path === 'DIRECT'
                          ? 'مباشر'
                          : 'عبر المنسق'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {req.assignedTutor || <span className="text-amber-600">بانتظار الإسناد</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500" dir="ltr">
                      {req.scheduledAt}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {formatSAR(req.priceSar)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          req.status === 'MATCHED'
                            ? 'emerald'
                            : req.status === 'DISPUTED'
                            ? 'rose'
                            : 'amber'
                        }
                      >
                        {req.status === 'MATCHED'
                          ? 'تمت المطابقة'
                          : req.status === 'DISPUTED'
                          ? 'نزاع مفتوح'
                          : 'مفتوح'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Disputes */}
      {tab === 'disputes' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {disputes.map((dsp) => (
            <div key={dsp.id} className="surface-card p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-rose-600">{dsp.bookingRef}</span>
                <Badge variant={dsp.status === 'RESOLVED' ? 'emerald' : 'rose'}>
                  {dsp.status === 'RESOLVED' ? 'تم الحل' : 'قيد التحقيق'}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-bold text-slate-900">
                الطالب: {dsp.studentName} ↔ المعلم: {dsp.tutorName}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{dsp.reason}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> فُتح بتاريخ {dsp.openedAt}
                </span>
                <span className="font-bold text-slate-800">المبلغ المتنازع عليه: {formatSAR(dsp.amountSar)}</span>
              </div>
              {dsp.resolution && (
                <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                  <span className="font-bold">القرار النهائي: </span>
                  {dsp.resolution}
                </div>
              )}
              {dsp.status !== 'RESOLVED' && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => {
                      setDisputeTarget(dsp);
                      setResolutionText('');
                    }}
                    className="btn-primary w-full py-2 text-xs"
                  >
                    إصدار قرار وتسوية النزاع
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tutor Decision Modal (Enforces required decisionReason) */}
      <Modal
        open={!!decisionTarget}
        onClose={() => setDecisionTarget(null)}
        title={
          decisionTarget?.action === 'APPROVED'
            ? `اعتماد المعلم: ${decisionTarget.app.name}`
            : `رفض طلب المعلم: ${decisionTarget?.app.name}`
        }
        subtitle="النظام يُلزم بتوثيق سبب القرار في سجل التدقيق الأمني."
      >
        <form onSubmit={handleDecisionSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              سبب القرار (إلزامي) <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              placeholder={
                decisionTarget?.action === 'APPROVED'
                  ? 'مثال: تم التحقق من الشهادة الجامعية واجتياز المقابلة والحصة التجريبية...'
                  : 'مثال: عدم اكتمال الوثائق الأكاديمية المطلوبة...'
              }
              className="input-base"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDecisionTarget(null)}
              className="btn-secondary"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={decisionTarget?.action === 'APPROVED' ? 'btn-primary' : 'btn-danger'}
            >
              تأكيد القرار
            </button>
          </div>
        </form>
      </Modal>

      {/* Dispute Resolution Modal */}
      <Modal
        open={!!disputeTarget}
        onClose={() => setDisputeTarget(null)}
        title={`تسوية النزاع ${disputeTarget?.bookingRef}`}
      >
        <form onSubmit={handleResolveDispute} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">نص القرار والتسوية</label>
            <textarea
              required
              rows={3}
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="مثال: اعتماد استرداد 50% لمحفظة الطالب وتنبيه المعلم..."
              className="input-base"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDisputeTarget(null)} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              اعتماد التسوية
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
