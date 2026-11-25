'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  FileText,
  ClipboardCheck,
  Award,
  Receipt,
  LifeBuoy,
  Video,
  Download,
  QrCode,
  CheckCircle2,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';
import { PortalShell } from '@/components/PortalShell';
import { ConversationsPanel } from '@/components/ConversationsPanel';
import { api } from '@/lib/api';
import { DEMO_CERTIFICATES, DEMO_COURSES, DEMO_TICKETS } from '@/lib/demo-data';
import type { Course, SupportTicket } from '@/types';

const MATERIALS = [
  { id: 'mat-1', title: 'الحقيبة التدريبية الكاملة — إدارة المشاريع PMP 7', type: 'PDF • 14 MB', course: 'إدارة المشاريع الاحترافية PMP' },
  { id: 'mat-2', title: 'قوالب Excel جاهزة لحساب القيمة المكتسبة EVM', type: 'XLSX • 2.3 MB', course: 'إدارة المشاريع الاحترافية PMP' },
  { id: 'mat-3', title: 'دفتر تمارين Power BI و DAX التطبيقية', type: 'PBIX • 8.6 MB', course: 'تحليل البيانات وذكاء الأعمال' },
];

const ASSIGNMENTS = [
  { id: 'asg-1', title: 'بناء ميثاق المشروع وهيكل تجزئة العمل WBS', due: '2026-12-12', status: 'SUBMITTED', score: '96 / 100' },
  { id: 'asg-2', title: 'اختبار تجريبي محاكي للاختبار الدولي PMP (60 سؤال)', due: '2026-12-18', status: 'PENDING', score: '—' },
];

const INVOICES = [
  { id: 'INV-LMS-4012', item: 'إدارة المشاريع الاحترافية PMP — الدفعة 18', amount: 1850, date: '2026-11-15', status: 'مدفوعة' },
  { id: 'INV-LMS-3890', item: 'تحليل البيانات وذكاء الأعمال Power BI', amount: 2200, date: '2026-10-02', status: 'مدفوعة' },
];

