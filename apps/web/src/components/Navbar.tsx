'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Menu,
  X,
  Sparkles,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth, portalPathForRole } from '@/context/AuthContext';

const NAV_LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/courses', label: 'الدورات المهنية' },
  { href: '/tutoring', label: 'دروس التقوية' },
  { href: '/corporate', label: 'تدريب الشركات' },
  { href: '/verify', label: 'التحقق من الشهادات' },
  { href: '/join', label: 'انضم كمعلم' },
];

const PORTAL_SHORTCUTS = [
  { href: '/portal/trainee', label: 'لوحة المتدرب المهني', badge: 'دورات' },
  { href: '/portal/trainer', label: 'لوحة المدرب المهني', badge: 'مدرب' },
  { href: '/portal/student', label: 'لوحة الطالب', badge: 'تقوية' },
  { href: '/portal/parent', label: 'لوحة ولي الأمر', badge: 'أبناء' },
  { href: '/portal/tutor', label: 'لوحة معلم التقوية', badge: 'معلم' },
  { href: '/portal/coordinator', label: 'لوحة المنسق الأكاديمي', badge: 'تنسيق' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-nav">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-500 to-azure-500 text-white shadow-teal-glow transition-transform duration-300 group-hover:scale-105">
            <GraduationCap className="h-6 w-6" />
            <span className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sunlit-500 text-[9px] font-black text-white shadow">
              <Sparkles className="h-2.5 w-2.5" />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-xl font-extrabold leading-tight text-slate-900">
              فهيم <span className="text-teal-600">للتدريب</span>
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              تطوير مهني وتقوية أكاديمية
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'text-teal-700 bg-teal-50/80'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Portals Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPortalsOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl border border-teal-200/80 bg-teal-50/70 px-3.5 py-2 text-sm font-bold text-teal-800 transition-colors hover:bg-teal-100/80"
            >
              <LayoutDashboard className="h-4 w-4 text-teal-600" />
              البوابات ولوحات التحكم
              <ChevronDown className={`h-4 w-4 transition-transform ${portalsOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {portalsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.16 }}
                  onMouseLeave={() => setPortalsOpen(false)}
                  className="absolute left-0 mt-2 w-64 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-soft-lg"
                >
                  {PORTAL_SHORTCUTS.map((p) => (
                    <Link
                      key={p.href}
                      href={p.href}
                      onClick={() => setPortalsOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    >
                      <span>{p.label}</span>
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {p.badge}
                      </span>
                    </Link>
                  ))}
                  <div className="my-1.5 border-t border-slate-100" />
                  <a
                    href="http://localhost:3003"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-extrabold text-amber-700 transition-colors hover:bg-sunlit-50"
                  >
                    <span>لوحة الإدارة العليا (Admin)</span>
                    <ShieldCheck className="h-4 w-4" />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Link
                href={portalPathForRole(user.role)}
                className="btn-primary py-2.5 px-4 text-xs"
              >
                <UserCheck className="h-4 w-4" />
                <span>بوابتي ({user.name.split(' ')[0]})</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                title="تسجيل الخروج"
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/auth" className="btn-outline py-2.5 px-4 text-xs">
                تسجيل الدخول
              </Link>
              <Link href="/booking" className="btn-primary py-2.5 px-5 text-xs">
                احجز الآن
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 lg:hidden"
          aria-label="فتح القائمة"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-200/80 bg-white lg:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-3 border-t border-slate-100 pt-3">
                <p className="px-4 pb-1.5 text-xs font-bold text-slate-400">بوابات المستخدمين</p>
                <div className="grid grid-cols-2 gap-2 px-2">
                  {PORTAL_SHORTCUTS.map((p) => (
                    <Link
                      key={p.href}
                      href={p.href}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                    >
                      {p.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Link
                  href="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="btn-outline flex-1 py-2.5 text-xs"
                >
                  <ShieldCheck className="h-4 w-4" />
                  تسجيل الدخول
                </Link>
                <Link
                  href="/booking"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary flex-1 py-2.5 text-xs"
                >
                  احجز الآن
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
