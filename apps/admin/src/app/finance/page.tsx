'use client';

import React, { useState } from 'react';
import {
  Wallet,
  ShieldCheck,
  ShieldAlert,
  Download,
  Plus,
  CheckCircle2,
  XCircle,
  Lock,
  Banknote,
  ArrowLeftRight,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import type { RefundRequest, WalletLedgerEntry } from '@/lib/types';
import { cn, exportToCSV, formatSAR } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { Badge, Modal, PageHeader } from '@/components/ui/Primitives';

export default function FinanceControlPage() {
  const {
    currentAdmin,
    adminUsers,
    switchAdmin,
    refunds,
    setRefunds,
    ledger,
    setLedger,
    settlements,
    setSettlements,
    notify,
    appendAuditLog,
  } = useAdmin();

  const [tab, setTab] = useState<'refunds' | 'ledger' | 'settlements'>('refunds');
  const [newRefundOpen, setNewRefundOpen] = useState(false);
  const [refundForm, setRefundForm] = useState({
    orderRef: 'ORD-2026-7820',
    studentName: '',
    netCapturedSar: 420,
    requestedAmountSar: 120,
    reason: '',
  });

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundForm.studentName.trim()) return;
    if (refundForm.requestedAmountSar > refundForm.netCapturedSar) {
      notify('لا يمكن أن يتجاوز مبلغ الاسترداد صافي المبلغ المحصّل', 'error');
      return;
    }

    const created: RefundRequest = {
      id: `ref-${Date.now()}`,
      ...refundForm,
      status: 'PENDING_APPROVAL',
      createdById: currentAdmin.id,
      createdByName: currentAdmin.name,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };

    setRefunds((prev) => [created, ...prev]);
    await apiRequest('/finance/refunds', { method: 'POST', body: JSON.stringify(created) });
    appendAuditLog({
      module: 'المالية (Maker-Checker)',
      action: 'REFUND_REQUEST_CREATED',
      severity: 'WARNING',
      summary: `إنشاء طلب استرداد ${created.orderRef} بمبلغ ${created.requestedAmountSar} ر.س (Maker: ${currentAdmin.name})`,
    });
    notify('تم رفع طلب الاسترداد وبانتظار اعتماد مراجع مختلف (Checker)');
    setNewRefundOpen(false);
    setRefundForm({
      orderRef: `ORD-2026-${Math.floor(7800 + Math.random() * 199)}`,
      studentName: '',
      netCapturedSar: 420,
      requestedAmountSar: 120,
      reason: '',
    });
  };

  const handleRefundDecision = async (req: RefundRequest, decision: 'APPROVED' | 'REJECTED') => {
    // STRICT MAKER-CHECKER ENFORCEMENT: creator != approver
    if (req.createdById === currentAdmin.id) {
      notify(
        'ممنوع أمنياً (سياسة Maker-Checker)',
        'error',
        'لا يجوز لمنشئ طلب الاسترداد اعتماده أو رفضه بنفسه. يرجى التبديل إلى حساب مشرف آخر.'
      );
      return;
    }

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setRefunds((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              status: decision,
              approvedById: currentAdmin.id,
              approvedByName: currentAdmin.name,
              decidedAt: now,
              decisionNote:
                decision === 'APPROVED'
                  ? 'تمت المراجعة المالية واعتماد الترحيل للمحفظة.'
                  : 'تم الرفض لعدم استيفاء شروط السياسة.',
            }
          : r
      )
    );

    if (decision === 'APPROVED') {
      const ledgerEntry: WalletLedgerEntry = {
        id: `ldg-${Date.now()}`,
        reference: `REF-${req.orderRef}`,
        userName: req.studentName,
        userRole: 'طالب',
        type: 'REFUND',
        amountSar: req.requestedAmountSar,
        balanceAfterSar: req.requestedAmountSar,
        description: `استرداد معتمد (Maker: ${req.createdByName} / Checker: ${currentAdmin.name})`,
        createdAt: `${now}:00`,
        immutableHash: `sha256:${Math.random().toString(16).slice(2, 10)}...${Math.random()
          .toString(16)
          .slice(2, 6)}`,
      };
      setLedger((prev) => [ledgerEntry, ...prev]);
    }

    await apiRequest(`/finance/refunds/${req.id}/${decision === 'APPROVED' ? 'approve' : 'reject'}`, {
      method: 'POST',
    });

    appendAuditLog({
      module: 'المالية (Maker-Checker)',
      action: decision === 'APPROVED' ? 'REFUND_APPROVED' : 'REFUND_REJECTED',
      severity: 'CRITICAL',
      summary: `${decision === 'APPROVED' ? 'اعتماد' : 'رفض'} استرداد ${req.orderRef} (${
        req.requestedAmountSar
      } ر.س) — Maker: ${req.createdByName} | Checker: ${currentAdmin.name}`,
    });

    notify(
      decision === 'APPROVED'
        ? 'تم اعتماد الاسترداد وترحيل القيد غير القابل للتعديل في WalletLedger'
        : 'تم رفض طلب الاسترداد',
      decision === 'APPROVED' ? 'success' : 'warning'
    );
  };

  const handleSettle = async (id: string) => {
    const target = settlements.find((s) => s.id === id);
    if (!target) return;
    setSettlements((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'SETTLED' } : s)));
    await apiRequest('/finance/earnings/settle', { method: 'POST', body: JSON.stringify({ id }) });
    appendAuditLog({
      module: 'المالية والتسويات',
      action: 'TEACHER_SETTLEMENT_PAID',
      severity: 'CRITICAL',
      summary: `صرف تسوية المعلم ${target.teacherName} بمبلغ ${target.netPayoutSar} ر.س`,
    });
    notify(`تم تنفيذ التحويل البنكي للمعلم ${target.teacherName}`);
  };

  const otherAdmin = adminUsers.find((u) => u.id !== currentAdmin.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإدارة المالية والموافقة الثنائية (Maker-Checker)"
        subtitle="إدارة طلبات الاسترداد بسياسة الفصل الصارم بين المنشئ والمعتمد، استعراض سجل المحفظة غير القابل للتعديل (WalletLedger)، وتسويات المعلمين."
        badge={
          <Badge variant="emerald">
            <Lock className="h-3.5 w-3.5" /> سجل مالي غير قابل للتعديل
          </Badge>
        }
        actions={
          <>
            <button
              onClick={() =>
                exportToCSV('faheem-wallet-ledger.csv', ledger as unknown as Record<string, unknown>[], [
                  { key: 'reference', label: 'المرجع' },
                  { key: 'userName', label: 'المستخدم' },
                  { key: 'type', label: 'نوع القيد' },
                  { key: 'amountSar', label: 'المبلغ (ر.س)' },
                  { key: 'balanceAfterSar', label: 'الرصيد بعد القيد' },
                  { key: 'description', label: 'البيان' },
                  { key: 'createdAt', label: 'التاريخ' },
                ])
              }
              className="btn-secondary"
            >
              <Download className="h-4 w-4 text-teal-600" /> تصدير CSV / Excel
            </button>
            <button onClick={() => setNewRefundOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> إنشاء طلب استرداد (Maker)
            </button>
          </>
        }
      />

      {/* Maker-Checker Active Identity Helper */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50/70 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-sky-600" />
          <div className="text-xs">
            <span className="font-bold text-slate-800">
              أنت تعمل حالياً بصفتك: {currentAdmin.name} ({currentAdmin.role}).
            </span>{' '}
            <span className="text-slate-600">
              سياسة Maker-Checker تمنعك تلقائياً من اعتماد أي طلب استرداد قمت بإنشائه بنفسك.
            </span>
          </div>
        </div>
        {otherAdmin && (
          <button
            onClick={() => switchAdmin(otherAdmin.id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-white px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span>تبديل سريع إلى {otherAdmin.name}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-soft">
        <button
          onClick={() => setTab('refunds')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
            tab === 'refunds' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          <ShieldCheck className="h-4 w-4" /> طلبات الاسترداد (Maker-Checker)
        </button>
        <button
          onClick={() => setTab('ledger')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
            tab === 'ledger' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          <Wallet className="h-4 w-4" /> سجل المحفظة (WalletLedger)
        </button>
        <button
          onClick={() => setTab('settlements')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
            tab === 'settlements'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          <Banknote className="h-4 w-4" /> مستحقات وتسويات المعلمين
        </button>
      </div>

      {/* Refunds Maker-Checker Tab */}
      {tab === 'refunds' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {refunds.map((req) => {
            const isSameMaker = req.createdById === currentAdmin.id;
            return (
              <div key={req.id} className="surface-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-teal-700">{req.orderRef}</span>
                    <h3 className="mt-0.5 font-display text-base font-bold text-slate-900">
                      {req.studentName}
                    </h3>
                  </div>
                  <Badge
                    variant={
                      req.status === 'APPROVED'
                        ? 'emerald'
                        : req.status === 'REJECTED'
                        ? 'rose'
                        : 'amber'
                    }
                  >
                    {req.status === 'APPROVED'
                      ? 'معتمد ومُرحّل'
                      : req.status === 'REJECTED'
                      ? 'مرفوض'
                      : 'بانتظار مراجع آخر (Checker)'}
                  </Badge>
                </div>

                <p className="mt-2 text-xs text-slate-600">{req.reason}</p>

                <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs">
                  <div>
                    <span className="text-slate-500">المبلغ المطلوب استرداده</span>
                    <p className="mt-0.5 text-base font-extrabold text-rose-600">
                      {formatSAR(req.requestedAmountSar)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">صافي المبلغ المحصّل (الحد الأقصى)</span>
                    <p className="mt-0.5 text-base font-extrabold text-slate-800">
                      {formatSAR(req.netCapturedSar)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>
                    المنشئ (Maker): <strong className="text-slate-800">{req.createdByName}</strong>
                  </span>
                  {req.approvedByName && (
                    <span>
                      المعتمد (Checker):{' '}
                      <strong className="text-teal-700">{req.approvedByName}</strong>
                    </span>
                  )}
                </div>

                {req.status === 'PENDING_APPROVAL' && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    {isSameMaker ? (
                      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>
                          أنت منشئ هذا الطلب (Maker) — لا يمكنك اعتماده بنفسك. بدّل الحساب إلى مراجع آخر من الشريط العلوي.
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRefundDecision(req, 'APPROVED')}
                          className="btn-primary flex-1 py-2 text-xs"
                        >
                          <CheckCircle2 className="h-4 w-4" /> اعتماد الاسترداد (Checker)
                        </button>
                        <button
                          onClick={() => handleRefundDecision(req, 'REJECTED')}
                          className="btn-danger flex-1 py-2 text-xs"
                        >
                          <XCircle className="h-4 w-4" /> رفض الطلب
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Immutable Wallet Ledger Tab */}
      {tab === 'ledger' && (
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-semibold">
              <Lock className="h-3.5 w-3.5 text-teal-600" />
              سجل قيود إلحاقي فقط (Append-Only) — للقراءة والتدقيق ولا يقبل التعديل أو الحذف
            </span>
            <span>إجمالي القيود: {ledger.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="border-b border-slate-100 bg-white text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">المرجع</th>
                  <th className="px-5 py-3.5">المستخدم</th>
                  <th className="px-5 py-3.5">نوع القيد</th>
                  <th className="px-5 py-3.5">المبلغ</th>
                  <th className="px-5 py-3.5">الرصيد بعد</th>
                  <th className="px-5 py-3.5">البيان</th>
                  <th className="px-5 py-3.5">البصمة الرقمية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">
                      {row.reference}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{row.userName}</p>
                      <p className="text-[11px] text-slate-400">{row.userRole}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          row.type === 'CREDIT' || row.type === 'REFUND'
                            ? 'emerald'
                            : row.type === 'HOLD'
                            ? 'amber'
                            : row.type === 'SETTLEMENT'
                            ? 'sky'
                            : 'slate'
                        }
                      >
                        {row.type}
                      </Badge>
                    </td>
                    <td
                      className={cn(
                        'px-5 py-3.5 font-bold',
                        row.amountSar >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      )}
                    >
                      {row.amountSar >= 0 ? '+' : ''}
                      {formatSAR(row.amountSar)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {formatSAR(row.balanceAfterSar)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{row.description}</td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400" dir="ltr">
                      {row.immutableHash}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Teacher Settlements Tab */}
      {tab === 'settlements' && (
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h3 className="font-display text-sm font-bold text-slate-900">
              كشف مستحقات وتحويلات المعلمين والمدربين
            </h3>
            <button
              onClick={() =>
                exportToCSV(
                  'faheem-teacher-settlements.csv',
                  settlements as unknown as Record<string, unknown>[],
                  [
                    { key: 'teacherName', label: 'المعلم' },
                    { key: 'period', label: 'الفترة' },
                    { key: 'sessionsCount', label: 'عدد الجلسات' },
                    { key: 'grossAmountSar', label: 'الإجمالي' },
                    { key: 'commissionSar', label: 'عمولة المنصة' },
                    { key: 'netPayoutSar', label: 'صافي التحويل' },
                    { key: 'status', label: 'الحالة' },
                  ]
                )
              }
              className="btn-secondary py-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" /> تصدير كشف الرواتب CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">المعلم / المدرب</th>
                  <th className="px-5 py-3.5">الفترة</th>
                  <th className="px-5 py-3.5">الجلسات</th>
                  <th className="px-5 py-3.5">الإجمالي</th>
                  <th className="px-5 py-3.5">عمولة المنصة</th>
                  <th className="px-5 py-3.5">صافي المستحق</th>
                  <th className="px-5 py-3.5">الحالة / الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{s.teacherName}</p>
                      <p className="font-mono text-[11px] text-slate-400">IBAN •••• {s.ibanLast4}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{s.period}</td>
                    <td className="px-5 py-3.5 font-semibold">{s.sessionsCount}</td>
                    <td className="px-5 py-3.5">{formatSAR(s.grossAmountSar)}</td>
                    <td className="px-5 py-3.5 text-slate-500">{formatSAR(s.commissionSar)}</td>
                    <td className="px-5 py-3.5 font-extrabold text-teal-700">
                      {formatSAR(s.netPayoutSar)}
                    </td>
                    <td className="px-5 py-3.5">
                      {s.status === 'SETTLED' ? (
                        <Badge variant="emerald">تم التحويل</Badge>
                      ) : (
                        <button
                          onClick={() => handleSettle(s.id)}
                          className="btn-primary py-1.5 text-xs"
                        >
                          تنفيذ التحويل الآن
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Refund Request Modal (Maker) */}
      <Modal
        open={newRefundOpen}
        onClose={() => setNewRefundOpen(false)}
        title="إنشاء طلب استرداد جديد (Maker)"
        subtitle="سيُحال الطلب لمشرف مالي آخر للاعتماد وفق سياسة Maker-Checker."
      >
        <form onSubmit={handleCreateRefund} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">رقم الطلب</label>
              <input
                dir="ltr"
                required
                value={refundForm.orderRef}
                onChange={(e) => setRefundForm((s) => ({ ...s, orderRef: e.target.value }))}
                className="input-base font-mono text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">اسم الطالب</label>
              <input
                required
                value={refundForm.studentName}
                onChange={(e) => setRefundForm((s) => ({ ...s, studentName: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                صافي المبلغ المحصّل (ر.س)
              </label>
              <input
                type="number"
                value={refundForm.netCapturedSar}
                onChange={(e) =>
                  setRefundForm((s) => ({ ...s, netCapturedSar: Number(e.target.value) }))
                }
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                المبلغ المطلوب استرداده (ر.س)
              </label>
              <input
                type="number"
                max={refundForm.netCapturedSar}
                value={refundForm.requestedAmountSar}
                onChange={(e) =>
                  setRefundForm((s) => ({ ...s, requestedAmountSar: Number(e.target.value) }))
                }
                className="input-base"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">سبب الاسترداد</label>
            <textarea
              required
              rows={3}
              value={refundForm.reason}
              onChange={(e) => setRefundForm((s) => ({ ...s, reason: e.target.value }))}
              className="input-base"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setNewRefundOpen(false)} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              رفع للمراجعة (Checker)
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
