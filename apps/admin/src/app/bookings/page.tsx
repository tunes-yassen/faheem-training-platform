'use client';

import React, { useState } from 'react';
import {
  CalendarCheck2,
  Video,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Copy,
  Download,
  Plus,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import { cn, exportToCSV, formatSAR } from '@/lib/utils';
import { Badge, Modal, PageHeader } from '@/components/ui/Primitives';

interface AdminBookingItem {
  id: string;
  ref: string;
  studentName: string;
  tutorName: string;
  subject: string;
  grade: string;
  scheduledAt: string;
  durationMin: number;
  provider: 'Zoom' | 'LiveKit' | 'Teams';
  joinUrl: string;
  priceSar: number;
  attendance: 'PRESENT' | 'ABSENT' | 'PENDING';
  status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  cancelReason?: string;
}

const INITIAL_BOOKINGS: AdminBookingItem[] = [
  {
    id: 'bk-1',
    ref: 'BK-2026-4421',
    studentName: 'فيصل العتيبي',
    tutorName: 'أ. سلطان المالكي',
    subject: 'الرياضيات',
    grade: 'الثالث ثانوي',
    scheduledAt: '2026-11-24 17:00',
    durationMin: 60,
    provider: 'Zoom',
    joinUrl: 'https://zoom.us/j/98412039481',
    priceSar: 120,
    attendance: 'PENDING',
    status: 'CONFIRMED',
  },
  {
    id: 'bk-2',
    ref: 'BK-2026-4425',
    studentName: 'لينا الشمري',
    tutorName: 'د. يوسف العبدالله',
    subject: 'اللغة الإنجليزية',
    grade: 'الثاني متوسط',
    scheduledAt: '2026-11-24 19:30',
    durationMin: 60,
    provider: 'LiveKit',
    joinUrl: 'https://faheem.sa/classroom/BK-2026-4425',
    priceSar: 150,
    attendance: 'PRESENT',
    status: 'IN_PROGRESS',
  },
  {
    id: 'bk-3',
    ref: 'BK-2026-4405',
    studentName: 'عمر الدوسري',
    tutorName: 'أ. سلطان المالكي',
    subject: 'القدرات والتحصيلي',
    grade: 'الثالث ثانوي',
    scheduledAt: '2026-11-23 20:00',
    durationMin: 90,
    provider: 'Zoom',
    joinUrl: 'https://zoom.us/j/98412030012',
    priceSar: 180,
    attendance: 'PRESENT',
    status: 'COMPLETED',
  },
  {
    id: 'bk-4',
    ref: 'BK-2026-4398',
    studentName: 'سلمى العتيبي',
    tutorName: 'أ. أمل البقمي',
    subject: 'الفيزياء',
    grade: 'الأول ثانوي',
    scheduledAt: '2026-11-22 18:00',
    durationMin: 60,
    provider: 'Teams',
    joinUrl: 'https://teams.microsoft.com/l/meetup-join/faheem-4398',
    priceSar: 130,
    attendance: 'ABSENT',
    status: 'CANCELLED',
    cancelReason: 'إلغاء مجاني قبل الموعد بـ 18 ساعة عبر حساب ولي الأمر',
  },
];

export default function BookingsManagementPage() {
  const { notify, appendAuditLog } = useAdmin();
  const [bookings, setBookings] = useState<AdminBookingItem[]>(INITIAL_BOOKINGS);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const [rescheduleTarget, setRescheduleTarget] = useState<AdminBookingItem | null>(null);
  const [newSchedule, setNewSchedule] = useState('');

  const [cancelTarget, setCancelTarget] = useState<AdminBookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    studentName: '',
    tutorName: 'أ. سلطان المالكي',
    subject: 'الرياضيات',
    grade: 'الثالث ثانوي',
    scheduledAt: '2026-11-26 18:00',
    durationMin: 60,
    provider: 'Zoom' as AdminBookingItem['provider'],
    priceSar: 120,
  });

  const filtered = bookings.filter((b) => {
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchSearch =
      !search.trim() ||
      b.ref.toLowerCase().includes(search.toLowerCase()) ||
      b.studentName.includes(search) ||
      b.tutorName.includes(search) ||
      b.subject.includes(search);
    return matchStatus && matchSearch;
  });

  const handleCopyLink = (url: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    notify('تم نسخ رابط الفصل الافتراضي', 'info');
  };

  const handleReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget || !newSchedule.trim()) return;
    setBookings((prev) =>
      prev.map((b) =>
        b.id === rescheduleTarget.id
          ? { ...b, scheduledAt: newSchedule.trim(), status: 'CONFIRMED' }
          : b
      )
    );
    appendAuditLog({
      module: 'إدارة الحجوزات والجلسات',
      action: 'BOOKING_RESCHEDULED',
      severity: 'INFO',
      summary: `إعادة جدولة الحجز ${rescheduleTarget.ref} إلى ${newSchedule.trim()}`,
    });
    notify(`تم تعديل موعد الجلسة ${rescheduleTarget.ref}`);
    setRescheduleTarget(null);
  };

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTarget || !cancelReason.trim()) return;
    setBookings((prev) =>
      prev.map((b) =>
        b.id === cancelTarget.id
          ? { ...b, status: 'CANCELLED', cancelReason: cancelReason.trim() }
          : b
      )
    );
    appendAuditLog({
      module: 'إدارة الحجوزات والجلسات',
      action: 'BOOKING_CANCELLED',
      severity: 'WARNING',
      summary: `إلغاء الحجز ${cancelTarget.ref} — السبب: ${cancelReason.trim()}`,
    });
    notify(`تم إلغاء الحجز ${cancelTarget.ref} وتوثيق السبب`, 'warning');
    setCancelTarget(null);
    setCancelReason('');
  };

  const handleMarkAttendance = (b: AdminBookingItem, attendance: AdminBookingItem['attendance']) => {
    setBookings((prev) =>
      prev.map((item) =>
        item.id === b.id
          ? {
              ...item,
              attendance,
              status: attendance === 'PRESENT' ? 'COMPLETED' : item.status,
            }
          : item
      )
    );
    notify(`تم تحديث حالة الحضور للجلسة ${b.ref}`);
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.studentName.trim()) return;
    const ref = `BK-2026-${Math.floor(4500 + Math.random() * 499)}`;
    const created: AdminBookingItem = {
      id: `bk-${Date.now()}`,
      ref,
      ...createForm,
      joinUrl: `https://faheem.sa/classroom/${ref}`,
      attendance: 'PENDING',
      status: 'CONFIRMED',
    };
    setBookings((prev) => [created, ...prev]);
    appendAuditLog({
      module: 'إدارة الحجوزات والجلسات',
      action: 'BOOKING_CREATED_MANUAL',
      severity: 'INFO',
      summary: `إنشاء حجز يدوي ${ref} للطالب ${created.studentName} مع ${created.tutorName}`,
    });
    notify(`تم إنشاء الحجز ${ref} وتوليد رابط الفصل الافتراضي`);
    setCreateOpen(false);
    setCreateForm((s) => ({ ...s, studentName: '' }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة الحجوزات والجلسات الافتراضية"
        subtitle="متابعة جميع حجوزات الدروس الخصوصية، روابط الفصول الافتراضية (Zoom / LiveKit / Teams)، حالة الحضور، وإعادة الجدولة أو الإلغاء الموثق."
        badge={
          <Badge variant="teal">
            <CalendarCheck2 className="h-3.5 w-3.5" /> {bookings.length} حجز
          </Badge>
        }
        actions={
          <>
            <button
              onClick={() =>
                exportToCSV('faheem-bookings.csv', filtered as unknown as Record<string, unknown>[], [
                  { key: 'ref', label: 'رقم الحجز' },
                  { key: 'studentName', label: 'الطالب' },
                  { key: 'tutorName', label: 'المعلم' },
                  { key: 'subject', label: 'المادة' },
                  { key: 'scheduledAt', label: 'الموعد' },
                  { key: 'provider', label: 'الفصل الافتراضي' },
                  { key: 'priceSar', label: 'القيمة' },
                  { key: 'status', label: 'الحالة' },
                ])
              }
              className="btn-secondary"
            >
              <Download className="h-4 w-4 text-teal-600" /> تصدير CSV
            </button>
            <button onClick={() => setCreateOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> إنشاء حجز يدوي
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-soft">
          {[
            { key: 'ALL', label: 'الكل' },
            { key: 'CONFIRMED', label: 'مؤكد' },
            { key: 'IN_PROGRESS', label: 'جارٍ الآن' },
            { key: 'COMPLETED', label: 'مكتمل' },
            { key: 'CANCELLED', label: 'ملغي' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'rounded-xl px-3.5 py-2 text-xs font-bold transition-all',
                statusFilter === f.key ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم الحجز، الطالب، المعلم، أو المادة..."
            className="input-base pr-9 text-xs"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">المرجع</th>
                <th className="px-5 py-3.5">الطالب ↔ المعلم</th>
                <th className="px-5 py-3.5">المادة والموعد</th>
                <th className="px-5 py-3.5">الفصل الافتراضي</th>
                <th className="px-5 py-3.5">الحضور</th>
                <th className="px-5 py-3.5">القيمة</th>
                <th className="px-5 py-3.5">الحالة</th>
                <th className="px-5 py-3.5">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-teal-700">{b.ref}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900">{b.studentName}</p>
                    <p className="text-xs text-slate-500">{b.tutorName}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-800">
                      {b.subject} <span className="text-xs text-slate-400">({b.grade})</span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-slate-500" dir="ltr">
                      <Clock className="h-3 w-3" /> {b.scheduledAt} ({b.durationMin}د)
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleCopyLink(b.joinUrl)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 hover:bg-sky-100"
                    >
                      <Video className="h-3.5 w-3.5" /> {b.provider} <Copy className="h-3 w-3" />
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    {b.attendance === 'PRESENT' ? (
                      <Badge variant="emerald">حضر</Badge>
                    ) : b.attendance === 'ABSENT' ? (
                      <Badge variant="rose">غائب</Badge>
                    ) : (
                      <button
                        onClick={() => handleMarkAttendance(b, 'PRESENT')}
                        className="rounded-lg border border-teal-200 px-2 py-0.5 text-[11px] font-bold text-teal-700 hover:bg-teal-50"
                      >
                        تأكيد الحضور
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{formatSAR(b.priceSar)}</td>
                  <td className="px-5 py-3.5">
                    <Badge
                      variant={
                        b.status === 'COMPLETED'
                          ? 'emerald'
                          : b.status === 'IN_PROGRESS'
                          ? 'teal'
                          : b.status === 'CONFIRMED'
                          ? 'sky'
                          : 'rose'
                      }
                    >
                      {b.status === 'COMPLETED'
                        ? 'مكتمل'
                        : b.status === 'IN_PROGRESS'
                        ? 'جارٍ الآن'
                        : b.status === 'CONFIRMED'
                        ? 'مؤكد'
                        : 'ملغي'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setRescheduleTarget(b);
                            setNewSchedule(b.scheduledAt);
                          }}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                          title="إعادة جدولة"
                        >
                          <CalendarClock className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setCancelTarget(b);
                            setCancelReason('');
                          }}
                          className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                          title="إلغاء الحجز"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {b.status === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> منتهي
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reschedule Modal */}
      <Modal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title={`إعادة جدولة الجلسة ${rescheduleTarget?.ref}`}
      >
        <form onSubmit={handleReschedule} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">الموعد الجديد</label>
            <input
              dir="ltr"
              required
              value={newSchedule}
              onChange={(e) => setNewSchedule(e.target.value)}
              placeholder="2026-11-26 19:00"
              className="input-base font-mono"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRescheduleTarget(null)} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              حفظ الموعد الجديد
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title={`إلغاء الحجز ${cancelTarget?.ref}`}
      >
        <form onSubmit={handleCancel} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">سبب الإلغاء (إلزامي)</label>
            <textarea
              required
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="input-base"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCancelTarget(null)} className="btn-secondary">
              تراجع
            </button>
            <button type="submit" className="btn-danger">
              تأكيد الإلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Manual Booking Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="إنشاء حجز جلسة يدوي">
        <form onSubmit={handleCreateBooking} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">اسم الطالب</label>
              <input
                required
                value={createForm.studentName}
                onChange={(e) => setCreateForm((s) => ({ ...s, studentName: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">المعلم المسند</label>
              <input
                required
                value={createForm.tutorName}
                onChange={(e) => setCreateForm((s) => ({ ...s, tutorName: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">المادة</label>
              <input
                value={createForm.subject}
                onChange={(e) => setCreateForm((s) => ({ ...s, subject: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">الموعد</label>
              <input
                dir="ltr"
                value={createForm.scheduledAt}
                onChange={(e) => setCreateForm((s) => ({ ...s, scheduledAt: e.target.value }))}
                className="input-base font-mono text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">
              إلغاء
            </button>
            <button type="submit" className="btn-primary">
              تأكيد الحجز وتوليد الرابط
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
