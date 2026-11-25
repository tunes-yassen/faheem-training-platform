'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Calendar,
  FileBarChart2,
  Receipt,
  CheckCircle2,
  ShieldCheck,
  Sliders,
  MessageSquare,
  ClipboardCheck,
  Award,
  Bell,
  Video,
  Lock,
  Wallet,
} from 'lucide-react';
import { PortalShell } from '@/components/PortalShell';
import { ConversationsPanel } from '@/components/ConversationsPanel';
import { DEMO_CHILDREN } from '@/lib/demo-data';
import { api } from '@/lib/api';
import type { ChildAccount, ChildControls } from '@/types';

const DEMO_INVOICES = [
  { id: 'INV-2026-901', desc: 'باقة التميز الدراسي (12 ساعة) — مشتركة للأبناء', amount: 1020, date: '2026-11-18', status: 'مدفوعة' },
  { id: 'INV-2026-844', desc: 'باقة البداية الذكية (4 ساعات) — سارة القحطاني', amount: 380, date: '2026-10-25', status: 'مدفوعة' },
];

const ATTENDANCE_LOG = [
  { id: 'att-1', childId: 'ch-1', subject: 'القدرات الكمي', tutor: 'أ. نورة الشمري', date: 'اليوم 5:00 م', status: 'حاضر (مباشر)', duration: '60 دقيقة' },
  { id: 'att-2', childId: 'ch-1', subject: 'الرياضيات', tutor: 'أ. نورة الشمري', date: 'قبل يومين', status: 'حاضر مكتمل', duration: '60 دقيقة' },
  { id: 'att-3', childId: 'ch-2', subject: 'الرياضيات', tutor: 'أ. ريم القحطاني', date: 'أمس 4:30 م', status: 'حاضر مكتمل', duration: '60 دقيقة' },
];

const EXAM_SCORES = [
  { id: 'ex-1', childId: 'ch-1', title: 'اختبار القدرات الكمي التجريبي #3', score: 94, max: 100, date: '2026-11-20', remark: 'تقدم ممتاز في مسائل الهندسة' },
  { id: 'ex-2', childId: 'ch-1', title: 'تقييم وحدة الدوال والمتباينات', score: 91, max: 100, date: '2026-11-14', remark: 'استيعاب سريع ودقة عالية' },
  { id: 'ex-3', childId: 'ch-2', title: 'اختبار المعادلات الخطية', score: 87, max: 100, date: '2026-11-19', remark: 'تحسن واضح بمقدار +12 درجة' },
];

