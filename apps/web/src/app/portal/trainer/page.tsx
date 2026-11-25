'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  ClipboardCheck,
  Award,
  CheckCircle2,
  Users,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { PortalShell } from '@/components/PortalShell';
import { ConversationsPanel } from '@/components/ConversationsPanel';
import { DEMO_COURSES } from '@/lib/demo-data';

interface TraineeRow {
  id: string;
  name: string;
  attendance: 'PRESENT' | 'ABSENT' | 'LATE';
  assignmentScore: number;
  projectStatus: string;
}

const INITIAL_TRAINEES: TraineeRow[] = [
  { id: 'tr-1', name: 'فيصل سعد العتيبي', attendance: 'PRESENT', assignmentScore: 96, projectStatus: 'تم التسليم' },
  { id: 'tr-2', name: 'نورة محمد القحطاني', attendance: 'PRESENT', assignmentScore: 94, projectStatus: 'تم التسليم' },
  { id: 'tr-3', name: 'خالد عبدالله الشهري', attendance: 'LATE', assignmentScore: 88, projectStatus: 'قيد المراجعة' },
  { id: 'tr-4', name: 'سارة فهد الدوسري', attendance: 'ABSENT', assignmentScore: 82, projectStatus: 'تم التسليم' },
];

export default function TrainerPortalPage() {
  const [tab, setTab] = useState('cohorts');
  const [trainees, setTrainees] = useState<TraineeRow[]>(INITIAL_TRAINEES);
  const [savedNotice, setSavedNotice] = useState(false);

  const setStatus = (id: string, attendance: TraineeRow['attendance']) => {
    setTrainees((prev) => prev.map((t) => (t.id === id ? { ...t, attendance } : t)));
  };

  const setScore = (id: string, score: number) => {
    setTrainees((prev) =>
      prev.map((t) => (t.id === id ? { ...t, assignmentScore: Math.min(100, Math.max(0, score)) } : t)),
    );
  };

  return (
    <PortalShell
      portalTitle="بوابة المدرب المهني"
      portalSubtitle="إدارة الدورات والدفعات، رصد الحضور، والواجبات والدرجات"
      roleBadge="مدرب مهني"
      accent="amber"
      activeTab={tab}
      onTabChange={setTab}
      tabs={[
        { id: 'cohorts', label: 'دوراتي ودفعاتي', icon: <BookOpen className="h-4 w-4" />, badge: 2 },
        { id: 'attendance', label: 'رصد الحضور', icon: <ClipboardCheck className="h-4 w-4" /> },
        { id: 'grades', label: 'الواجبات والدرجات', icon: <Award className="h-4 w-4" /> },
        { id: 'conversations', label: 'المحادثات والتواصل', icon: <MessageSquare className="h-4 w-4" /> },
      ]}
    >
      {/* ASSIGNED COURSES & COHORTS */}
      {tab === 'cohorts' && (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-extrabold text-slate-900">
            الدورات والدفعات المسندة لك
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {DEMO_COURSES.slice(0, 2).map((course) => (
              <div key={course.id} className="glass-card rounded-3xl p-6">
                <span className="badge-amber">{course.cohorts[0]?.name}</span>
                <h3 className="mt-3 font-heading text-base font-extrabold text-slate-900">
                  {course.title}
                </h3>
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-amber-600" />
                    {course.cohorts[0]?.schedule}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-teal-600" />
                    المسجلون: {(course.cohorts[0]?.seatsTotal || 30) - (course.cohorts[0]?.seatsRemaining || 6)} متدرب
                  </p>
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTab('attendance')}
                    className="btn-amber flex-1 py-2 text-xs"
                  >
                    رصد حضور الجلسة
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('grades')}
                    className="btn-outline flex-1 py-2 text-xs"
                  >
                    الدرجات
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ATTENDANCE TRACKER */}
      {tab === 'attendance' && (
        <div className="glass-card rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-heading text-lg font-extrabold text-slate-900">
                كشف الحضور — الدفعة 18 (إدارة المشاريع PMP)
              </h2>
              <p className="text-xs text-slate-500">الجلسة رقم 6 • تحليل المخاطر والقيمة المكتسبة</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSavedNotice(true);
                setTimeout(() => setSavedNotice(false), 3000);
              }}
              className="btn-primary py-2 px-5 text-xs"
            >
              حفظ كشف الحضور
            </button>
          </div>

          {savedNotice && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              تم حفظ سجل الحضور بنجاح وتحديث نسب الإنجاز.
            </div>
          )}

          <div className="mt-4 divide-y divide-slate-100">
            {trainees.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <p className="text-sm font-bold text-slate-900">{t.name}</p>
                <div className="flex gap-2">
                  {(
                    [
                      { id: 'PRESENT', label: 'حاضر', activeCls: 'bg-emerald-600 text-white' },
                      { id: 'LATE', label: 'متأخر', activeCls: 'bg-amber-500 text-white' },
                      { id: 'ABSENT', label: 'غائب', activeCls: 'bg-rose-600 text-white' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStatus(t.id, opt.id)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                        t.attendance === opt.id
                          ? opt.activeCls
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ASSIGNMENTS & GRADES */}
      {tab === 'grades' && (
        <div className="glass-card rounded-3xl p-6">
          <h2 className="font-heading text-lg font-extrabold text-slate-900">
            تقييم الواجبات ومشاريع التخرج
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            يتم إصدار الشهادة تلقائياً للمتدرب عند اجتياز 80% في الحضور والتقييم النهائي.
          </p>

          <div className="mt-5 space-y-3">
            {trainees.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
              >
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">حالة المشروع: {t.projectStatus}</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-slate-600">الدرجة (من 100):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={t.assignmentScore}
                    onChange={(e) => setScore(t.id, Number(e.target.value))}
                    className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-center font-mono text-sm font-extrabold text-teal-700"
                  />
                  <span className={t.assignmentScore >= 80 ? 'badge-teal' : 'badge-amber'}>
                    {t.assignmentScore >= 80 ? 'مؤهل للشهادة' : 'يحتاج متابعة'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* CONVERSATIONS */}
      {tab === 'conversations' && (
        <ConversationsPanel currentUserName="م. خالد الدوسري" currentUserRole="مدرب مهني" />
      )}
    </PortalShell>
  );
}
