'use client';

import React from 'react';
import { Building2, Users, Mail, Phone, CheckCircle2, Send } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import type { CorporateRequest } from '@/lib/types';
import { formatSAR } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { Badge, PageHeader } from '@/components/ui/Primitives';

const STATUS_META: Record<
  CorporateRequest['status'],
  { label: string; variant: 'sky' | 'amber' | 'indigo' | 'emerald' | 'rose' }
> = {
  NEW: { label: 'طلب جديد', variant: 'sky' },
  QUOTING: { label: 'قيد التسعير', variant: 'amber' },
  PROPOSAL_SENT: { label: 'تم إرسال العرض', variant: 'indigo' },
  APPROVED: { label: 'معتمد للتنفيذ', variant: 'emerald' },
  REJECTED: { label: 'مرفوض', variant: 'rose' },
};

export default function CorporateB2BPage() {
  const { corporateRequests, setCorporateRequests, notify, appendAuditLog } = useAdmin();

  const updateStatus = async (req: CorporateRequest, status: CorporateRequest['status']) => {
    setCorporateRequests((prev) => prev.map((c) => (c.id === req.id ? { ...c, status } : c)));
    await apiRequest(`/lms/corporate-quotes/${req.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    appendAuditLog({
      module: 'تدريب الشركات B2B',
      action: `CORP_${status}`,
      severity: 'INFO',
      summary: `تحديث حالة طلب ${req.companyName} إلى ${STATUS_META[status].label}`,
    });
    notify(`تم تحديث حالة طلب ${req.companyName} إلى "${STATUS_META[status].label}"`);
  };

  const totalPipeline = corporateRequests.reduce((acc, r) => acc + r.estimatedBudgetSar, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="تدريب الشركات والجهات (Corporate B2B)"
        subtitle="إدارة طلبات عروض الأسعار للقطاعين الحكومي والخاص، تخصيص المقاعد، ومتابعة خط المبيعات التدريبية."
        badge={
          <Badge variant="teal">
            قيمة الطلبات الحالية: {formatSAR(totalPipeline)}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {corporateRequests.map((req) => {
          const meta = STATUS_META[req.status];
          return (
            <div key={req.id} className="surface-card flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-bold text-slate-900">
                        {req.companyName}
                      </h3>
                      <p className="text-xs text-slate-500">{req.contactName}</p>
                    </div>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-800">{req.programTopic}</p>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                  <div>
                    <span className="text-slate-500">عدد المقاعد</span>
                    <p className="mt-0.5 flex items-center gap-1 font-bold text-slate-900">
                      <Users className="h-3.5 w-3.5 text-sky-600" /> {req.seatsCount} متدرب
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">الميزانية التقديرية</span>
                    <p className="mt-0.5 font-extrabold text-teal-700">
                      {formatSAR(req.estimatedBudgetSar)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-500" dir="ltr">
                  <p className="flex items-center justify-end gap-1.5">
                    <span>{req.contactEmail}</span>
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                  </p>
                  <p className="flex items-center justify-end gap-1.5">
                    <span>{req.contactPhone}</span>
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {req.status === 'NEW' && (
                  <button
                    onClick={() => updateStatus(req, 'PROPOSAL_SENT')}
                    className="btn-primary flex-1 py-2 text-xs"
                  >
                    <Send className="h-3.5 w-3.5" /> إرسال العرض الفني والمالي
                  </button>
                )}
                {req.status === 'PROPOSAL_SENT' && (
                  <button
                    onClick={() => updateStatus(req, 'APPROVED')}
                    className="btn-primary flex-1 py-2 text-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> اعتماد التعاقد
                  </button>
                )}
                {req.status === 'APPROVED' && (
                  <span className="w-full rounded-xl bg-emerald-50 py-2 text-center text-xs font-bold text-emerald-700">
                    تم اعتماد العقد وفتح دفعة التدريب
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
