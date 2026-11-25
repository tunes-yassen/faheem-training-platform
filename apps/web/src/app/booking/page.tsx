'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle2,
  UserCheck,
  Zap,
  Headphones,
  BookOpen,
  Users,
  Video,
  MapPin,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DEMO_COURSES, DEMO_TUTORS } from '@/lib/demo-data';
import type { BookingPath, Course, Tutor } from '@/types';

const STAGES = ['الابتدائي', 'المتوسط', 'الثانوي', 'الجامعي'];
const SUBJECTS = ['الرياضيات', 'الفيزياء', 'الكيمياء', 'اللغة الإنجليزية', 'القدرات الكمي', 'التحصيلي', 'لغتي', 'البرمجة والحاسب'];

export default function BookingPage() {
  const [bookingType, setBookingType] = useState<'TUTORING' | 'COURSE'>('TUTORING');
  const [tutors, setTutors] = useState<Tutor[]>(DEMO_TUTORS);
  const [courses, setCourses] = useState<Course[]>(DEMO_COURSES);

  // Tutoring booking state
  const [path, setPath] = useState<BookingPath>('DIRECT');
  const [selectedTutorId, setSelectedTutorId] = useState(DEMO_TUTORS[0].id);
  const [stage, setStage] = useState('الثانوي');
  const [subject, setSubject] = useState('الرياضيات');
  const [mode, setMode] = useState<'ONLINE' | 'IN_PERSON'>('ONLINE');
  const [preferredTime, setPreferredTime] = useState('غداً 5:00 مساءً');
  const [notes, setNotes] = useState('');

  // Course booking state
  const [selectedCourseId, setSelectedCourseId] = useState(DEMO_COURSES[0].id);
  const [selectedCohortId, setSelectedCohortId] = useState(DEMO_COURSES[0].cohorts[0]?.id || '');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getTutors().then((list) => {
      setTutors(list);
      if (list[0]) setSelectedTutorId(list[0].id);
    });
    api.getCourses().then((list) => {
      setCourses(list);
      if (list[0]) {
        setSelectedCourseId(list[0].id);
        setSelectedCohortId(list[0].cohorts[0]?.id || '');
      }
    });
  }, []);

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const handleTutoringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const tutor = tutors.find((t) => t.id === selectedTutorId);
    const res = await api.createLessonRequest({
      path,
      subject,
      stage,
      grade: stage,
      mode,
      preferredTime,
      notes,
      tutorName: path === 'DIRECT' ? tutor?.name : undefined,
      price: tutor?.hourlyRate || 110,
    });
    setSubmitting(false);
    setSuccessMsg(`تم تأكيد وإرسال طلب حجز درس التقوية بنجاح! الرقم المرجعي: ${res.id}`);
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await api.enrollInCourse(selectedCohortId || activeCourse?.cohorts[0]?.id || '');
    setSubmitting(false);
    setSuccessMsg(`${res.message} — الدورة: ${activeCourse?.title || ''}`);
  };

  return (
    <div className="min-h-screen bg-porcelain pb-20">
      <section className="border-b border-slate-200/70 bg-hero-gradient bg-mesh-luminous py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <span className="badge-teal mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            مركز الحجز الموحد — منصة فهيم
          </span>
          <h1 className="font-heading text-3xl font-black text-slate-900 sm:text-4xl">
            احجز درس التقوية أو مقعد دورتك المهنية الآن
          </h1>
          <p className="mt-2 text-slate-600">
            حجز فوري وشفاف مع ضمان استرداد الرصيد وتوثيق كامل عبر بوابة الطالب والمتدرب.
          </p>

          {/* Toggle Tutoring vs Course */}
          <div className="mx-auto mt-7 grid max-w-md grid-cols-2 gap-2 rounded-2xl bg-white/90 p-1.5 shadow-soft border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setBookingType('TUTORING');
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-extrabold transition-all ${
                bookingType === 'TUTORING'
                  ? 'bg-gradient-to-l from-teal-600 to-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="h-4 w-4" />
              حجز درس تقوية
            </button>
            <button
              type="button"
              onClick={() => {
                setBookingType('COURSE');
                setSuccessMsg(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-extrabold transition-all ${
                bookingType === 'COURSE'
                  ? 'bg-gradient-to-l from-azure-500 to-teal-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              حجز دورة مهنية
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pt-10 sm:px-6">
        <div className="glass-card rounded-[2rem] p-6 shadow-soft-lg sm:p-8">
          {successMsg && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                {successMsg}
              </span>
              <Link
                href={bookingType === 'TUTORING' ? '/portal/student' : '/portal/trainee'}
                className="btn-primary py-2 px-4 text-xs"
              >
                متابعة في بوابتك
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {bookingType === 'TUTORING' ? (
            <form onSubmit={handleTutoringSubmit} className="space-y-6">
              <div>
                <p className="mb-2.5 text-xs font-extrabold text-slate-700">1. اختر مسار الحجز:</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { id: 'DIRECT' as BookingPath, title: 'حجز مباشر مع معلم', desc: 'اختر معلمك بنفسك', icon: UserCheck },
                    { id: 'OPEN_AUTO_MATCH' as BookingPath, title: 'طلب مفتوح ذكي', desc: 'مطابقة فورية ذرية', icon: Zap },
                    { id: 'COORDINATOR' as BookingPath, title: 'تنسيق عبر منسق', desc: 'اختيار مخصص لك', icon: Headphones },
                  ].map((item) => {
                    const active = path === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPath(item.id)}
                        className={`flex items-start gap-3 rounded-2xl border p-4 text-right transition-all ${
                          active ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <item.icon className={`h-5 w-5 shrink-0 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">{item.title}</p>
                          <p className="text-[11px] text-slate-500">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">المرحلة الدراسية</label>
                  <select value={stage} onChange={(e) => setStage(e.target.value)} className="input-field">
                    {STAGES.map((st) => (
                      <option key={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">المادة</label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field">
                    {SUBJECTS.map((sub) => (
                      <option key={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {path === 'DIRECT' && (
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-slate-700">المعلم المعتمد</label>
                    <select
                      value={selectedTutorId}
                      onChange={(e) => setSelectedTutorId(e.target.value)}
                      className="input-field"
                    >
                      {tutors.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {t.subjects[0]} ({t.hourlyRate} ر.س / ساعة)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">الموعد المفضل</label>
                  <input
                    required
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">نمط الحضور</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('ONLINE')}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold ${
                        mode === 'ONLINE' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <Video className="h-4 w-4" />
                      أونلاين
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('IN_PERSON')}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold ${
                        mode === 'IN_PERSON' ? 'border-amber-500 bg-sunlit-50 text-amber-700' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                      حضوري
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-700">ملاحظات إضافية</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="اكتب أهداف الحصة أو الدروس المطلوب مراجعتها..."
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  إلغاء مجاني واسترداد فوري قبل 12 ساعة
                </p>
                <button type="submit" disabled={submitting} className="btn-primary px-8 py-3.5">
                  <Calendar className="h-4 w-4" />
                  {submitting ? 'جاري تأكيد الحجز...' : 'تأكيد حجز درس التقوية'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCourseSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">اختر الدورة المهنية</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedCourseId(nextId);
                    const found = courses.find((c) => c.id === nextId);
                    setSelectedCohortId(found?.cohorts[0]?.id || '');
                  }}
                  className="input-field"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.price.toLocaleString('ar-SA')} ر.س — {c.hours} ساعة)
                    </option>
                  ))}
                </select>
              </div>

              {activeCourse && (
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700">اختر الدفعة المتاحة</label>
                  {activeCourse.cohorts.map((coh) => (
                    <button
                      key={coh.id}
                      type="button"
                      onClick={() => setSelectedCohortId(coh.id)}
                      className={`w-full rounded-2xl border p-4 text-right transition-all ${
                        (selectedCohortId || activeCourse.cohorts[0]?.id) === coh.id
                          ? 'border-azure-500 bg-azure-50/70 ring-2 ring-azure-500/20'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-slate-900">{coh.name}</span>
                        <span className="badge-teal">{coh.startDate}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {coh.schedule} • {coh.locationOrPlatform}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                <p className="font-heading text-xl font-black text-slate-900">
                  الإجمالي: {activeCourse?.price.toLocaleString('ar-SA')}{' '}
                  <span className="text-xs font-bold text-slate-500">ر.س شامل الضريبة</span>
                </p>
                <button type="submit" disabled={submitting} className="btn-secondary px-8 py-3.5">
                  {submitting ? 'جاري التسجيل...' : 'تأكيد التسجيل وحجز المقعد'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
