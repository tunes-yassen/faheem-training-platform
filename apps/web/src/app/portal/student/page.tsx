'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Wallet,
  BookOpen,
  FileText,
  Award,
  LifeBuoy,
  Video,
  Plus,
  QrCode,
  ArrowUpLeft,
  ArrowDownRight,
  CheckCircle2,
} from 'lucide-react';
import { PortalShell } from '@/components/PortalShell';
import {
  DEMO_CERTIFICATES,
  DEMO_COURSES,
  DEMO_SESSIONS,
  DEMO_TICKETS,
  DEMO_WALLET_LEDGER,
} from '@/lib/demo-data';
import { api } from '@/lib/api';
import type { SupportTicket, WalletTransaction } from '@/types';

const LEDGER_LABELS: Record<WalletTransaction['type'], { label: string; cls: string }> = {
  CREDIT: { label: 'إيداع', cls: 'bg-emerald-50 text-emerald-700' },
  HOLD: { label: 'تعليق حجز', cls: 'bg-sunlit-50 text-amber-700' },
  DEBIT: { label: 'خصم حصة', cls: 'bg-slate-100 text-slate-700' },
  RELEASE: { label: 'فك تعليق', cls: 'bg-azure-50 text-azure-700' },
  REFUND: { label: 'استرداد', cls: 'bg-teal-50 text-teal-700' },
  SETTLEMENT: { label: 'تسوية', cls: 'bg-slate-100 text-slate-700' },
};

