import React from 'react';
import Link from 'next/link';
import { Target, Eye, ShieldCheck, Award, Users, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-porcelain pb-20">
      <section className="border-b border-slate-200/70 bg-hero-gradient bg-mesh-luminous py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <span className="badge-teal mb-3">عن منصة فهيم للتدريب</span>
          <h1 className="font-heading text-3xl font-black text-slate-900 sm:text-5xl">
            نبني مستقبلاً تعليمياً أكثر ذكاءً وثقة
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            منصة فهيم للتدريب هي منظومة سعودية متكاملة تجمع بين التدريب المهني المعتمد ودروس
            التقوية الفردية وفق أعلى معايير الحوكمة التعليمية والمالية لتواكب مستهدفات تنمية
            القدرات البشرية ورؤية المملكة 2030.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-card rounded-3xl p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
              <Eye className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-2xl font-black text-slate-900">رؤيتنا</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              أن نكون الوجهة الرقمية الأولى في المنطقة لتطوير الكفاءات المهنية ودعم التفوق
              الدراسي عبر تجربة رقمية سلسة، موثوقة، ومقاسة الأثر.
            </p>
          </div>

          <div className="glass-card rounded-3xl p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-azure-50 text-azure-600">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-2xl font-black text-slate-900">رسالتنا</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              تمكين المتعلمين وأولياء الأمور والمنشآت من الوصول إلى نخبة المعلمين والمدربين
              المعتمدين مع شفافية مالية كاملة وتقارير أداء مستمرة وشهادات قابلة للتحقق الفوري.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: 'الجودة والاعتماد', desc: 'اعتماد صارم للمعلمين وجاهزية لمعايير NCEL.' },
            { icon: Users, title: 'شراكة ولي الأمر', desc: 'إشراك فعلي ومستمر لولي الأمر في رحلة الطالب.' },
            { icon: Award, title: 'أثر مهني ملموس', desc: 'مناهج تطبيقية مرتبطة بسوق العمل السعودي.' },
          ].map((v) => (
            <div key={v.title} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
              <v.icon className="h-6 w-6 text-teal-600" />
              <h3 className="mt-3 font-heading text-lg font-extrabold text-slate-900">{v.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/courses" className="btn-primary px-8 py-3.5">
            <Sparkles className="h-4 w-4" />
            استكشف برامجنا التدريبية
          </Link>
        </div>
      </section>
    </div>
  );
}