export default function TraineePortalPage() {
  const [tab, setTab] = useState('courses');
  const [courses, setCourses] = useState<Course[]>(DEMO_COURSES);
  const [tickets, setTickets] = useState<SupportTicket[]>(DEMO_TICKETS);
  const [submittedIds, setSubmittedIds] = useState<Record<string, boolean>>({ 'asg-1': true });
  const [ticketSubject, setTicketSubject] = useState('');
  const [actionToast, setActionToast] = useState<string | null>(null);

  const handleDownloadMaterial = (title: string) => {
    try {
      const blob = new Blob([`منصة فهيم للتدريب\nالحقيبة التدريبية: ${title}\n`], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.slice(0, 24)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
    setActionToast(`تم بدء تحميل: ${title}`);
    setTimeout(() => setActionToast(null), 3500);
  };

  useEffect(() => {
    api.getCourses().then(setCourses);
    api.getTickets().then(setTickets);
  }, []);

  const myCourses = courses.slice(0, 3);
  const myCerts = Object.values(DEMO_CERTIFICATES);

  return (
    <PortalShell
      portalTitle="بوابة المتدرب المهني"
      portalSubtitle="دوراتك، الجدول، القاعات، ملفات التدريب، الواجبات والاختبارات، الشهادات، والفواتير"
      roleBadge="متدرب مهني"
      accent="teal"
      activeTab={tab}
      onTabChange={setTab}
      tabs={[
        { id: 'courses', label: 'دوراتي المهنية', icon: <BookOpen className="h-4 w-4" />, badge: myCourses.length },
        { id: 'schedule', label: 'الجدول والفصول المباشرة', icon: <Calendar className="h-4 w-4" /> },
        { id: 'materials', label: 'ملفات وحقائب التدريب', icon: <FileText className="h-4 w-4" /> },
        { id: 'assessments', label: 'الواجبات والاختبارات', icon: <ClipboardCheck className="h-4 w-4" />, badge: 1 },
        { id: 'certificates', label: 'السجل التدريبي والشهادات', icon: <Award className="h-4 w-4" />, badge: myCerts.length },
        { id: 'invoices', label: 'الفواتير والمدفوعات', icon: <Receipt className="h-4 w-4" /> },
        { id: 'conversations', label: 'المحادثات والتواصل', icon: <MessageSquare className="h-4 w-4" /> },
        { id: 'tickets', label: 'طلبات الدعم', icon: <LifeBuoy className="h-4 w-4" /> },
      ]}
    >
      {/* KPI Strip */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500">الدورات المسجلة</p>
          <p className="mt-1 font-heading text-2xl font-black text-teal-700">{myCourses.length} دورات</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500">إجمالي الساعات التدريبية</p>
          <p className="mt-1 font-heading text-2xl font-black text-azure-600">99 ساعة</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500">نسبة الحضور</p>
          <p className="mt-1 font-heading text-2xl font-black text-emerald-600">96%</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500">الشهادات المعتمدة</p>
          <p className="mt-1 font-heading text-2xl font-black text-amber-600">{myCerts.length}</p>
        </div>
      </div>

      {/* MY COURSES */}
      {tab === 'courses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-extrabold text-slate-900">دوراتي التدريبية النشطة</h2>
            <Link href="/courses" className="btn-primary py-2 px-4 text-xs">
              تصفح دورات جديدة
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {myCourses.map((c, i) => {
              const progress = i === 0 ? 82 : i === 1 ? 55 : 100;
              return (
                <div key={c.id} className="glass-card rounded-3xl p-6">
                  <div className="flex items-center justify-between">
                    <span className="badge-teal">{c.category}</span>
                    <span className="text-xs font-bold text-slate-500">{c.hours} ساعة</span>
                  </div>
                  <h3 className="mt-3 font-heading text-base font-extrabold text-slate-900">{c.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">المدرب: {c.trainer.name}</p>
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
                  <div className="mt-5 flex gap-2">
                    <Link href={`/courses/${c.slug}`} className="btn-outline flex-1 py-2 text-xs">
                      تفاصيل المنهج
                    </Link>
                    <button type="button" onClick={() => setTab('schedule')} className="btn-primary flex-1 py-2 text-xs">
                      <Video className="h-3.5 w-3.5" />
                      القاعة
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SCHEDULE & CLASSROOMS */}
      {tab === 'schedule' && (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-extrabold text-slate-900">جدول المحاضرات وروابط الفصول</h2>
          {myCourses.map((c) => (
            <div key={c.id} className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5">
              <div>
                <span className="badge-azure">{c.cohorts[0]?.name || 'الدفعة النشطة'}</span>
                <h3 className="mt-2 font-heading text-base font-extrabold text-slate-900">{c.title}</h3>
                <p className="text-xs text-slate-500">
                  {c.cohorts[0]?.schedule} • {c.cohorts[0]?.locationOrPlatform}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActionToast(`تم تجهيز القاعة الافتراضية لدورة: ${c.title} — رمز الدخول: FHM-LMS-2026`);
                  setTimeout(() => setActionToast(null), 4000);
                }}
                className="btn-primary py-2.5 px-5 text-xs"
              >
                <Video className="h-4 w-4" />
                دخول الفصل الافتراضي
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MATERIALS */}
      {tab === 'materials' && (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-extrabold text-slate-900">ملفات وحقائب التدريب</h2>
          {actionToast && (
            <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-xs font-bold text-teal-800">
              {actionToast}
            </div>
          )}
          {MATERIALS.map((m) => (
            <div key={m.id} className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
              <div>
                <p className="text-sm font-extrabold text-slate-900">{m.title}</p>
                <p className="text-xs text-slate-500">{m.course} • {m.type}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadMaterial(m.title)}
                className="btn-outline py-2 px-4 text-xs"
              >
                <Download className="h-4 w-4" />
                تحميل الملف
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ASSIGNMENTS & ASSESSMENTS */}
      {tab === 'assessments' && (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-extrabold text-slate-900">الواجبات والاختبارات التقييمية</h2>
          {ASSIGNMENTS.map((a) => {
            const done = submittedIds[a.id];
            return (
              <div key={a.id} className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5">
                <div>
                  <h3 className="font-heading text-base font-extrabold text-slate-900">{a.title}</h3>
                  <p className="text-xs text-slate-500">آخر موعد للتسليم: {a.due} • الدرجة: {a.score}</p>
                </div>
                {done ? (
                  <span className="badge-teal">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    تم التسليم بنجاح
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSubmittedIds((prev) => ({ ...prev, [a.id]: true }))}
                    className="btn-primary py-2 px-4 text-xs"
                  >
                    بدء الاختبار / تسليم الواجب
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CERTIFICATES & TRAINING RECORD */}
      {tab === 'certificates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-extrabold text-slate-900">السجل التدريبي والشهادات المعتمدة</h2>
            <span className="badge-amber">
              <GraduationCap className="h-3.5 w-3.5" />
              جاهزية NCEL + تحقق QR
            </span>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {myCerts.map((cert) => (
              <div key={cert.serial} className="glass-card rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <span className="badge-teal">{cert.grade}</span>
                  <span className="font-mono text-xs font-bold text-slate-500">{cert.serial}</span>
                </div>
                <h3 className="mt-3 font-heading text-base font-extrabold text-slate-900">{cert.courseTitle}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  الإصدار: {cert.issueDate} • {cert.hours} ساعة • {cert.ncelCode}
                </p>
                <Link href="/verify" className="btn-primary mt-5 w-full py-2 text-xs">
                  <QrCode className="h-4 w-4" />
                  التحقق وعرض الشهادة
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INVOICES */}
      {tab === 'invoices' && (
        <div className="glass-card overflow-hidden rounded-3xl">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-heading text-base font-extrabold text-slate-900">الفواتير الضريبية للدورات</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {INVOICES.map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{inv.item}</p>
                  <p className="text-xs text-slate-500">
                    <span dir="ltr">{inv.id}</span> • {inv.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading text-base font-black text-slate-900">
                    {inv.amount.toLocaleString('ar-SA')} ر.س
                  </span>
                  <span className="badge-teal">{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONVERSATIONS */}
      {tab === 'conversations' && (
        <ConversationsPanel currentUserName="متدرب فهيم" currentUserRole="متدرب مهني" />
      )}

      {/* SUPPORT TICKETS */}
      {tab === 'tickets' && (
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!ticketSubject.trim()) return;
              setTickets((prev) => [
                {
                  id: `TKT-${Math.floor(500 + Math.random() * 400)}`,
                  subject: ticketSubject.trim(),
                  category: 'دعم المتدرب',
                  status: 'OPEN',
                  priority: 'MEDIUM',
                  slaRemaining: 'ساعتان',
                  createdAt: 'الآن',
                },
                ...prev,
              ]);
              setTicketSubject('');
            }}
            className="glass-card flex flex-col gap-3 rounded-3xl p-5 sm:flex-row"
          >
            <input
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="اكتب موضوع طلب الدعم..."
              className="input-field flex-1"
              required
            />
            <button type="submit" className="btn-primary px-6 py-3 text-xs">
              إرسال طلب دعم
            </button>
          </form>
          {tickets.map((t) => (
            <div key={t.id} className="glass-card flex items-center justify-between rounded-2xl p-4">
              <div>
                <p className="text-sm font-extrabold text-slate-900">{t.subject}</p>
                <p className="text-xs text-slate-500">{t.id} • {t.category}</p>
              </div>
              <span className={t.status === 'RESOLVED' ? 'badge-teal' : 'badge-amber'}>
                {t.status === 'RESOLVED' ? 'تم الحل' : 'قيد المتابعة'}
              </span>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