export default function StudentPortalPage() {
  const [tab, setTab] = useState('sessions');
  const [ledger, setLedger] = useState<WalletTransaction[]>(DEMO_WALLET_LEDGER);
  const [tickets, setTickets] = useState<SupportTicket[]>(DEMO_TICKETS);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [ticketSaved, setTicketSaved] = useState(false);
  const [activeClassroom, setActiveClassroom] = useState<string | null>(null);

  useEffect(() => {
    api.getWalletLedger().then(setLedger);
    api.getTickets().then(setTickets);
  }, []);

  const balance = ledger.reduce((acc, tx) => acc + tx.amount, 0);
  const myCerts = Object.values(DEMO_CERTIFICATES).slice(0, 2);

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim()) return;
    setTickets((prev) => [
      {
        id: `TKT-${Math.floor(420 + Math.random() * 500)}`,
        subject: newTicketSubject.trim(),
        category: 'دعم الطالب',
        status: 'OPEN',
        priority: 'MEDIUM',
        slaRemaining: 'ساعتان',
        createdAt: 'الآن',
      },
      ...prev,
    ]);
    setNewTicketSubject('');
    setTicketSaved(true);
    setTimeout(() => setTicketSaved(false), 3000);
  };

  return (
    <PortalShell
      portalTitle="بوابة الطالب والمتدرب"
      portalSubtitle="حصصك، محفظتك، دوراتك المهنية، وشهاداتك في مكان واحد"
      roleBadge="طالب"
      accent="teal"
      activeTab={tab}
      onTabChange={setTab}
      tabs={[
        { id: 'sessions', label: 'الحصص القادمة', icon: <Calendar className="h-4 w-4" />, badge: DEMO_SESSIONS.length },
        { id: 'wallet', label: 'المحفظة والسجل المالي', icon: <Wallet className="h-4 w-4" /> },
        { id: 'courses', label: 'دوراتي المهنية', icon: <BookOpen className="h-4 w-4" />, badge: 2 },
        { id: 'reports', label: 'تقارير المعلمين', icon: <FileText className="h-4 w-4" /> },
        { id: 'certificates', label: 'شهاداتي المعتمدة', icon: <Award className="h-4 w-4" />, badge: myCerts.length },
        { id: 'tickets', label: 'تذاكر الدعم', icon: <LifeBuoy className="h-4 w-4" /> },
      ]}
    >
      {/* KPI Summary Strip */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500">رصيد المحفظة المتاح</p>
          <p className="mt-1 font-heading text-2xl font-black text-teal-700">
            {balance.toLocaleString('ar-SA')} <span className="text-xs font-bold">ر.س</span>
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500">الحصص القادمة</p>
          <p className="mt-1 font-heading text-2xl font-black text-azure-600">2 حصة</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500">الدورات النشطة</p>
          <p className="mt-1 font-heading text-2xl font-black text-slate-900">2 دورة</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500">الشهادات الموثقة</p>
          <p className="mt-1 font-heading text-2xl font-black text-amber-600">{myCerts.length}</p>
        </div>
      </div>

      {/* SESSIONS TAB */}
      {tab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              جدول الحصص والجلسات المباشرة
            </h2>
            <Link href="/tutoring" className="btn-primary py-2 px-4 text-xs">
              <Plus className="h-4 w-4" />
              حجز حصة جديدة
            </Link>
          </div>
          {activeClassroom && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-3.5 text-xs font-bold text-teal-900">
              <span className="flex items-center gap-2">
                <Video className="h-4 w-4 text-teal-600" />
                تم تجهيز القاعة الافتراضية لـ: <strong>{activeClassroom}</strong> — رمز الجلسة:{' '}
                <span className="font-mono" dir="ltr">FHM-LIVE-2026</span>
              </span>
              <button
                type="button"
                onClick={() => setActiveClassroom(null)}
                className="rounded-lg bg-white px-3 py-1 text-teal-700 shadow-sm"
              >
                إغلاق
              </button>
            </div>
          )}
          {DEMO_SESSIONS.map((ses) => (
            <div
              key={ses.id}
              className="glass-card flex flex-col justify-between gap-4 rounded-3xl p-5 sm:flex-row sm:items-center"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={ses.status === 'LIVE' ? 'badge-amber' : ses.status === 'UPCOMING' ? 'badge-teal' : 'badge-azure'}>
                    {ses.status === 'LIVE' ? 'مباشر الآن' : ses.status === 'UPCOMING' ? 'قادمة' : 'مكتملة'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {ses.date} • {ses.time}
                  </span>
                </div>
                <h3 className="font-heading text-base font-extrabold text-slate-900">{ses.title}</h3>
                <p className="text-xs text-slate-600">
                  المعلم / المدرب: <strong className="text-teal-700">{ses.tutorOrTrainer}</strong>
                </p>
              </div>
              {ses.status !== 'COMPLETED' ? (
                <button
                  type="button"
                  onClick={() => setActiveClassroom(ses.title)}
                  className="btn-primary py-2.5 px-5 text-xs"
                >
                  <Video className="h-4 w-4" />
                  دخول القاعة الافتراضية
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setTab('reports')}
                  className="btn-outline py-2 px-4 text-xs"
                >
                  عرض تقرير الحصة
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* WALLET TAB */}
      {tab === 'wallet' && (
        <div className="space-y-5">
          <div className="rounded-3xl bg-gradient-to-l from-teal-600 to-emerald-500 p-6 text-white shadow-soft-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-teal-100">الرصيد المتاح في محفظة فهيم</p>
                <p className="mt-1 font-heading text-4xl font-black">
                  {balance.toLocaleString('ar-SA')} <span className="text-base font-bold">ر.س</span>
                </p>
                <p className="mt-1 text-xs text-teal-50">
                  سجل قيود مالية غير قابل للتعديل (Append-only Ledger)
                </p>
              </div>
              <Link
                href="/tutoring#packages"
                className="rounded-2xl bg-white px-5 py-3 text-xs font-extrabold text-teal-700 shadow"
              >
                شحن باقة ساعات جديدة
              </Link>
            </div>
          </div>

          <div className="glass-card overflow-hidden rounded-3xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="font-heading text-base font-extrabold text-slate-900">
                سجل الحركات المالية
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {ledger.map((tx) => {
                const meta = LEDGER_LABELS[tx.type];
                const isPositive = tx.amount > 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownRight className="h-4 w-4" />
                        ) : (
                          <ArrowUpLeft className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{tx.description}</p>
                        <p className="text-xs text-slate-500">
                          {tx.date} • مرجع: <span dir="ltr">{tx.reference}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p
                        className={`font-heading text-sm font-black ${
                          isPositive ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                        dir="ltr"
                      >
                        {isPositive ? `+${tx.amount}` : tx.amount} SAR
                      </p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MY COURSES TAB */}
      {tab === 'courses' && (
        <div className="grid gap-5 md:grid-cols-2">
          {DEMO_COURSES.slice(0, 2).map((course, idx) => {
            const progress = idx === 0 ? 78 : 42;
            return (
              <div key={course.id} className="glass-card rounded-3xl p-6">
                <span className="badge-teal">{course.category}</span>
                <h3 className="mt-3 font-heading text-base font-extrabold text-slate-900">
                  {course.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500">المدرب: {course.trainer.name}</p>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs font-bold">
                    <span className="text-slate-600">نسبة الإنجاز</span>
                    <span className="text-teal-700">{progress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-teal-600 to-emerald-400"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <Link
                  href={`/courses/${course.slug}`}
                  className="btn-outline mt-5 w-full py-2 text-xs"
                >
                  متابعة محتوى الدورة
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* REPORTS TAB */}
      {tab === 'reports' && (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-extrabold text-slate-900">
            تقارير الأداء الأكاديمي بعد الحصص
          </h2>
          {DEMO_SESSIONS.filter((s) => s.reportSummary).map((s) => (
            <div key={s.id} className="glass-card rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-base font-extrabold text-slate-900">{s.title}</h3>
                <span className="badge-teal">تقرير معتمد</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                بواسطة {s.tutorOrTrainer} • {s.date}
              </p>
              <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {s.reportSummary}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* CERTIFICATES TAB */}
      {tab === 'certificates' && (
        <div className="grid gap-5 md:grid-cols-2">
          {myCerts.map((cert) => (
            <div key={cert.serial} className="glass-card rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <span className="badge-amber">
                  <Award className="h-3.5 w-3.5" />
                  {cert.grade}
                </span>
                <span className="font-mono text-xs font-bold text-slate-500">{cert.serial}</span>
              </div>
              <h3 className="mt-3 font-heading text-base font-extrabold text-slate-900">
                {cert.courseTitle}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                تاريخ الإصدار: {cert.issueDate} • {cert.hours} ساعة
              </p>
              <div className="mt-5 flex gap-2">
                <Link href="/verify" className="btn-primary flex-1 py-2 text-xs">
                  <QrCode className="h-4 w-4" />
                  التحقق برمز QR
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUPPORT TICKETS TAB */}
      {tab === 'tickets' && (
        <div className="space-y-5">
          <form onSubmit={handleAddTicket} className="glass-card flex flex-col gap-3 rounded-3xl p-5 sm:flex-row">
            <input
              value={newTicketSubject}
              onChange={(e) => setNewTicketSubject(e.target.value)}
              placeholder="اكتب موضوع تذكرة الدعم الجديدة..."
              className="input-field flex-1"
              required
            />
            <button type="submit" className="btn-primary px-6 py-3 text-xs">
              فتح تذكرة دعم
            </button>
          </form>
          {ticketSaved && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              تم فتح التذكرة وإحالتها لفريق الدعم ضمن اتفاقية SLA.
            </div>
          )}
          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="glass-card flex items-center justify-between rounded-2xl p-4">
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{t.subject}</p>
                  <p className="text-xs text-slate-500">
                    {t.id} • {t.category} • {t.createdAt}
                  </p>
                </div>
                <span className={t.status === 'RESOLVED' ? 'badge-teal' : 'badge-amber'}>
                  {t.status === 'RESOLVED' ? 'تم الحل' : t.status === 'IN_PROGRESS' ? 'قيد المعالجة' : 'مفتوحة'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </PortalShell>
  );
}