export default function ParentPortalPage() {
  const [tab, setTab] = useState('controls');
  const [children, setChildren] = useState<ChildAccount[]>(DEMO_CHILDREN);
  const [selectedChildId, setSelectedChildId] = useState<string>(DEMO_CHILDREN[0].id);
  const [activitySubTab, setActivitySubTab] = useState<'attendance' | 'reports' | 'exams' | 'invoices'>('attendance');
  const [savingControls, setSavingControls] = useState(false);
  const [controlsSaved, setControlsSaved] = useState(false);

  const [newChild, setNewChild] = useState({
    name: '',
    stage: 'المتوسط',
    grade: 'الأول المتوسط',
    relation: 'ابن',
    studentIdentifier: '',
    consent: false,
  });
  const [linkSuccess, setLinkSuccess] = useState(false);

  const selectedChild = children.find((c) => c.id === selectedChildId) || children[0];

  const updateSelectedControls = (patch: Partial<ChildControls>) => {
    if (!selectedChild) return;
    setChildren((prev) =>
      prev.map((c) =>
        c.id === selectedChild.id ? { ...c, controls: { ...c.controls, ...patch } } : c,
      ),
    );
  };

  const handleSaveControls = async () => {
    if (!selectedChild) return;
    setSavingControls(true);
    await api.updateChildControls(selectedChild.id, selectedChild.controls);
    setSavingControls(false);
    setControlsSaved(true);
    setTimeout(() => setControlsSaved(false), 3500);
  };

  const handleLinkChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChild.consent) return;
    const created: ChildAccount = {
      id: `ch-${Date.now()}`,
      name: newChild.name,
      stage: newChild.stage,
      grade: newChild.grade,
      relation: newChild.relation,
      consentVerified: true,
      upcomingSessions: 0,
      averageScore: 90,
      attendanceRate: 100,
      monthlySpentSar: 0,
      lastReportSummary: 'تم ربط الحساب وتوثيق موافقة ولي الأمر بنجاح. جاهز لحجز أول حصة.',
      controls: {
        monthlyBudgetLimitSar: 1000,
        requireBookingApproval: true,
        allowSessionRecording: true,
        notifyBeforeSession: true,
      },
    };
    setChildren((prev) => [...prev, created]);
    setSelectedChildId(created.id);
    setNewChild({ name: '', stage: 'المتوسط', grade: 'الأول المتوسط', relation: 'ابن', studentIdentifier: '', consent: false });
    setLinkSuccess(true);
    setTimeout(() => setLinkSuccess(false), 4000);
  };

  const budgetPct = selectedChild
    ? Math.min(100, Math.round((selectedChild.monthlySpentSar / Math.max(1, selectedChild.controls.monthlyBudgetLimitSar)) * 100))
    : 0;

  return (
    <PortalShell
      portalTitle="مركز تحكم ولي الأمر والأسرة"
      portalSubtitle="ضوابط الميزانية والموافقة لكل ابن، سجل الحضور، الاختبارات، الفواتير، والتواصل المباشر"
      roleBadge="ولي أمر"
      accent="azure"
      activeTab={tab}
      onTabChange={setTab}
      tabs={[
        { id: 'controls', label: 'ضوابط الأسرة والأبناء', icon: <Sliders className="h-4 w-4" />, badge: children.length },
        { id: 'activity', label: 'نشاط الأبناء والتقارير', icon: <FileBarChart2 className="h-4 w-4" /> },
        { id: 'conversations', label: 'المحادثات والتواصل', icon: <MessageSquare className="h-4 w-4" />, badge: 1 },
        { id: 'link', label: 'ربط ابن جديد', icon: <UserPlus className="h-4 w-4" /> },
        { id: 'invoices', label: 'الفواتير والمحفظة', icon: <Receipt className="h-4 w-4" /> },
      ]}
    >
      {/* Child Selector Strip */}
      {selectedChild && (tab === 'controls' || tab === 'activity') && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-azure-200/70 bg-white/90 p-3.5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 text-xs font-extrabold text-slate-500">اختر الابن:</span>
            {children.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedChildId(c.id)}
                className={`rounded-2xl px-4 py-2 text-xs font-extrabold transition-all ${
                  c.id === selectedChild.id
                    ? 'bg-gradient-to-l from-azure-500 to-teal-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-azure-50 hover:text-azure-700'
                }`}
              >
                {c.name} ({c.grade})
              </button>
            ))}
          </div>
          <Link href="/tutoring" className="btn-primary py-2 px-4 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            حجز حصة لـ {selectedChild.name.split(' ')[0]}
          </Link>
        </div>
      )}

      {/* FAMILY CONTROLS TAB */}
      {tab === 'controls' && selectedChild && (
        <div className="space-y-5">
          {/* Child Overview KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500">متوسط التحصيل</p>
              <p className="mt-1 font-heading text-2xl font-black text-teal-700">{selectedChild.averageScore}%</p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500">نسبة الحضور</p>
              <p className="mt-1 font-heading text-2xl font-black text-azure-600">{selectedChild.attendanceRate}%</p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500">الإنفاق الشهري</p>
              <p className="mt-1 font-heading text-2xl font-black text-amber-600">
                {selectedChild.monthlySpentSar} / {selectedChild.controls.monthlyBudgetLimitSar} ر.س
              </p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500">حالة الربط والموافقة</p>
              <p className="mt-1 flex items-center gap-1 font-heading text-base font-black text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
                موثّق ونشط
              </p>
            </div>
          </div>

          {/* Granular Controls Card */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-heading text-lg font-extrabold text-slate-900">
                  ضوابط الرقابة والميزانية — {selectedChild.name}
                </h2>
                <p className="text-xs text-slate-500">
                  تحكم كامل في سقف الإنفاق الشهري، الموافقة قبل الحجز، تسجيل الجلسات، والتنبيهات.
                </p>
              </div>
              <button
                type="button"
                disabled={savingControls}
                onClick={handleSaveControls}
                className="btn-secondary py-2.5 px-6 text-xs"
              >
                {savingControls ? 'جاري الحفظ...' : 'حفظ إعدادات الرقابة'}
              </button>
            </div>

            {controlsSaved && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                تم حفظ وتحديث ضوابط الرقابة الخاصة بـ {selectedChild.name} بنجاح!
              </div>
            )}

            {/* Monthly Budget Cap */}
            <div className="rounded-2xl border border-slate-200/80 bg-porcelain/70 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-teal-600" />
                  <span className="font-heading text-sm font-extrabold text-slate-900">
                    سقف الميزانية والإنفاق الشهري (ر.س)
                  </span>
                </div>
                <input
                  type="number"
                  min={200}
                  max={10000}
                  step={50}
                  value={selectedChild.controls.monthlyBudgetLimitSar}
                  onChange={(e) =>
                    updateSelectedControls({ monthlyBudgetLimitSar: Math.max(200, Number(e.target.value) || 200) })
                  }
                  className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-center font-mono text-sm font-extrabold text-teal-700"
                />
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    budgetPct > 85 ? 'bg-amber-500' : 'bg-gradient-to-l from-teal-600 to-azure-500'
                  }`}
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                تم استهلاك <strong>{selectedChild.monthlySpentSar} ر.س</strong> ({budgetPct}%) من السقف الشهري المحدد.
              </p>
            </div>

            {/* 3 Toggle Controls */}
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  key: 'requireBookingApproval' as const,
                  title: 'موافقة ولي الأمر قبل الحجز',
                  desc: 'لا يُؤكد أي حجز جديد للطالب إلا بعد موافقتك الفورية.',
                  icon: Lock,
                },
                {
                  key: 'allowSessionRecording' as const,
                  title: 'الموافقة على تسجيل الجلسات',
                  desc: 'تفعيل التسجيل التلقائي للجلسات للمراجعة وضمان الجودة.',
                  icon: Video,
                },
                {
                  key: 'notifyBeforeSession' as const,
                  title: 'تذكير واتساب و SMS قبل الحصة',
                  desc: 'إرسال تنبيه تلقائي قبل 30 دقيقة من موعد كل حصة.',
                  icon: Bell,
                },
              ].map((ctrl) => {
                const enabled = selectedChild.controls[ctrl.key];
                return (
                  <button
                    key={ctrl.key}
                    type="button"
                    onClick={() => updateSelectedControls({ [ctrl.key]: !enabled })}
                    className={`flex flex-col justify-between rounded-2xl border p-4 text-right transition-all ${
                      enabled
                        ? 'border-teal-400 bg-teal-50/60 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <ctrl.icon className={`h-5 w-5 ${enabled ? 'text-teal-600' : 'text-slate-400'}`} />
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                          enabled ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {enabled ? 'مفعّل' : 'متوقف'}
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="font-heading text-sm font-extrabold text-slate-900">{ctrl.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{ctrl.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DETAILED CHILD ACTIVITY TABS */}
      {tab === 'activity' && selectedChild && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'attendance' as const, label: 'سجل الحضور الحي', icon: ClipboardCheck },
              { id: 'reports' as const, label: 'تقارير الحصص وملاحظات المعلم', icon: FileBarChart2 },
              { id: 'exams' as const, label: 'درجات الاختبارات والتقييمات', icon: Award },
              { id: 'invoices' as const, label: 'استخدام المحفظة والفواتير', icon: Receipt },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setActivitySubTab(st.id)}
                className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                  activitySubTab === st.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-300'
                }`}
              >
                <st.icon className="h-3.5 w-3.5" />
                {st.label}
              </button>
            ))}
          </div>

          {activitySubTab === 'attendance' && (
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <h3 className="font-heading text-base font-extrabold text-slate-900">
                سجل الحضور — {selectedChild.name}
              </h3>
              {ATTENDANCE_LOG.filter((a) => a.childId === selectedChild.id || selectedChild.id.startsWith('ch-')).map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{a.subject} — {a.tutor}</p>
                    <p className="text-xs text-slate-500">{a.date} • المدة: {a.duration}</p>
                  </div>
                  <span className="badge-teal">{a.status}</span>
                </div>
              ))}
            </div>
          )}

          {activitySubTab === 'reports' && (
            <div className="glass-card rounded-3xl p-6">
              <h3 className="font-heading text-base font-extrabold text-slate-900">
                تقارير المعلمين — {selectedChild.name}
              </h3>
              <p className="mt-3 rounded-2xl bg-azure-50/60 p-4 text-sm leading-relaxed text-slate-700">
                {selectedChild.lastReportSummary}
              </p>
            </div>
          )}

          {activitySubTab === 'exams' && (
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <h3 className="font-heading text-base font-extrabold text-slate-900">
                درجات الاختبارات والتقييمات — {selectedChild.name}
              </h3>
              {EXAM_SCORES.map((ex) => (
                <div key={ex.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{ex.title}</p>
                    <p className="text-xs text-slate-500">{ex.date} • {ex.remark}</p>
                  </div>
                  <span className="badge-amber font-mono">
                    {ex.score} / {ex.max}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activitySubTab === 'invoices' && (
            <div className="glass-card rounded-3xl p-6 space-y-3">
              <h3 className="font-heading text-base font-extrabold text-slate-900">
                الفواتير واستخدام المحفظة
              </h3>
              {DEMO_INVOICES.map((inv) => (
                <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{inv.desc}</p>
                    <p className="text-xs text-slate-500">{inv.id} • {inv.date}</p>
                  </div>
                  <span className="font-heading font-black text-teal-700">{inv.amount} ر.س</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONVERSATIONS TAB */}
      {tab === 'conversations' && (
        <ConversationsPanel
          currentUserName="أبو سارة القحطاني"
          currentUserRole="ولي أمر"
        />
      )}

      {/* LINK A CHILD FORM */}
      {tab === 'link' && (
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <h2 className="font-heading text-xl font-black text-slate-900">
            ربط حساب ابن جديد وتوثيق الموافقة
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            يتم توثيق العلاقة والموافقة النظامية لتمكينك من حجز الحصص وضبط الميزانية ومتابعة التقارير.
          </p>

          {linkSuccess && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              تم ربط الابن بنجاح وتوثيق الموافقة!
            </div>
          )}

          <form onSubmit={handleLinkChild} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">اسم الابن / الابنة</label>
              <input
                required
                className="input-field"
                placeholder="مثال: طلال القحطاني"
                value={newChild.name}
                onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">صلة القرابة</label>
              <select
                className="input-field"
                value={newChild.relation}
                onChange={(e) => setNewChild({ ...newChild, relation: e.target.value })}
              >
                <option>ابن</option>
                <option>ابنة</option>
                <option>أخ / وصي قانوني</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">المرحلة الدراسية</label>
              <select
                className="input-field"
                value={newChild.stage}
                onChange={(e) => setNewChild({ ...newChild, stage: e.target.value })}
              >
                <option>الابتدائي</option>
                <option>المتوسط</option>
                <option>الثانوي</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">الصف الدراسي</label>
              <input
                required
                className="input-field"
                value={newChild.grade}
                onChange={(e) => setNewChild({ ...newChild, grade: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-slate-700">
                رقم جوال أو بريد الطالب (لإرسال رمز التحقق)
              </label>
              <input
                required
                dir="ltr"
                className="input-field text-right"
                placeholder="+9665XXXXXXXX"
                value={newChild.studentIdentifier}
                onChange={(e) => setNewChild({ ...newChild, studentIdentifier: e.target.value })}
              />
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50/50 p-4 sm:col-span-2">
              <input
                type="checkbox"
                required
                checked={newChild.consent}
                onChange={(e) => setNewChild({ ...newChild, consent: e.target.checked })}
                className="mt-1 h-4 w-4 rounded accent-teal-600"
              />
              <span className="text-xs leading-relaxed text-slate-700">
                أقر بصفتي ولي الأمر النظامي بموافقتي على ربط حساب الطالب والاطلاع على تقارير حضوره
                وأدائه الأكاديمي وضبط ميزانيته وإدارة الحجوزات نيابةً عنه.
              </span>
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-secondary px-8 py-3.5">
                توثيق الموافقة وربط الحساب
              </button>
            </div>
          </form>
        </div>
      )}

      {/* INVOICES */}
      {tab === 'invoices' && (
        <div className="glass-card overflow-hidden rounded-3xl">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-heading text-base font-extrabold text-slate-900">
              سجل الفواتير الضريبية والمدفوعات
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {DEMO_INVOICES.map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{inv.desc}</p>
                  <p className="text-xs text-slate-500">
                    رقم الفاتورة: <span dir="ltr">{inv.id}</span> • {inv.date}
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
    </PortalShell>
  );
}
