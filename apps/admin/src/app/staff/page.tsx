'use client';

import React, { useState } from 'react';
import {
  UserCog,
  ClipboardCheck,
  Plus,
  ShieldBan,
  CheckCircle2,
  Download,
  PhoneCall,
  TicketCheck,
  TrendingUp,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import type { StaffDailyReport, StaffMember } from '@/lib/governance-types';
import { cn, exportToCSV } from '@/lib/utils';
import { apiRequest } from '@/lib/api';
import { Badge, Modal, PageHeader } from '@/components/ui/Primitives';

const ROLE_OPTIONS: { code: StaffMember['roleCode']; label: string }[] = [
  { code: 'SUPER_ADMIN', label: 'المدير العام (Super Admin)' },
  { code: 'TRAINING_MANAGER', label: 'مدير التدريب والدورات' },
  { code: 'FINANCE_MAKER', label: 'أخصائي مالي (Maker)' },
  { code: 'FINANCE_CHECKER', label: 'مدير مالي (Checker)' },
  { code: 'COORDINATOR', label: 'منسق أكاديمي' },
  { code: 'CUSTOMER_SERVICE', label: 'أخصائي خدمة عملاء (CS)' },
];

export default function StaffGovernancePage() {
  const { staff, setStaff, staffReports, setStaffReports, notify, appendAuditLog } = useAdmin();
  const [tab, setTab] = useState<'directory' | 'reports'>('directory');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '+9665',
    department: 'خدمة العملاء (CS)',
    roleCode: 'CUSTOMER_SERVICE' as StaffMember['roleCode'],
    customPermissions: 'REPLY_TICKETS, LOG_CALLS',
  });

  const [reportForm, setReportForm] = useState({
    staffId: staff[0]?.id || '',
    callsHandled: 28,
    ticketsClosed: 14,
    requestsAssigned: 9,
    slaCompliancePercent: 97,
    notes: '',
  });

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.email.trim()) return;
    const roleMeta = ROLE_OPTIONS.find((r) => r.code === staffForm.roleCode) || ROLE_OPTIONS[5];
    const created: StaffMember = {
      id: `stf-${Date.now()}`,
      name: staffForm.name.trim(),
      email: staffForm.email.trim(),
      phone: staffForm.phone.trim(),
      department: staffForm.department.trim(),
      roleCode: staffForm.roleCode,
      roleLabel: roleMeta.label,
      status: 'ACTIVE',
      customPermissions: staffForm.customPermissions
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
      lastActive: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    setStaff((prev) => [created, ...prev]);
    await apiRequest('/admin/staff', { method: 'POST', body: JSON.stringify(created) });
    appendAuditLog({
      module: 'إدارة الموظفين',
      action: 'STAFF_CREATED',
      severity: 'WARNING',
      summary: `إضافة موظف جديد "${created.name}" بدور ${created.roleLabel}`,
    });
    notify(`تمت إضافة الموظف ${created.name} بنجاح`);
    setAddModalOpen(false);
    setStaffForm({
      name: '',
      email: '',
      phone: '+9665',
      department: 'خدمة العملاء (CS)',
      roleCode: 'CUSTOMER_SERVICE',
      customPermissions: 'REPLY_TICKETS, LOG_CALLS',
    });
  };

  const toggleStaffStatus = async (member: StaffMember) => {
    const nextStatus = member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setStaff((prev) => prev.map((s) => (s.id === member.id ? { ...s, status: nextStatus } : s)));
    await apiRequest(`/admin/staff/${member.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    });
    appendAuditLog({
      module: 'إدارة الموظفين',
      action: nextStatus === 'SUSPENDED' ? 'STAFF_SUSPENDED' : 'STAFF_ACTIVATED',
      severity: 'WARNING',
      summary: `${nextStatus === 'SUSPENDED' ? 'إيقاف' : 'تفعيل'} حساب الموظف ${member.name}`,
    });
    notify(
      nextStatus === 'SUSPENDED' ? `تم إيقاف ${member.name}` : `تم إعادة تفعيل ${member.name}`,
      nextStatus === 'SUSPENDED' ? 'warning' : 'success'
    );
  };

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const member = staff.find((s) => s.id === reportForm.staffId) || staff[0];
    const created: StaffDailyReport = {
      id: `rep-${Date.now()}`,
      staffId: member?.id || 'stf-1',
      staffName: member?.name || 'موظف',
      department: member?.department || 'خدمة العملاء',
      date: new Date().toISOString().slice(0, 10),
      callsHandled: reportForm.callsHandled,
      ticketsClosed: reportForm.ticketsClosed,
      requestsAssigned: reportForm.requestsAssigned,
      slaCompliancePercent: reportForm.slaCompliancePercent,
      notes: reportForm.notes.trim() || 'تم إنجاز المهام اليومية وفق الخطة.',
    };
    setStaffReports((prev) => [created, ...prev]);
    await apiRequest('/admin/staff/reports', { method: 'POST', body: JSON.stringify(created) });
    appendAuditLog({
      module: 'تقارير المهام اليومية',
      action: 'DAILY_REPORT_LOGGED',
      severity: 'INFO',
      summary: `توثيق تقرير مهام يومي للموظف ${created.staffName} (SLA: ${created.slaCompliancePercent}%)`,
    });
    notify('تم تسجيل التقرير اليومي بنجاح');
    setReportModalOpen(false);
  };

  const totalCalls = staffReports.reduce((a, r) => a + (r.callsHandled || 0), 0);
  const totalTickets = staffReports.reduce((a, r) => a + (r.ticketsClosed || 0), 0);
  const avgSla = staffReports.length
    ? Math.round(
        staffReports.reduce((a, r) => a + (r.slaCompliancePercent || 0), 0) / staffReports.length
      )
    : 98;

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة الموظفين وتقارير المهام اليومية"
        subtitle="التحكم الكامل بفريق العمل الداخلي (الإدارة العليا، التدريب، المالية Maker/Checker، المنسقين، خدمة العملاء) ومتابعة إنجاز المهام اليومية."
        actions={
          <>
            {tab === 'reports' ? (
              <>
                <button
                  onClick={() =>
                    exportToCSV(
                      'faheem-staff-daily-reports.csv',
                      staffReports as unknown as Record<string, unknown>[],
                      [
                        { key: 'date', label: 'التاريخ' },
                        { key: 'staffName', label: 'الموظف' },
                        { key: 'department', label: 'القسم' },
                        { key: 'callsHandled', label: 'المكالمات' },
                        { key: 'ticketsClosed', label: 'التذاكر المغلقة' },
                        { key: 'requestsAssigned', label: 'الطلبات المسندة' },
                        { key: 'slaCompliancePercent', label: 'نسبة SLA %' },
                        { key: 'notes', label: 'ملاحظات' },
                      ]
                    )
                  }
                  className="btn-secondary"
                >
                  <Download className="h-4 w-4 text-teal-600" /> تصدير CSV
                </button>
                <button onClick={() => setReportModalOpen(true)} className="btn-primary">
                  <Plus className="h-4 w-4" /> تسجيل تقرير يومي
                </button>
              </>
            ) : (
              <button onClick={() => setAddModalOpen(true)} className="btn-primary">
                <Plus className="h-4 w-4" /> إضافة موظف جديد
              </button>
            )}
          </>
        }
      />

      {/* Tabs */}
      <div className="inline-flex rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-soft">
        <button
          onClick={() => setTab('directory')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
            tab === 'directory' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          <UserCog className="h-4 w-4" /> دليل الموظفين والصلاحيات ({staff.length})
        </button>
        <button
          onClick={() => setTab('reports')}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all',
            tab === 'reports' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          )}
        >
          <ClipboardCheck className="h-4 w-4" /> تقارير المهام اليومية وخدمة العملاء ({staffReports.length})
        </button>
      </div>

      {/* Directory Tab */}
      {tab === 'directory' && (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">الموظف</th>
                  <th className="px-5 py-3.5">القسم والدور</th>
                  <th className="px-5 py-3.5">الصلاحيات المخصصة</th>
                  <th className="px-5 py-3.5">آخر نشاط</th>
                  <th className="px-5 py-3.5">الحالة</th>
                  <th className="px-5 py-3.5">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{m.name}</p>
                      <p className="text-xs text-slate-400" dir="ltr">
                        {m.email}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="teal">{m.roleLabel}</Badge>
                      <p className="mt-1 text-xs text-slate-500">{m.department}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(m.customPermissions ?? []).map((p) => (
                          <span
                            key={p}
                            className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500" dir="ltr">
                      {m.lastActive}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={m.status === 'ACTIVE' ? 'emerald' : 'rose'}>
                        {m.status === 'ACTIVE' ? 'نشط' : 'موقوف'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleStaffStatus(m)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold',
                          m.status === 'ACTIVE'
                            ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        )}
                      >
                        {m.status === 'ACTIVE' ? (
                          <>
                            <ShieldBan className="h-3.5 w-3.5" /> إيقاف
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" /> تفعيل
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Reports Tab */}
      {tab === 'reports' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="surface-card flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">إجمالي المكالمات المعالجة اليوم</p>
                <p className="font-display text-2xl font-extrabold text-slate-900">{totalCalls}</p>
              </div>
            </div>
            <div className="surface-card flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <TicketCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">التذاكر المغلقة اليوم</p>
                <p className="font-display text-2xl font-extrabold text-slate-900">{totalTickets}</p>
              </div>
            </div>
            <div className="surface-card flex items-center gap-4 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">متوسط الالتزام بـ SLA</p>
                <p className="font-display text-2xl font-extrabold text-teal-700">{avgSla}%</p>
              </div>
            </div>
          </div>

          <div className="surface-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">الموظف</th>
                    <th className="px-5 py-3.5">التاريخ</th>
                    <th className="px-5 py-3.5">المكالمات</th>
                    <th className="px-5 py-3.5">التذاكر المغلقة</th>
                    <th className="px-5 py-3.5">الطلبات المسندة</th>
                    <th className="px-5 py-3.5">SLA %</th>
                    <th className="px-5 py-3.5">ملخص الإنجاز</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{rep.staffName}</p>
                        <p className="text-xs text-slate-400">{rep.department}</p>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500" dir="ltr">
                        {rep.date}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">{rep.callsHandled}</td>
                      <td className="px-5 py-3.5 font-bold text-sky-700">{rep.ticketsClosed}</td>
                      <td className="px-5 py-3.5 font-bold text-teal-700">{rep.requestsAssigned}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={rep.slaCompliancePercent >= 95 ? 'emerald' : 'amber'}>
                          {rep.slaCompliancePercent}%
                        </Badge>
                      </td>
                      <td className="max-w-xs px-5 py-3.5 text-xs text-slate-600">{rep.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="إضافة موظف جديد للفريق">
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">الاسم الكامل</label>
              <input
                required
                value={staffForm.name}
                onChange={(e) => setStaffForm((s) => ({ ...s, name: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">البريد الرسمي</label>
              <input
                dir="ltr"
                type="email"
                required
                value={staffForm.email}
                onChange={(e) => setStaffForm((s) => ({ ...s, email: e.target.value }))}
                className="input-base font-mono text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">الدور الوظيفي</label>
              <select
                value={staffForm.roleCode}
                onChange={(e) =>
                  setStaffForm((s) => ({ ...s, roleCode: e.target.value as StaffMember['roleCode'] }))
                }
                className="input-base"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">القسم</label>
              <input
                value={staffForm.department}
                onChange={(e) => setStaffForm((s) => ({ ...s, department: e.target.value }))}
                className="input-base"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              صلاحيات إضافية مخصصة (مفصولة بفاصلة)
            </label>
            <input
              dir="ltr"
              value={staffForm.customPermissions}
              onChange={(e) => setStaffForm((s) => ({ ...s, customPermissions: e.target.value }))}
              className="input-base font-mono text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAddModalOpen(false)} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              حفظ وإضافة الموظف
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Daily Report Modal */}
      <Modal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="تسجيل تقرير المهام اليومي"
      >
        <form onSubmit={handleAddReport} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">الموظف</label>
            <select
              value={reportForm.staffId}
              onChange={(e) => setReportForm((s) => ({ ...s, staffId: e.target.value }))}
              className="input-base"
            >
              {staff.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.department}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">المكالمات المعالجة</label>
              <input
                type="number"
                value={reportForm.callsHandled}
                onChange={(e) => setReportForm((s) => ({ ...s, callsHandled: Number(e.target.value) }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">التذاكر المغلقة</label>
              <input
                type="number"
                value={reportForm.ticketsClosed}
                onChange={(e) => setReportForm((s) => ({ ...s, ticketsClosed: Number(e.target.value) }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">الطلبات المسندة</label>
              <input
                type="number"
                value={reportForm.requestsAssigned}
                onChange={(e) =>
                  setReportForm((s) => ({ ...s, requestsAssigned: Number(e.target.value) }))
                }
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">الالتزام بـ SLA (%)</label>
              <input
                type="number"
                max={100}
                value={reportForm.slaCompliancePercent}
                onChange={(e) =>
                  setReportForm((s) => ({ ...s, slaCompliancePercent: Number(e.target.value) }))
                }
                className="input-base"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">ملخص وملاحظات اليوم</label>
            <textarea
              rows={3}
              value={reportForm.notes}
              onChange={(e) => setReportForm((s) => ({ ...s, notes: e.target.value }))}
              className="input-base"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setReportModalOpen(false)} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              حفظ التقرير
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
