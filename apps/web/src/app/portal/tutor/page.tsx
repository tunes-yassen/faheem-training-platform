'use client';

import React, { useEffect, useState } from 'react';
import {
  Zap,
  Calendar,
  FileText,
  Wallet,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  MessageSquare,
} from 'lucide-react';
import { PortalShell } from '@/components/PortalShell';
import { ConversationsPanel } from '@/components/ConversationsPanel';
import { DEMO_LESSON_REQUESTS } from '@/lib/demo-data';
import { api } from '@/lib/api';
import type { LessonRequest } from '@/types';

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'السبت'];
const SLOTS = ['4:00 م', '5:00 م', '6:00 م', '7:00 م', '8:00 م'];

export default function TutorPortalPage() {
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState<LessonRequest[]>(DEMO_LESSON_REQUESTS);
  const [toast, setToast] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<string, boolean>>({
    'الأحد-5:00 م': true,
    'الأحد-7:00 م': true,
    'الثلاثاء-6:00 م': true,
    'الأربعاء-5:00 م': true,
    'الخميس-6:00 م': true,
  });
  const [reportText, setReportText] = useState('');
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    api.getLessonRequests().then(setRequests);
  }, []);

  const handleAccept = async (id: string) => {
    const res = await api.acceptLessonRequest(id);
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'CONFIRMED', tutorName: 'أ. نورة الشمري' } : r)),
    );
    setToast(res.message);
    setTimeout(() => setToast(null), 4000);
  };

  const handleDecline = (id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r)));
  };

  const toggleSlot = (key: string) => {
    setAvailability((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <PortalShell
      portalTitle="بوابة معلم التقوية"
      portalSubtitle="استقبال الطلبات الذرية، إدارة جدول التوافر، التقارير، والأرباح"
      roleBadge="معلم معتمد"
      accent="teal"
      activeTab={tab}
      onTabChange={setTab}
      tabs={[
        { id: 'requests', label: 'الطلبات الواردة', icon: <Zap className="h-4 w-4" />, badge: pendingCount },
        { id: 'availability', label: 'جدول التوافر', icon: <Calendar className="h-4 w-4" /> },
        { id: 'reports', label: 'تقارير الحصص', icon: <FileText className="h-4 w-4" /> },
        { id: 'earnings', label: 'الأرباح والتسويات', icon: <Wallet className="h-4 w-4" /> },
        { id: 'conversations', label: 'المحادثات والتواصل', icon: <MessageSquare className="h-4 w-4" /> },
        { id: 'profile', label: 'ملفي المهني', icon: <UserCheck className="h-4 w-4" /> },
      ]}
    >
      {toast && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm font-bold text-emerald-800 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* INCOMING REQUESTS */}
      {tab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              الطلبات المفتوحة والمباشرة الواردة
            </h2>
            <span className="badge-teal">قبول ذري فوري Atomic Accept</span>
          </div>

          {requests.map((req) => (
            <div key={req.id} className="glass-card rounded-3xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={req.path === 'OPEN_AUTO_MATCH' ? 'badge-amber' : req.path === 'DIRECT' ? 'badge-teal' : 'badge-azure'}>
                      {req.path === 'OPEN_AUTO_MATCH'
                        ? 'طلب مفتوح ذكي'
                        : req.path === 'DIRECT'
                          ? 'حجز مباشر'
                          : 'تنسيق منسق'}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-400">{req.id}</span>
                    <span className="text-xs text-slate-500">{req.createdAt}</span>
                  </div>
                  <h3 className="font-heading text-base font-extrabold text-slate-900">
                    {req.subject} — {req.grade} ({req.studentName})
                  </h3>
                  <p className="flex items-center gap-2 text-xs text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-teal-600" />
                    الموعد المطلوب: <strong>{req.preferredTime}</strong> •{' '}
                    {req.mode === 'ONLINE' ? 'أونلاين' : 'حضوري'}
                  </p>
                  {req.notes && <p className="text-xs text-slate-500">ملاحظة: {req.notes}</p>}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <p className="font-heading text-lg font-black text-teal-700">{req.price} ر.س</p>
                  {req.status === 'PENDING' ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAccept(req.id)}
                        className="btn-primary py-2 px-4 text-xs"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        قبول فوري
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecline(req.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <span className={req.status === 'CONFIRMED' ? 'badge-teal' : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500'}>
                      {req.status === 'CONFIRMED' ? 'تم القبول وتثبيت الحجز' : 'مرفوض / ملغي'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AVAILABILITY BUILDER */}
      {tab === 'availability' && (
        <div className="glass-card rounded-3xl p-6">
          <h2 className="font-heading text-lg font-extrabold text-slate-900">
            منشئ جدول التوافر الأسبوعي
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            اضغط على الفترات الزمنية لتفعيل أو إيقاف استقبال الحجوزات فيها.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[540px] border-separate border-spacing-2 text-center text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-right font-bold text-slate-500">اليوم</th>
                  {SLOTS.map((slot) => (
                    <th key={slot} className="p-2 font-bold text-slate-700">
                      {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day}>
                    <td className="p-2 text-right font-extrabold text-slate-800">{day}</td>
                    {SLOTS.map((slot) => {
                      const key = `${day}-${slot}`;
                      const on = Boolean(availability[key]);
                      return (
                        <td key={key}>
                          <button
                            type="button"
                            onClick={() => toggleSlot(key)}
                            className={`w-full rounded-xl py-2.5 font-bold transition-all ${
                              on
                                ? 'bg-teal-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {on ? 'متاح' : '—'}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SESSION REPORTS */}
      {tab === 'reports' && (
        <div className="glass-card rounded-3xl p-6">
          <h2 className="font-heading text-lg font-extrabold text-slate-900">
            رفع تقرير حصة مكتملة
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            يصل التقرير مباشرة للطالب وولي الأمر بعد اعتماده.
          </p>
          {reportSent && (
            <div className="mt-4 rounded-2xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-700">
              تم إرسال تقرير الحصة للطالب وولي الأمر بنجاح!
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setReportSent(true);
              setReportText('');
            }}
            className="mt-5 space-y-4"
          >
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">اختر الحصة</label>
              <select className="input-field">
                <option>حصة الرياضيات — فيصل العتيبي (اليوم 5:00 م)</option>
                <option>حصة القدرات الكمي — سارة القحطاني (أمس 6:30 م)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">ملخص الأداء والتوصيات</label>
              <textarea
                required
                rows={4}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                className="input-field"
                placeholder="اكتب نقاط القوة، المهارات المتقنة، والواجب المقترح للجلسة القادمة..."
              />
            </div>
            <button type="submit" className="btn-primary px-6 py-3 text-xs">
              إرسال وحفظ التقرير
            </button>
          </form>
        </div>
      )}

      {/* EARNINGS */}
      {tab === 'earnings' && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-card rounded-2xl p-5">
              <p className="text-xs font-bold text-slate-500">أرباح هذا الشهر</p>
              <p className="mt-1 font-heading text-2xl font-black text-teal-700">4,620 ر.س</p>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <p className="text-xs font-bold text-slate-500">قيد التسوية</p>
              <p className="mt-1 font-heading text-2xl font-black text-amber-600">880 ر.س</p>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <p className="text-xs font-bold text-slate-500">الحصص المنجزة</p>
              <p className="mt-1 font-heading text-2xl font-black text-azure-600">42 حصة</p>
            </div>
          </div>
          <div className="glass-card rounded-3xl p-6">
            <h3 className="font-heading text-base font-extrabold text-slate-900">آخر التسويات البنكية</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <div>
                  <p className="font-bold text-slate-900">تسوية أسبوعية — 15 نوفمبر 2026</p>
                  <p className="text-xs text-slate-500">حوالة بنكية IBAN •••• 4412</p>
                </div>
                <span className="font-heading font-black text-emerald-600">+2,150 ر.س</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                <div>
                  <p className="font-bold text-slate-900">تسوية أسبوعية — 01 نوفمبر 2026</p>
                  <p className="text-xs text-slate-500">حوالة بنكية IBAN •••• 4412</p>
                </div>
                <span className="font-heading font-black text-emerald-600">+1,890 ر.س</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONVERSATIONS */}
      {tab === 'conversations' && (
        <ConversationsPanel currentUserName="أ. نورة الشمري" currentUserRole="معلم تقوية" />
      )}

      {/* PROFILE */}
      {tab === 'profile' && (
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-black text-slate-900">أ. نورة الشمري</h2>
              <p className="text-xs text-slate-500">معلمة رياضيات وقدرات كمي • الرياض</p>
            </div>
            <span className="badge-teal">
              <Star className="h-3.5 w-3.5 fill-teal-600" />
              تقييم 4.96 (184 تقييم)
            </span>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            حسابك معتمد بالكامل ويمكنك استقبال الطلبات المباشرة والمفتوحة. نسبة عمولة المنصة
            الفعالة: 15% وفق السياسة المعتمدة.
          </p>
        </div>
      )}
    </PortalShell>
  );
}
