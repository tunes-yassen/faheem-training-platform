'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  BookOpen,
  Users,
  ShieldCheck,
  Award,
  Clock,
  Star,
  CheckCircle2,
  ArrowLeft,
  Zap,
  Headphones,
  UserCheck,
  ChevronDown,
  Video,
  MapPin,
  PlayCircle,
  TrendingUp,
} from 'lucide-react';
import {
  DEMO_COURSES,
  DEMO_TUTORS,
  DEMO_PACKAGES,
  TESTIMONIALS,
  FAQS,
} from '@/lib/demo-data';
import { AnimatedCounter, FadeInUp } from '@/components/MotionPrimitives';

const FORMAT_LABELS = {
  IN_PERSON: { label: 'حضوري', icon: MapPin, cls: 'badge-amber' },
  LIVE_ONLINE: { label: 'أونلاين مباشر', icon: Video, cls: 'badge-teal' },
  RECORDED: { label: 'مسجل ذاتياً', icon: PlayCircle, cls: 'badge-azure' },
};

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative bg-hero-gradient bg-mesh-luminous pb-20 pt-12 lg:pb-28 lg:pt-16">
        {/* Soft decorative luminous blobs */}
        <div className="pointer-events-none absolute -top-24 right-10 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 h-80 w-80 rounded-full bg-azure-400/20 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 h-64 w-64 rounded-full bg-sunlit-400/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Hero Copy */}
            <div className="space-y-7 lg:col-span-6">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-white/90 px-4 py-1.5 text-xs font-bold text-teal-700 shadow-sm"
              >
                <Sparkles className="h-4 w-4 text-sunlit-500" />
                <span>المنصة السعودية المتكاملة للتدريب المهني ودروس التقوية</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="font-heading text-4xl font-black leading-[1.22] text-slate-900 sm:text-5xl lg:text-[3.35rem]"
              >
                طوّر مهاراتك المهنية..{' '}
                <span className="bg-gradient-to-l from-teal-600 via-emerald-500 to-azure-500 bg-clip-text text-transparent">
                  وارتقِ بتفوقك الدراسي
                </span>{' '}
                في مكان واحد
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.16 }}
                className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg"
              >
                منصة <strong>فهيم للتدريب</strong> تجمع بين الدورات المهنية المعتمدة (حضوري،
                أونلاين مباشر، ومسجل) ودروس التقوية الفردية مع نخبة المعلمين المعتمدين، مع
                متابعة ذكية لأولياء الأمور وشهادات موثقة برمز QR.
              </motion.p>

              {/* Dual CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.24 }}
                className="flex flex-wrap items-center gap-3.5 pt-1"
              >
                <Link href="/courses" className="btn-primary px-7 py-3.5 text-sm">
                  <BookOpen className="h-4 w-4" />
                  <span>استكشف الدورات المهنية</span>
                </Link>
                <Link href="/tutoring" className="btn-secondary px-7 py-3.5 text-sm">
                  <Users className="h-4 w-4" />
                  <span>احجز دروس التقوية</span>
                </Link>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.34 }}
                className="flex flex-wrap items-center gap-5 pt-2 text-xs font-semibold text-slate-600"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  معلمون ومدربون معتمدون
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-azure-500" />
                  محفظة ساعات آمنة وشفافة
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-sunlit-500" />
                  شهادات قابلة للتحقق الفوري
                </span>
              </motion.div>
            </div>

            {/* Hero Floating Interactive Visual */}
            <div className="relative lg:col-span-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.65, delay: 0.15 }}
                className="relative mx-auto max-w-lg"
              >
                {/* Main Interactive Showcase Card */}
                <div className="glass-card relative overflow-hidden rounded-[2rem] p-6 shadow-soft-lg">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <span className="badge-teal mb-1.5">جلسة مباشرة الآن</span>
                      <h3 className="font-heading text-lg font-extrabold text-slate-900">
                        منظومة التعلم الذكي في فهيم
                      </h3>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-azure-500 text-white shadow-teal-glow">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Interactive Mini Course Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl border border-teal-100 bg-teal-50/50 p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-600 shadow-sm">
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            إدارة المشاريع الاحترافية PMP
                          </p>
                          <p className="text-xs text-slate-500">35 ساعة معتمدة • أونلاين مباشر</p>
                        </div>
                      </div>
                      <span className="rounded-xl bg-white px-2.5 py-1 text-xs font-extrabold text-teal-700 shadow-sm">
                        4.9 ★
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-azure-100 bg-azure-50/60 p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-azure-600 shadow-sm">
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            أ. نورة الشمري — رياضيات وقدرات
                          </p>
                          <p className="text-xs text-slate-500">أقرب موعد متاح: اليوم 5:00 م</p>
                        </div>
                      </div>
                      <span className="rounded-xl bg-white px-2.5 py-1 text-xs font-extrabold text-azure-600 shadow-sm">
                        110 ر.س
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 pt-2">
                      <div className="rounded-2xl bg-slate-50 p-3 text-center">
                        <p className="font-heading text-lg font-black text-teal-600">98%</p>
                        <p className="text-[11px] font-medium text-slate-500">رضا الطلاب</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3 text-center">
                        <p className="font-heading text-lg font-black text-azure-600">+420</p>
                        <p className="text-[11px] font-medium text-slate-500">معلم معتمد</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3 text-center">
                        <p className="font-heading text-lg font-black text-amber-600">3 دقائق</p>
                        <p className="text-[11px] font-medium text-slate-500">متوسط المطابقة</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Stat Card 1 */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="glass-card absolute -left-4 -top-10 hidden rounded-2xl px-4 py-2.5 shadow-soft-lg sm:flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sunlit-100 text-amber-600">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">+18,500 متعلم</p>
                    <p className="text-[11px] text-slate-500">خريجون وطلبة متفوقون</p>
                  </div>
                </motion.div>

                {/* Floating Stat Card 2 */}
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="glass-card absolute -bottom-5 -left-4 hidden rounded-2xl px-4 py-3 shadow-soft-lg sm:flex items-center gap-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">شهادة QR فورية</p>
                    <p className="text-[11px] text-slate-500">جاهزية اعتماد NCEL</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* LIVE STATS BAR */}
          <FadeInUp delay={0.15} className="mt-16">
            <div className="glass-card grid grid-cols-2 gap-6 rounded-3xl p-6 sm:p-8 lg:grid-cols-4">
              {[
                { label: 'طالب ومتدرب نشط', value: 18500, suffix: '+', color: 'text-teal-600' },
                { label: 'حصة تقوية منجزة', value: 64200, suffix: '+', color: 'text-azure-600' },
                { label: 'معلم ومدرب معتمد', value: 420, suffix: '+', color: 'text-emerald-600' },
                { label: 'شهادة مهنية موثقة', value: 9400, suffix: '+', color: 'text-amber-600' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className={`font-heading text-3xl font-black sm:text-4xl ${stat.color}`}>
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* WHY FAHEEM */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <FadeInUp className="mx-auto max-w-2xl text-center">
          <span className="badge-teal mb-3">لماذا منصة فهيم؟</span>
          <h2 className="font-heading text-3xl font-black text-slate-900 sm:text-4xl">
            تجربة تعليمية مصممة للنتائج الحقيقية
          </h2>
          <p className="mt-3 text-slate-600">
            حوكمة تعليمية ومالية متكاملة تضمن جودة المعلمين، شفافية المدفوعات، وسهولة المتابعة
            لكل من الطالب وولي الأمر والشركات.
          </p>
        </FadeInUp>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: 'معلمون ومدربون معتمدون',
              desc: 'اختيار دقيق ومراجعة مؤهلات لكل معلم ومدرب قبل اعتماد حسابه وظهوره للطلاب.',
              icon: ShieldCheck,
              bg: 'bg-teal-50 text-teal-600',
            },
            {
              title: 'محفظة مالية شفافة',
              desc: 'رصيد ساعات محمي بقيد مالي واضح؛ يُعلّق المبلغ عند الحجز ولا يُخصم إلا بعد إتمام الحصة.',
              icon: Zap,
              bg: 'bg-azure-50 text-azure-600',
            },
            {
              title: 'تقارير فورية لولي الأمر',
              desc: 'بوابة مستقلة لولي الأمر لمتابعة الأبناء، الحضور، مستوى التحصيل، وتقارير كل حصة.',
              icon: Users,
              bg: 'bg-sunlit-50 text-amber-600',
            },
            {
              title: 'شهادات موثقة بـ QR',
              desc: 'إصدار تلقائي لشهادات الدورات المهنية برقم تسلسلي فريد قابل للتحقق الفوري.',
              icon: Award,
              bg: 'bg-emerald-50 text-emerald-600',
            },
          ].map((item, idx) => (
            <FadeInUp key={item.title} delay={idx * 0.06}>
              <div className="group h-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-soft-lg">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${item.bg}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-extrabold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            </FadeInUp>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS — 3 BOOKING PATHS */}
      <section className="border-y border-slate-200/70 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInUp className="mx-auto max-w-2xl text-center">
            <span className="badge-azure mb-3">كيف تعمل دروس التقوية؟</span>
            <h2 className="font-heading text-3xl font-black text-slate-900 sm:text-4xl">
              ثلاثة مسارات ذكية لحجز درسك المثالي
            </h2>
            <p className="mt-3 text-slate-600">
              اختر الطريقة التي تناسبك سواء كنت تعرف معلمك المفضل أو تبحث عن أسرع مطابقة أو تفضل
              توصية منسق أكاديمي.
            </p>
          </FadeInUp>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[
              {
                step: '01',
                title: 'حجز مباشر مع معلم',
                badge: 'تختار معلمك بنفسك',
                desc: 'تصفح ملفات المعلمين المعتمدين، التقييمات، والمواعيد المتاحة، واحجز حصتك مباشرة بضغطة زر.',
                icon: UserCheck,
                border: 'border-teal-200 hover:border-teal-400',
                accent: 'from-teal-600 to-emerald-500',
              },
              {
                step: '02',
                title: 'طلب مفتوح ذكي (مطابقة فورية)',
                badge: 'الأسرع استجابة',
                desc: 'أرسل مادتك وموعدك المفضل ليصل للمعلمين المؤهلين؛ أول معلم يقبل الطلب يُثبت الحجز تلقائياً وبشكل ذري آمن.',
                icon: Zap,
                border: 'border-azure-200 hover:border-azure-400',
                accent: 'from-azure-500 to-teal-500',
              },
              {
                step: '03',
                title: 'تنسيق عبر منسق أكاديمي',
                badge: 'رعاية مخصصة',
                desc: 'اترك المهمة لفريق المنسقين في فهيم لاختيار المعلم الأنسب لاحتياجات الطالب وبناء خطة دراسية متكاملة.',
                icon: Headphones,
                border: 'border-amber-200 hover:border-amber-400',
                accent: 'from-sunlit-500 to-amber-500',
              },
            ].map((path, idx) => (
              <FadeInUp key={path.step} delay={idx * 0.08}>
                <div
                  className={`relative flex h-full flex-col justify-between rounded-3xl border bg-porcelain/60 p-7 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-soft-lg ${path.border}`}
                >
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${path.accent} text-white shadow-soft`}
                      >
                        <path.icon className="h-6 w-6" />
                      </div>
                      <span className="font-heading text-3xl font-black text-slate-200">
                        {path.step}
                      </span>
                    </div>
                    <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
                      {path.badge}
                    </span>
                    <h3 className="mt-3 font-heading text-xl font-extrabold text-slate-900">
                      {path.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{path.desc}</p>
                  </div>
                  <Link
                    href="/tutoring"
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 hover:text-teal-800"
                  >
                    <span>جرّب هذا المسار الآن</span>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </div>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PROFESSIONAL COURSES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="badge-teal mb-2">التدريب المهني المعتمد</span>
            <h2 className="font-heading text-3xl font-black text-slate-900">
              أبرز الدورات المهنية المطلوبة
            </h2>
          </div>
          <Link href="/courses" className="btn-outline py-2.5 text-xs">
            <span>عرض جميع الدورات</span>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DEMO_COURSES.slice(0, 3).map((course, idx) => {
            const fmt = FORMAT_LABELS[course.format];
            const FmtIcon = fmt.icon;
            return (
              <FadeInUp key={course.id} delay={idx * 0.08}>
                <div className="group flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg">
                  <div>
                    {/* Top colorful header band */}
                    <div
                      className={`relative p-6 ${
                        course.accent === 'azure'
                          ? 'bg-gradient-to-br from-azure-50 via-white to-teal-50/50'
                          : course.accent === 'amber'
                            ? 'bg-gradient-to-br from-sunlit-50 via-white to-amber-50/40'
                            : 'bg-gradient-to-br from-teal-50 via-white to-emerald-50/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={fmt.cls}>
                          <FmtIcon className="h-3.5 w-3.5" />
                          {fmt.label}
                        </span>
                        {course.ncelAccredited && (
                          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm">
                            معتمدة QR
                          </span>
                        )}
                      </div>
                      <h3 className="mt-4 font-heading text-lg font-extrabold leading-snug text-slate-900 group-hover:text-teal-700 transition-colors">
                        {course.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">
                        {course.subtitle}
                      </p>
                    </div>

                    <div className="space-y-3 p-6 pt-4">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-teal-600" />
                          {course.hours} ساعة تدريبية
                        </span>
                        <span className="flex items-center gap-1 font-bold text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {course.rating} ({course.studentsCount})
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        المدرب: <span className="text-teal-700">{course.trainer.name}</span>
                      </p>
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
                      className="inline-flex items-center gap-1 rounded-xl bg-teal-50 px-3.5 py-2 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-600 hover:text-white"
                    >
                      التفاصيل
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </FadeInUp>
            );
          })}
        </div>
      </section>

      {/* TOP APPROVED TUTORS */}
      <section className="bg-gradient-to-b from-white to-porcelain py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="badge-azure mb-2">نخبة المعلمين المعتمدين</span>
              <h2 className="font-heading text-3xl font-black text-slate-900">
                معلمون بخبرة تربوية وتقييمات استثنائية
              </h2>
            </div>
            <Link href="/tutoring" className="btn-outline py-2.5 text-xs">
              <span>تصفح دليل المعلمين</span>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {DEMO_TUTORS.slice(0, 3).map((tutor, idx) => (
              <FadeInUp key={tutor.id} delay={idx * 0.08}>
                <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-soft-lg">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-13 w-13 h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-azure-500 font-heading text-lg font-black text-white shadow-sm">
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

                    <p className="mt-4 text-xs leading-relaxed text-slate-600">{tutor.bio}</p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {tutor.subjects.map((sub) => (
                        <span
                          key={sub}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <p className="font-heading text-lg font-black text-teal-700">
                        {tutor.hourlyRate} <span className="text-xs font-bold text-slate-500">ر.س / ساعة</span>
                      </p>
                      <p className="text-[11px] text-slate-500">أقرب موعد: {tutor.nextSlot}</p>
                    </div>
                    <Link href={`/tutoring?tutor=${tutor.id}`} className="btn-primary py-2 px-4 text-xs">
                      احجز الآن
                    </Link>
                  </div>
                </div>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* TUTORING PACKAGES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <FadeInUp className="mx-auto max-w-2xl text-center">
          <span className="badge-amber mb-3">باقات الساعات المرنة</span>
          <h2 className="font-heading text-3xl font-black text-slate-900 sm:text-4xl">
            وفّر حتى 28% مع باقات التقوية الذكية
          </h2>
          <p className="mt-3 text-slate-600">
            رصيدك محفوظ في محفظة فهيم ويمكن استخدامه مع أي معلم وأي مادة أو مشاركته بين الإخوة.
          </p>
        </FadeInUp>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {DEMO_PACKAGES.map((pkg, idx) => (
            <FadeInUp key={pkg.id} delay={idx * 0.08}>
              <div
                className={`relative flex h-full flex-col justify-between rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1 ${
                  pkg.popular
                    ? 'border-teal-400 bg-gradient-to-b from-teal-50/70 via-white to-white shadow-soft-lg ring-2 ring-teal-500/20'
                    : 'border-slate-200/80 bg-white shadow-soft'
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-3.5 left-6 rounded-full bg-gradient-to-l from-teal-600 to-emerald-500 px-4 py-1 text-xs font-extrabold text-white shadow">
                    الأكثر اختياراً
                  </span>
                )}
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-xl font-extrabold text-slate-900">
                      {pkg.name}
                    </h3>
                    <span className="badge-amber">وفّر {pkg.savingsPercent}%</span>
                  </div>
                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="font-heading text-4xl font-black text-slate-900">
                      {pkg.price.toLocaleString('ar-SA')}
                    </span>
                    <span className="text-sm font-bold text-slate-500">ر.س</span>
                    <span className="mr-auto text-xs font-bold text-teal-700">
                      {pkg.pricePerHour} ر.س / ساعة ({pkg.hours} ساعات)
                    </span>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/tutoring#packages"
                  className={`mt-8 w-full ${pkg.popular ? 'btn-primary' : 'btn-outline'}`}
                >
                  اختر هذه الباقة
                </Link>
              </div>
            </FadeInUp>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="border-y border-slate-200/70 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInUp className="mx-auto max-w-2xl text-center">
            <span className="badge-teal mb-3">قصص نجاح طلابنا</span>
            <h2 className="font-heading text-3xl font-black text-slate-900">
              ماذا يقول المتدربون وأولياء الأمور عن فهيم؟
            </h2>
          </FadeInUp>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((item, idx) => (
              <FadeInUp key={item.name} delay={idx * 0.08}>
                <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200/80 bg-porcelain/70 p-6">
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex gap-1 text-amber-400">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400" />
                        ))}
                      </div>
                      <span className="badge-azure">{item.tag}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">&ldquo;{item.quote}&rdquo;</p>
                  </div>
                  <div className="mt-6 border-t border-slate-200/70 pt-4">
                    <p className="font-heading text-sm font-extrabold text-slate-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                </div>
              </FadeInUp>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <FadeInUp className="text-center">
          <span className="badge-azure mb-3">الأسئلة الشائعة</span>
          <h2 className="font-heading text-3xl font-black text-slate-900">
            إجابات سريعة لكل ما يهمك
          </h2>
        </FadeInUp>

        <div className="mt-10 space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between px-6 py-4 text-right font-heading text-sm font-extrabold text-slate-900 sm:text-base"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-teal-600 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-100 px-6 py-4 text-sm leading-relaxed text-slate-600">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL VIBRANT CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-l from-teal-600 via-emerald-500 to-azure-500 p-8 text-white shadow-soft-lg sm:p-12">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-3">
              <h2 className="font-heading text-2xl font-black sm:text-3xl">
                جاهز لبدء رحلة التميز المهني أو الأكاديمي؟
              </h2>
              <p className="text-sm text-teal-50 sm:text-base">
                سجّل حسابك خلال ثوانٍ عبر رمز التحقق OTP واستفد من بوابات فهيم المتكاملة للطلاب
                وأولياء الأمور والمعلمين.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-extrabold text-teal-700 shadow-md transition-transform hover:-translate-y-0.5"
              >
                ابدأ الآن مجاناً
              </Link>
              <Link
                href="/corporate"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                تدريب الشركات B2B
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
