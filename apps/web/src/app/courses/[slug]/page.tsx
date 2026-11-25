'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Clock,
  Star,
  Award,
  CheckCircle2,
  Calendar,
  MapPin,
  Video,
  PlayCircle,
  Users,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DEMO_COURSES } from '@/lib/demo-data';
import type { Course } from '@/types';

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || '';
  const [course, setCourse] = useState<Course | undefined>(() =>
    DEMO_COURSES.find((c) => c.slug === slug) || DEMO_COURSES[0],
  );
  const [selectedCohort, setSelectedCohort] = useState<string>('');
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.getCourseBySlug(slug).then((found) => {
      if (found) {
        setCourse(found);
        setSelectedCohort(found.cohorts[0]?.id || '');
      }
    });
  }, [slug]);

  useEffect(() => {
    if (course && !selectedCohort && course.cohorts[0]) {
      setSelectedCohort(course.cohorts[0].id);
    }
  }, [course, selectedCohort]);

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold">الدورة غير موجودة</h1>
        <Link href="/courses" className="btn-primary mt-6">
          العودة لجميع الدورات
        </Link>
      </div>
    );
  }

  const formatLabel =
    course.format === 'IN_PERSON'
      ? 'حضوري'
      : course.format === 'LIVE_ONLINE'
        ? 'أونلاين مباشر'
        : 'مسجل ذاتياً';

  return (
    <div className="min-h-screen bg-porcelain pb-20">
      {/* Top Hero */}
      <section className="border-b border-slate-200/70 bg-hero-gradient bg-mesh-luminous py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/courses"
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:underline"
          >
            <ArrowRight className="h-4 w-4" />
            العودة لكتالوج الدورات
          </Link>

          <div className="grid gap-10 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-teal">{formatLabel}</span>
                <span className="badge-azure">{course.category}</span>
                {course.ncelAccredited && (
                  <span className="badge-amber">
                    <Award className="h-3.5 w-3.5" />
                    شهادة معتمدة QR / NCEL
                  </span>
                )}
              </div>

              <h1 className="font-heading text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
                {course.title}
              </h1>
              <p className="text-base leading-relaxed text-slate-600">{course.subtitle}</p>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-sm text-slate-600">
                <span className="flex items-center gap-1.5 font-bold text-amber-600">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {course.rating} ({course.studentsCount.toLocaleString('ar-SA')} متدرب)
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-teal-600" />
                  {course.hours} ساعة تدريبية
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-azure-600" />
                  المستوى: {course.level}
                </span>
              </div>
            </div>

            {/* Enrollment Sidebar Card */}
            <div className="lg:col-span-4">
              <div className="glass-card rounded-3xl p-6 shadow-soft-lg">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="font-heading text-3xl font-black text-slate-900">
                      {course.price.toLocaleString('ar-SA')}{' '}
                      <span className="text-sm font-bold text-slate-500">ر.س</span>
                    </span>
                    {course.originalPrice && (
                      <span className="mr-2 text-sm text-slate-400 line-through">
                        {course.originalPrice.toLocaleString('ar-SA')} ر.س
                      </span>
                    )}
                  </div>
                  <span className="badge-teal">شامل الضريبة</span>
                </div>

                {/* Cohort Selector */}
                <div className="mt-5 space-y-2.5">
                  <p className="text-xs font-extrabold text-slate-700">اختر الدفعة / الموعد:</p>
                  {course.cohorts.map((coh) => (
                    <button
                      key={coh.id}
                      type="button"
                      onClick={() => setSelectedCohort(coh.id)}
                      className={`w-full rounded-2xl border p-3.5 text-right transition-all ${
                        selectedCohort === coh.id
                          ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20'
                          : 'border-slate-200 bg-white hover:border-teal-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">{coh.name}</span>
                        <span className="text-[11px] font-bold text-emerald-600">
                          {coh.seatsRemaining > 100
                            ? 'متاح فوراً'
                            : `متبقي ${coh.seatsRemaining} مقاعد`}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        <Calendar className="ml-1 inline h-3 w-3" />
                        {coh.schedule}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {course.format === 'IN_PERSON' ? (
                          <MapPin className="ml-1 inline h-3 w-3" />
                        ) : course.format === 'LIVE_ONLINE' ? (
                          <Video className="ml-1 inline h-3 w-3" />
                        ) : (
                          <PlayCircle className="ml-1 inline h-3 w-3" />
                        )}
                        {coh.locationOrPlatform}
                      </p>
                    </button>
                  ))}
                </div>

                {enrolled ? (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
                    <p className="mt-2 font-heading text-sm font-extrabold text-emerald-900">
                      تم حجز مقعدك بنجاح!
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                      يمكنك متابعة المحاضرات والمواد التدريبية مباشرة من بوابة الطالب.
                    </p>
                    <Link href="/portal/trainee" className="btn-primary mt-3 w-full py-2.5 text-xs">
                      الذهاب إلى بوابة المتدرب المهني
                    </Link>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await api.enrollInCourse(selectedCohort || course.cohorts[0]?.id || '');
                      setEnrolled(true);
                    }}
                    className="btn-primary mt-6 w-full py-3.5 text-sm"
                  >
                    تأكيد التسجيل وحجز المقعد
                  </button>
                )}

                <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  دفع إلكتروني آمن + ضمان استرداد وفق سياسة المنصة
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content & Trainer */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            {/* Highlights */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft sm:p-8">
              <h2 className="font-heading text-xl font-extrabold text-slate-900">
                ماذا ستحقق في هذه الدورة؟
              </h2>
              <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
                {course.highlights.map((h) => (
                  <div key={h} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft sm:p-8">
              <h2 className="font-heading text-xl font-extrabold text-slate-900">
                محاور ومنهج الدورة
              </h2>
              <div className="mt-5 space-y-4">
                {course.curriculum.map((mod, idx) => (
                  <div
                    key={mod.title}
                    className="rounded-2xl border border-slate-200/80 bg-porcelain/70 p-5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-heading text-base font-extrabold text-slate-900">
                        {idx + 1}. {mod.title}
                      </h3>
                      <span className="badge-teal">{mod.duration}</span>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      {mod.lessons.map((lesson) => (
                        <li key={lesson} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                          <span>{lesson}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trainer Card */}
          <div className="lg:col-span-4">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
              <span className="badge-azure mb-3">المدرب المعتمد</span>
              <div className="flex items-center gap-3.5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-azure-500 font-heading text-xl font-black text-white shadow-sm">
                  {course.trainer.name.replace(/^م\.\s*|^د\.\s*|^أ\.\s*/, '').slice(0, 1)}
                </div>
                <div>
                  <h3 className="font-heading text-lg font-extrabold text-slate-900">
                    {course.trainer.name}
                  </h3>
                  <p className="text-xs text-slate-500">{course.trainer.title}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">{course.trainer.bio}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-center">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-heading text-lg font-black text-teal-700">
                    +{course.trainer.experienceYears} سنة
                  </p>
                  <p className="text-[11px] text-slate-500">خبرة عملية</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="font-heading text-lg font-black text-amber-600">
                    {course.trainer.rating} ★
                  </p>
                  <p className="text-[11px] text-slate-500">تقييم المتدربين</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
