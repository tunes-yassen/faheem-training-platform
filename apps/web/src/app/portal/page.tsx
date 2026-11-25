import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  Sparkles,
  Award,
  Headphones,
  ArrowLeft,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

const PORTALS = [
  { href: '/portal/trainee', title: 'لوحة المتدرب المهني', desc: 'دوراتي المهنية، الجدول، القاعات، الحقائب، الواجبات والاختبارات، الشهادات، والفواتير', icon: GraduationCap },
  { href: '/portal/trainer', title: 'لوحة المدرب المهني', desc: 'إدارة الدورات والدفعات، رصد الحضور، تقييم الواجبات والدرجات', icon: Award },
  { href: '/portal/student', title: 'لوحة الطالب (دروس التقوية)', desc: 'الحصص القادمة، المحفظة والسجل المالي، تقارير المعلمين، والدعم', icon: BookOpen },
  { href: '/portal/parent', title: 'لوحة ولي الأمر', desc: 'إدارة وربط الأبناء بموافقة موثقة، حجز الحصص، التقارير والفواتير', icon: Users },
  { href: '/portal/tutor', title: 'لوحة معلم التقوية', desc: 'استقبال الطلبات الفورية بقبول ذري، جدول التوافر، التقارير، والأرباح', icon: Sparkles },
  { href: '/portal/coordinator', title: 'لوحة المنسق الأكاديمي', desc: 'صندوق الطلبات، الإسناد اليدوي للمعلمين، ومراقبة SLA التذاكر', icon: Headphones },
];

export default function PortalIndexPage() {
  return (
    <div className="min-h-screen bg-hero-gradient bg-mesh-luminous py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <span className="badge-teal mb-3">البوابات ولوحات التحكم</span>
          <h1 className="font-heading text-3xl font-black text-slate-900 sm:text-4xl">
            اختر بوابتك المخصصة في منصة فهيم
          </h1>
          <p className="mt-2 text-slate-600">
            لكل دور في منصة فهيم لوحة تحكم مستقلة مصممة لمهامه اليومية ومتصلة بالنظام الحي.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PORTALS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="glass-card group flex flex-col justify-between rounded-3xl p-6 transition-all hover:-translate-y-1 hover:border-teal-300 hover:shadow-soft-lg"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-600 group-hover:text-white">
                  <p.icon className="h-6 w-6" />
                </div>
                <h2 className="mt-4 font-heading text-lg font-extrabold text-slate-900">{p.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{p.desc}</p>
              </div>
              <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-teal-700">
                دخول اللوحة
                <ArrowLeft className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href="http://localhost:3003"
            target="_blank"
            rel="noreferrer"
            className="btn-amber px-7 py-3.5 text-sm"
          >
            <ShieldCheck className="h-4 w-4" />
            الانتقال إلى لوحة الإدارة العليا (Admin Panel)
          </a>
        </div>
      </div>
    </div>
  );
}
