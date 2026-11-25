'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  CheckCircle2,
  UserCheck,
  Zap,
  Headphones,
  Calendar,
  MapPin,
  Video,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DEMO_PACKAGES, DEMO_TUTORS } from '@/lib/demo-data';
import type { BookingPath, Tutor, TutoringPackage } from '@/types';

const STAGES = ['الكل', 'الابتدائي', 'المتوسط', 'الثانوي', 'الجامعي'];
const SUBJECTS = [
  'الكل',
  'الرياضيات',
  'الفيزياء',
  'الكيمياء',
  'اللغة الإنجليزية',
  'القدرات الكمي',
  'التحصيلي',
  'لغتي',
  'البرمجة والحاسب',
];

const GRADES_BY_STAGE: Record<string, string[]> = {
  الابتدائي: ['الرابع الابتدائي', 'الخامس الابتدائي', 'السادس الابتدائي'],
  المتوسط: ['الأول المتوسط', 'الثاني المتوسط', 'الثالث المتوسط'],
  الثانوي: ['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'],
  الجامعي: ['السنة التحضيرية', 'التخصصات الهندسية', 'التخصصات العلمية'],
};

export default function TutoringPage() {
  const [tutors, setTutors] = useState<Tutor[]>(DEMO_TUTORS);
  const [packages, setPackages] = useState<TutoringPackage[]>(DEMO_PACKAGES);
  const [stageFilter, setStageFilter] = useState('الكل');
  const [subjectFilter, setSubjectFilter] = useState('الكل');

  // Interactive Booking Wizard State
  const [bookingPath, setBookingPath] = useState<BookingPath>('DIRECT');
  const [selectedTutorId, setSelectedTutorId] = useState<string>(DEMO_TUTORS[0].id);
  const [stage, setStage] = useState('الثانوي');
  const [grade, setGrade] = useState('الثالث الثانوي');
  const [subject, setSubject] = useState('الرياضيات');
  const [mode, setMode] = useState<'ONLINE' | 'IN_PERSON'>('ONLINE');
  const [preferredTime, setPreferredTime] = useState('غداً 5:00 مساءً');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<string | null>(null);
  const [selectedPkgMsg, setSelectedPkgMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getTutors().then(setTutors);
    api.getPackages().then(setPackages);
  }, []);

  const filteredTutors = useMemo(() => {
    return tutors.filter((t) => {
      const mStage = stageFilter === 'الكل' || t.stages.includes(stageFilter);
      const mSub = subjectFilter === 'الكل' || t.subjects.includes(subjectFilter);
      return mStage && mSub;
    });
  }, [tutors, stageFilter, subjectFilter]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const chosenTutor = tutors.find((t) => t.id === selectedTutorId);
    const res = await api.createLessonRequest({
      path: bookingPath,
      subject,
      stage,
      grade,
      mode,
      preferredTime,
      notes,
      tutorName: bookingPath === 'DIRECT' ? chosenTutor?.name : undefined,
      price: chosenTutor?.hourlyRate || 110,
    });
    setSubmitting(false);
    setBookingResult(res.id);
  };

  return (
    <div className="min-h-screen bg-porcelain pb-20">
      {/* Header */}
      <section className="border-b border-slate-200/70 bg-hero-gradient bg-mesh-luminous py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="badge-azure mb-3">دروس التقوية الفردية 1-on-1</span>
          <h1 className="font-heading text-3xl font-black text-slate-900 sm:text-4xl">
            احجز معلمك المعتمد بالطريقة التي تناسبك
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            اختر من بين 3 مسارات ذكية: الحجز المباشر مع معلم محدد، الطلب المفتوح للمطابقة الفورية،
            أو التنسيق عبر منسق أكاديمي خاص.
          </p>
        </div>
      </section>

      {/* INTERACTIVE 3-PATH BOOKING WIZARD */}
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="glass-card rounded-[2rem] p-6 shadow-soft-lg sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="badge-teal mb-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                معالج الحجز الذكي
              </span>
              <h2 className="font-heading text-2xl font-black text-slate-900">
                احجز درس التقوية في 3 خطوات
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              لا يتم خصم الرصيد إلا بعد تأكيد الحصة
            </div>
          </div>

          {/* Step 1: Select Path */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                id: 'DIRECT' as BookingPath,
                title: 'حجز مباشر مع معلم',
                desc: 'اختر المعلم والوقت المناسب مباشرة',
                icon: UserCheck,
              },
              {
                id: 'OPEN_AUTO_MATCH' as BookingPath,
                title: 'طلب مفتوح ذكي',
                desc: 'أسرع معلم مؤهل يقبل طلبك فوراً',
                icon: Zap,
              },
              {
                id: 'COORDINATOR' as BookingPath,
                title: 'تنسيق عبر منسق',
                desc: 'المنسق يرشح لك أفضل معلم وخطة',
                icon: Headphones,
              },
            ].map((item) => {
              const active = bookingPath === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setBookingPath(item.id);
                    setBookingResult(null);
                  }}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-right transition-all ${
                    active
                      ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-white hover:border-teal-300'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-heading text-sm font-extrabold text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Step 2: Form Details */}
          <form onSubmit={handleBookSubmit} className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">المرحلة الدراسية</label>
              <select
                value={stage}
                onChange={(e) => {
                  const next = e.target.value;
                  setStage(next);
                  setGrade(GRADES_BY_STAGE[next]?.[0] || '');
                }}
                className="input-field"
              >
                {Object.keys(GRADES_BY_STAGE).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">الصف الدراسي</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="input-field"
              >
                {(GRADES_BY_STAGE[stage] || []).map((gr) => (
                  <option key={gr} value={gr}>
                    {gr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">المادة</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-field"
              >
                {SUBJECTS.filter((s) => s !== 'الكل').map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {bookingPath === 'DIRECT' && (
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">المعلم المختار</label>
                <select
                  value={selectedTutorId}
                  onChange={(e) => setSelectedTutorId(e.target.value)}
                  className="input-field"
                >
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.hourlyRate} ر.س/ساعة)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">الموعد المفضل</label>
              <input
                type="text"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="input-field"
                placeholder="مثال: الخميس 6:00 مساءً"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">نمط الحصة</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('ONLINE')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold ${
                    mode === 'ONLINE'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <Video className="h-4 w-4" />
                  أونلاين
                </button>
                <button
                  type="button"
                  onClick={() => setMode('IN_PERSON')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold ${
                    mode === 'IN_PERSON'
                      ? 'border-amber-500 bg-sunlit-50 text-amber-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  حضوري
                </button>
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                ملاحظات أو أهداف الحصة (اختياري)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                placeholder="مثال: مراجعة الباب الثالث استعداداً للاختبار الدوري..."
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 md:col-span-2 lg:col-span-3">
              {bookingResult ? (
                <div className="flex flex-1 items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>
                    تم إرسال طلب الحجز بنجاح برقم مرجعي <strong dir="ltr">{bookingResult}</strong>!
                    {bookingPath === 'OPEN_AUTO_MATCH'
                      ? ' جاري إشعار المعلمين المؤهلين للمطابقة الفورية.'
                      : bookingPath === 'COORDINATOR'
                        ? ' سيتواصل معك المنسق الأكاديمي خلال دقائق.'
                        : ' بانتظار تأكيد المعلم للجلسة.'}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  <Calendar className="ml-1 inline h-4 w-4 text-teal-600" />
                  إلغاء مجاني واسترداد فوري للمحفظة قبل 12 ساعة من موعد الحصة.
                </p>
              )}

              <button type="submit" disabled={submitting} className="btn-primary px-8 py-3.5">
                {submitting ? 'جاري إرسال الطلب...' : 'تأكيد وإرسال طلب الحجز'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* APPROVED TUTORS DIRECTORY */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="badge-teal mb-2">دليل المعلمين المعتمدين</span>
            <h2 className="font-heading text-2xl font-black text-slate-900 sm:text-3xl">
              اختر معلمك من نخبة المتخصصين
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {STAGES.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStageFilter(st)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                  stageFilter === st
                    ? 'bg-teal-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {SUBJECTS.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSubjectFilter(sub)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                subjectFilter === sub
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-300'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTutors.map((tutor, idx) => (
            <motion.div
              key={tutor.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-soft-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-azure-500 font-heading text-lg font-black text-white">
                      {tutor.name.replace(/^أ\.\s*|^د\.\s*|^م\.\s*/, '').slice(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-heading text-base font-extrabold text-slate-900">
                        {tutor.name}
                      </h3>
                      <p className="text-xs text-slate-500">{tutor.title}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 rounded-xl bg-sunlit-50 px-2.5 py-1 text-xs font-extrabold text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {tutor.rating}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600">{tutor.bio}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tutor.subjects.map((sub) => (
                    <span
                      key={sub}
                      className="rounded-lg bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700"
                    >
                      {sub}
                    </span>
                  ))}
                  {tutor.stages.map((st) => (
                    <span
                      key={st}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <p className="font-heading text-lg font-black text-slate-900">
                    {tutor.hourlyRate} <span className="text-xs font-bold text-slate-500">ر.س/ساعة</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {tutor.sessionsCompleted} حصة مكتملة • {tutor.city}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBookingPath('DIRECT');
                    setSelectedTutorId(tutor.id);
                    setSubject(tutor.subjects[0] || 'الرياضيات');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="btn-primary py-2 px-4 text-xs"
                >
                  اختر للحجز
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PACKAGES */}
      <section id="packages" className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="badge-amber mb-2">باقات الساعات</span>
          <h2 className="font-heading text-3xl font-black text-slate-900">
            اشحن محفظتك بباقة ساعات موفرة
          </h2>
          {selectedPkgMsg && (
            <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
              {selectedPkgMsg}
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`flex flex-col justify-between rounded-3xl border p-7 ${
                pkg.popular
                  ? 'border-teal-400 bg-gradient-to-b from-teal-50/70 via-white to-white shadow-soft-lg'
                  : 'border-slate-200/80 bg-white shadow-soft'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-xl font-extrabold text-slate-900">{pkg.name}</h3>
                  <span className="badge-amber">وفر {pkg.savingsPercent}%</span>
                </div>
                <p className="mt-4 font-heading text-3xl font-black text-slate-900">
                  {pkg.price.toLocaleString('ar-SA')} <span className="text-sm font-bold text-slate-500">ر.س</span>
                </p>
                <p className="text-xs font-bold text-teal-700">
                  {pkg.hours} ساعات ({pkg.pricePerHour} ر.س للساعة)
                </p>
                <ul className="mt-5 space-y-2.5 text-sm text-slate-600">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSelectedPkgMsg(
                    `تم اختيار "${pkg.name}" (${pkg.price.toLocaleString('ar-SA')} ر.س). يمكنك إتمام الشحن من بوابة الطالب أو حجز حصتك الأولى الآن!`,
                  )
                }
                className={`mt-6 w-full ${pkg.popular ? 'btn-primary' : 'btn-outline'}`}
              >
                اختيار الباقة وشحن الرصيد
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
