'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Clock,
  Star,
  MapPin,
  Video,
  PlayCircle,
  Award,
  ArrowLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DEMO_COURSES } from '@/lib/demo-data';
import type { Course, CourseFormat } from '@/types';

const FORMAT_TABS: { id: 'ALL' | CourseFormat; label: string }[] = [
  { id: 'ALL', label: 'جميع الأنماط' },
  { id: 'LIVE_ONLINE', label: 'أونلاين مباشر' },
  { id: 'IN_PERSON', label: 'حضوري' },
  { id: 'RECORDED', label: 'مسجل ذاتياً' },
];

const FORMAT_META: Record<CourseFormat, { label: string; icon: typeof Video; badge: string }> = {
  LIVE_ONLINE: { label: 'أونلاين مباشر', icon: Video, badge: 'badge-teal' },
  IN_PERSON: { label: 'حضوري', icon: MapPin, badge: 'badge-amber' },
  RECORDED: { label: 'مسجل ذاتياً', icon: PlayCircle, badge: 'badge-azure' },
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>(DEMO_COURSES);
  const [format, setFormat] = useState<'ALL' | CourseFormat>('ALL');
  const [category, setCategory] = useState<string>('الكل');
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.getCourses().then(setCourses);
  }, []);

  const categories = useMemo(
    () => ['الكل', ...Array.from(new Set(courses.map((c) => c.category)))],
    [courses],
  );

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchFormat = format === 'ALL' || c.format === format;
      const matchCat = category === 'الكل' || c.category === category;
      const matchQuery =
        !query.trim() ||
        c.title.includes(query.trim()) ||
        c.subtitle.includes(query.trim()) ||
        c.trainer.name.includes(query.trim());
      return matchFormat && matchCat && matchQuery;
    });
  }, [courses, format, category, query]);

  return (
    <div className="min-h-screen bg-porcelain pb-20">
      {/* Header Banner */}
      <section className="border-b border-slate-200/70 bg-hero-gradient bg-mesh-luminous py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className="badge-teal mb-3">أكاديمية فهيم المهنية</span>
          <h1 className="font-heading text-3xl font-black text-slate-900 sm:text-4xl">
            الدورات المهنية المعتمدة
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            اختر مسارك المهني من بين دورات حضورية، أونلاين مباشرة، أو مسجلة ذاتياً مع نخبة
            المدربين المعتمدين وشهادات قابلة للتحقق الفوري.
          </p>

          {/* Search & Filters */}
          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن دورة، مهارة، أو مدرب..."
                className="input-field pr-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {FORMAT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormat(tab.id)}
                  className={`rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                    format === tab.id
                      ? 'bg-gradient-to-l from-teal-600 to-emerald-500 text-white shadow-teal-glow'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              التخصص:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  category === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog Grid */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <p className="mb-6 text-sm font-semibold text-slate-500">
          عرض <span className="font-extrabold text-slate-900">{filtered.length}</span> دورة تدريبية
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <p className="font-heading text-lg font-bold text-slate-800">
              لم نعثر على دورات مطابقة لخيارات البحث الحالية
            </p>
            <button
              type="button"
              onClick={() => {
                setFormat('ALL');
                setCategory('الكل');
                setQuery('');
              }}
              className="btn-outline mt-4"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course, idx) => {
              const meta = FORMAT_META[course.format] || FORMAT_META.LIVE_ONLINE;
              const Icon = meta.icon;
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft transition-all hover:-translate-y-1 hover:shadow-soft-lg"
                >
                  <div>
                    <div
                      className={`p-6 ${
                        course.accent === 'azure'
                          ? 'bg-gradient-to-br from-azure-50 via-white to-teal-50/40'
                          : course.accent === 'amber'
                            ? 'bg-gradient-to-br from-sunlit-50 via-white to-amber-50/40'
                            : 'bg-gradient-to-br from-teal-50 via-white to-emerald-50/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={meta.badge}>
                          <Icon className="h-3.5 w-3.5" />
                          {meta.label}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 shadow-sm">
                          {course.category}
                        </span>
                      </div>
                      <h2 className="mt-4 font-heading text-lg font-extrabold leading-snug text-slate-900 group-hover:text-teal-700">
                        {course.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">
                        {course.subtitle}
                      </p>
                    </div>

                    <div className="space-y-3 p-6 pt-4">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-teal-600" />
                          {course.hours} ساعة • {course.level}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {course.rating}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{course.trainer.name}</span>
                        {course.ncelAccredited && (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                            <Award className="h-3.5 w-3.5" />
                            شهادة QR معتمدة
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                    <div>
                      <span className="font-heading text-xl font-black text-slate-900">
                        {course.price.toLocaleString('ar-SA')}{' '}
                        <span className="text-xs font-bold text-slate-500">ر.س</span>
                      </span>
                      {course.originalPrice && (
                        <span className="mr-2 text-xs text-slate-400 line-through">
                          {course.originalPrice.toLocaleString('ar-SA')}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/courses/${course.slug}`}
                      className="btn-primary py-2 px-4 text-xs"
                    >
                      <span>التفاصيل والتسجيل</span>
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
