'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  Home,
  LogOut,
  Bell,
  Sparkles,
  UserCircle2,
  Users,
  BookOpen,
  Award,
  Headphones,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';

const ALL_PORTALS: { role: UserRole; href: string; label: string; icon: React.ReactNode }[] = [
  { role: 'TRAINEE', href: '/portal/trainee', label: 'لوحة المتدرب المهني', icon: <GraduationCap className="h-4 w-4" /> },
  { role: 'TRAINER', href: '/portal/trainer', label: 'لوحة المدرب المهني', icon: <Award className="h-4 w-4" /> },
  { role: 'STUDENT', href: '/portal/student', label: 'لوحة الطالب', icon: <BookOpen className="h-4 w-4" /> },
  { role: 'PARENT', href: '/portal/parent', label: 'لوحة ولي الأمر', icon: <Users className="h-4 w-4" /> },
  { role: 'TUTOR', href: '/portal/tutor', label: 'لوحة معلم التقوية', icon: <Sparkles className="h-4 w-4" /> },
  { role: 'COORDINATOR', href: '/portal/coordinator', label: 'لوحة المنسق', icon: <Headphones className="h-4 w-4" /> },
];

export function PortalShell({
  portalTitle,
  portalSubtitle,
  roleBadge,
  accent = 'teal',
  tabs,
  activeTab,
  onTabChange,
  children,
}: {
  portalTitle: string;
  portalSubtitle: string;
  roleBadge: string;
  accent?: 'teal' | 'azure' | 'amber';
  tabs: { id: string; label: string; icon: React.ReactNode; badge?: string | number }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(2);

  const accentGradient =
    accent === 'azure'
      ? 'from-azure-500 to-teal-500'
      : accent === 'amber'
        ? 'from-sunlit-500 to-amber-500'
        : 'from-teal-600 to-emerald-500';

  return (
    <div className="min-h-screen bg-porcelain bg-mesh-luminous">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 glass-nav">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${accentGradient} text-white shadow-soft`}
            >
              <GraduationCap className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-base font-extrabold text-slate-900">
                  {portalTitle}
                </h1>
                <span className="badge-teal hidden sm:inline-flex">{roleBadge}</span>
              </div>
              <p className="text-xs text-slate-500">{portalSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-teal-300 hover:text-teal-700"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">الموقع الرئيسي</span>
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:border-teal-300 hover:text-teal-700"
                aria-label="الإشعارات"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sunlit-500" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-soft-lg z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-extrabold text-slate-900">الإشعارات ({unread})</span>
                    <button
                      type="button"
                      onClick={() => setUnread(0)}
                      className="text-[11px] font-bold text-teal-600 hover:underline"
                    >
                      تحديد الكل كمقروء
                    </button>
                  </div>
                  <div className="mt-2 space-y-2 text-xs">
                    <div className="rounded-xl bg-teal-50/70 p-2.5 text-slate-700">
                      تذكير: جلستك القادمة تبدأ اليوم الساعة 5:00 مساءً.
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5 text-slate-700">
                      تم تحديث سجل المحفظة والشهادات في حسابك بنجاح.
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 md:flex">
              <UserCircle2 className="h-5 w-5 text-teal-600" />
              <span className="text-xs font-bold text-slate-800">{user?.name || roleBadge}</span>
            </div>
            {user && (
              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                title="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:px-8">
        {/* Sidebar */}
        <aside className="space-y-5 lg:col-span-3">
          {/* Portal Navigation */}
          <div className="glass-card rounded-3xl p-3">
            <p className="px-3 pb-2 pt-1 text-xs font-bold text-slate-400">أقسام البوابة</p>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? `bg-gradient-to-l ${accentGradient} text-white shadow-soft`
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {tab.icon}
                      <span>{tab.label}</span>
                    </span>
                    {tab.badge !== undefined && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-700'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Role Switcher for Demo / Multi-role users */}
          <div className="glass-card rounded-3xl p-3">
            <p className="px-3 pb-2 pt-1 text-xs font-bold text-slate-400">
              التبديل السريع بين البوابات
            </p>
            <div className="space-y-1">
              {ALL_PORTALS.map((p) => {
                const current = pathname === p.href;
                return (
                  <Link
                    key={p.href}
                    href={p.href}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      current
                        ? 'bg-teal-50 text-teal-700 border border-teal-200/70'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {p.icon}
                    <span>{p.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <section className="lg:col-span-9">{children}</section>
      </div>
    </div>
  );
}
