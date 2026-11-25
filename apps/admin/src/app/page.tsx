'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Sparkles,
  GraduationCap,
  Clock,
  ShieldAlert,
  KeyRound,
  Wallet,
  BookOpenCheck,
  SlidersHorizontal,
  ArrowUpLeft,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';
import {
  BOOKINGS_BY_PATH_DATA,
  COURSE_COMPLETION_DATA,
  REVENUE_CHART_DATA,
} from '@/lib/demo-data';
import { formatNumber, formatSAR } from '@/lib/utils';
import { Badge, PageHeader } from '@/components/ui/Primitives';

export default function ExecutiveDashboardPage() {
  const { tutorApplications, refunds, tickets, courses, auditLogs, liveKpis } = useAdmin();

  const pendingApprovals =
    liveKpis
      ? (liveKpis.pendingTutorApps ?? 0) + (liveKpis.pendingRefunds ?? 0)
      : (tutorApplications ?? []).filter((a) => a.status === 'PENDING').length +
        (refunds ?? []).filter((r) => r.status === 'PENDING_APPROVAL').length;

  const totalEnrollments =
    liveKpis?.activeEnrollments ?? (courses ?? []).reduce((acc, c) => acc + (c.enrolledCount || 0), 0);
  const openTickets =
    liveKpis?.openTickets ??
    (tickets ?? []).filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;

  const kpis = [
    {
      label: 'إجمالي الإيرادات (نوفمبر)',
      value: formatSAR(723000),
      delta: '+18.4%',
      sub: 'مقارنة بالشهر السابق',
      icon: TrendingUp,
      color: 'from-teal-500 to-emerald-600',
      bgTint: 'bg-teal-50 text-teal-700',
    },
    {
      label: 'الطلاب النشطون',
      value: formatNumber(4820),
      delta: '+12.1%',
      sub: '614 طالب جديد هذا الأسبوع',
      icon: Users,
      color: 'from-sky-500 to-blue-600',
      bgTint: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'نسبة مطابقة الدروس',
      value: '96.4%',
      delta: '+2.8%',
      sub: 'متوسط وقت المطابقة 4.2 دقيقة',
      icon: Sparkles,
      color: 'from-teal-600 to-sky-500',
      bgTint: 'bg-teal-50 text-teal-700',
    },
    {
      label: 'التسجيلات بالدورات',
      value: formatNumber(totalEnrollments),
      delta: '+9.5%',
      sub: 'عبر حضوري، مباشر، ومسجل',
      icon: GraduationCap,
      color: 'from-indigo-500 to-sky-500',
      bgTint: 'bg-indigo-50 text-indigo-700',
    },
    {
      label: 'الموافقات المعلقة',
      value: String(pendingApprovals),
      delta: 'يتطلب إجراء',
      sub: 'معلمين + استرداد Maker-Checker',
      icon: ShieldAlert,
      color: 'from-amber-500 to-orange-500',
      bgTint: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'الالتزام بمؤشر SLA',
      value: '98.2%',
      delta: `${openTickets} تذاكر مفتوحة`,
      sub: 'متوسط الاستجابة 18 دقيقة',
      icon: Clock,
      color: 'from-emerald-500 to-teal-600',
      bgTint: 'bg-emerald-50 text-emerald-700',
    },
  ];

  const quickActions = [
    {
      href: '/settings/integrations',
      title: 'مفاتيح الـ API والربط',
      desc: 'بوابات الدفع، Zoom، SMS، NCEL',
      icon: KeyRound,
      accent: 'text-teal-600 bg-teal-50',
    },
    {
      href: '/finance',
      title: 'اعتماد الاسترداد (Checker)',
      desc: `${refunds.filter((r) => r.status === 'PENDING_APPROVAL').length} طلبات بانتظار المراجعة الثنائية`,
      icon: Wallet,
      accent: 'text-amber-600 bg-amber-50',
    },
    {
      href: '/tutoring',
      title: 'اعتماد المعلمين الجدد',
      desc: `${tutorApplications.filter((a) => a.status === 'PENDING').length} طلبات معلم قيد المراجعة`,
      icon: BookOpenCheck,
      accent: 'text-sky-600 bg-sky-50',
    },
    {
      href: '/policies',
      title: 'محرك السياسات والتسعير',
      desc: 'نوافذ الإلغاء ونسب العمولات',
      icon: SlidersHorizontal,
      accent: 'text-indigo-600 bg-indigo-50',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة القيادة التنفيذية"
        subtitle="نظرة شاملة ومباشرة على أداء منصة فهيم للتدريب، الإيرادات، الدروس، والالتزام التشغيلي."
        badge={<Badge variant="teal">تحديث فوري</Badge>}
        actions={
          <>
            <Link href="/settings/integrations" className="btn-secondary">
              <KeyRound className="h-4 w-4 text-teal-600" />
              <span>إعدادات الربط والـ API</span>
            </Link>
            <Link href="/finance" className="btn-primary">
              <Wallet className="h-4 w-4" />
              <span>مركز المالية</span>
            </Link>
          </>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="surface-card group relative overflow-hidden p-5 transition-all hover:border-teal-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{kpi.label}</p>
                  <p className="mt-2 font-display text-2xl font-extrabold text-slate-900">
                    {kpi.value}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${kpi.color} text-white shadow-sm`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${kpi.bgTint}`}>
                  {kpi.delta}
                </span>
                <span className="text-xs text-slate-500">{kpi.sub}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Revenue Trend AreaChart */}
        <div className="surface-card p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                نمو الإيرادات حسب المسار (ر.س)
              </h2>
              <p className="text-xs text-slate-500">
                مقارنة إيرادات دروس التقوية، الدورات الاحترافية، وتدريب الشركات B2B
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-500" /> دروس التقوية
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> الدورات
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> الشركات B2B
              </span>
            </div>
          </div>
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTutoring" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradCourses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradCorp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 10px 25px -5px rgba(15,23,42,0.1)',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="tutoring" name="دروس التقوية" stroke="#0D9488" strokeWidth={2.5} fill="url(#gradTutoring)" />
                <Area type="monotone" dataKey="courses" name="الدورات التدريبية" stroke="#0EA5E9" strokeWidth={2.5} fill="url(#gradCourses)" />
                <Area type="monotone" dataKey="corporate" name="تدريب الشركات" stroke="#F59E0B" strokeWidth={2} fill="url(#gradCorp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bookings by Path BarChart */}
        <div className="surface-card flex flex-col justify-between p-5">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              الحجوزات حسب مسار المطابقة
            </h2>
            <p className="text-xs text-slate-500">
              توزيع طلبات الدروس عبر المسارات الثلاثة المعتمدة
            </p>
          </div>
          <div className="my-4 h-52 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BOOKINGS_BY_PATH_DATA} layout="vertical" margin={{ top: 5, right: 16, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="path" type="category" width={115} tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="bookings" name="عدد الحجوزات" radius={[0, 8, 8, 0]} barSize={22}>
                  {BOOKINGS_BY_PATH_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-xs font-bold text-slate-700">معدل إتمام الدورات التدريبية</p>
            {COURSE_COMPLETION_DATA.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-600">{item.name}</span>
                  <span className="font-bold text-slate-900">{item.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Audit Activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Quick Actions */}
        <div className="surface-card p-5">
          <h2 className="font-display text-base font-bold text-slate-900">إجراءات سريعة</h2>
          <p className="mb-4 text-xs text-slate-500">وصول فوري لأكثر المهام الإدارية حساسية</p>
          <div className="space-y-2.5">
            {quickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <Link
                  key={qa.href}
                  href={qa.href}
                  className="group flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/50 p-3.5 transition-all hover:border-teal-300 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${qa.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 group-hover:text-teal-700">
                        {qa.title}
                      </p>
                      <p className="text-xs text-slate-500">{qa.desc}</p>
                    </div>
                  </div>
                  <ArrowUpLeft className="h-4 w-4 text-slate-400 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-teal-600" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="surface-card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal-600" />
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  آخر العمليات وسجل التدقيق الفوري
                </h2>
                <p className="text-xs text-slate-500">كل تعديل إداري يُسجل تلقائياً في سجل غير قابل للحذف</p>
              </div>
            </div>
            <Link href="/audit-logs" className="text-xs font-bold text-teal-600 hover:text-teal-700">
              عرض السجل الكامل ←
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{log.summary}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      بواسطة <span className="font-semibold text-slate-700">{log.actorName}</span> •{' '}
                      {log.module}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-left">
                  <Badge
                    variant={
                      log.severity === 'CRITICAL'
                        ? 'rose'
                        : log.severity === 'WARNING'
                        ? 'amber'
                        : 'teal'
                    }
                  >
                    {log.action}
                  </Badge>
                  <p className="mt-1 text-[11px] text-slate-400" dir="ltr">
                    {log.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
