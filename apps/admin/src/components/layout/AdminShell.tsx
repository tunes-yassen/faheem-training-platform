'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  KeyRound,
  FileCode2,
  SlidersHorizontal,
  Package,
  ShieldCheck,
  GraduationCap,
  Users2,
  Wallet,
  Building2,
  LifeBuoy,
  ScrollText,
  BookOpenCheck,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  Wifi,
  WifiOff,
  Sparkles,
  LogIn,
  LogOut,
  RefreshCw,
  Loader2,
  UserCog,
  UserCheck,
  MessageSquare,
  Activity,
  Users,
  CalendarCheck2,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { requestAdminOtp } from '@/lib/api';
import { Modal, ToastStack } from '@/components/ui/Primitives';

interface NavGroup {
  label: string;
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'القيادة والعمليات',
    items: [
      { href: '/', label: 'لوحة القيادة التنفيذية', icon: LayoutDashboard },
      { href: '/bookings', label: 'إدارة الحجوزات والجلسات', icon: CalendarCheck2 },
      { href: '/tutoring', label: 'دروس التقوية والاعتماد', icon: BookOpenCheck, badge: '2' },
      { href: '/courses', label: 'الدورات والشهادات (LMS)', icon: GraduationCap },
      { href: '/instructors', label: 'إدارة المدربين والمعلمين', icon: UserCheck },
      { href: '/finance', label: 'المالية و Maker-Checker', icon: Wallet, badge: '2' },
      { href: '/reports', label: 'مركز التقارير والتصدير', icon: FileSpreadsheet },
    ],
  },
  {
    label: 'التحكم الديناميكي (Zero-Code)',
    items: [
      { href: '/settings/integrations', label: 'مركز الربط ومفاتيح API', icon: KeyRound, badge: 'مهم' },
      { href: '/cms', label: 'إدارة المحتوى والموقع', icon: FileCode2 },
      { href: '/policies', label: 'محرك السياسات والتعويض', icon: SlidersHorizontal },
      { href: '/packages', label: 'المواد والباقات والتسعير', icon: Package },
      { href: '/roles', label: 'الأدوار والصلاحيات (RBAC)', icon: ShieldCheck },
    ],
  },
  {
    label: 'الموظفون والمجتمع والرقابة',
    items: [
      { href: '/staff', label: 'الموظفون وتقارير المهام', icon: UserCog },
      { href: '/guardians', label: 'أولياء الأمور والربط الأسري', icon: Users },
      { href: '/users', label: 'دليل المستخدمين', icon: Users2 },
      { href: '/corporate', label: 'تدريب الشركات B2B', icon: Building2 },
      { href: '/tickets', label: 'تذاكر الدعم و SLA', icon: LifeBuoy },
      { href: '/conversations', label: 'سجلات المحادثات والاتصالات', icon: MessageSquare },
      { href: '/course-logs', label: 'سجلات الدورات والعمليات', icon: Activity },
      { href: '/audit-logs', label: 'سجل التدقيق الأمني', icon: ScrollText },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    currentAdmin,
    switchAdmin,
    adminUsers,
    apiOnline,
    isAuthenticated,
    isHydrating,
    loginWithEmailOtp,
    quickLiveLogin,
    logoutAdmin,
    refreshFromApi,
    toasts,
    dismissToast,
    notify,
  } = useAdmin();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Live Admin OTP Login Modal state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('admin@faheem.sa');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    const res = await requestAdminOtp(loginEmail.trim());
    setAuthBusy(false);
    if (!res.ok) {
      notify('تعذر إرسال رمز التحقق', 'error', res.error || 'تأكد من تشغيل خادم API');
      return;
    }
    setOtpSent(true);
    if (res.data?.devOtp) {
      setDevOtpHint(res.data.devOtp);
      setOtpCode(res.data.devOtp);
    }
    notify('تم إرسال رمز التحقق بنجاح', 'info');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    const ok = await loginWithEmailOtp(loginEmail.trim(), otpCode.trim());
    setAuthBusy(false);
    if (ok) {
      setLoginModalOpen(false);
      setOtpSent(false);
      setOtpCode('');
      setDevOtpHint(null);
    }
  };

  const handleQuickLogin = async (email: string) => {
    setAuthBusy(true);
    const ok = await quickLiveLogin(email);
    setAuthBusy(false);
    if (ok) setLoginModalOpen(false);
  };

  const SidebarContent = (
    <div className="flex h-full flex-col bg-white">
      {/* Brand Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 via-teal-600 to-sky-500 text-white shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-base font-extrabold leading-tight text-slate-900">
              منصة فهيم
            </p>
            <p className="text-[11px] font-semibold text-teal-600">لوحة التحكم الفائقة</p>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3.5 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[11px] font-bold tracking-wide text-slate-400">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                      active
                        ? 'bg-gradient-to-l from-teal-50 to-sky-50/60 text-teal-700 shadow-sm ring-1 ring-teal-200/70'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px] transition-colors',
                          active ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-700'
                        )}
                      />
                      <span>{item.label}</span>
                    </span>
                    {item.badge && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold',
                          item.badge === 'مهم'
                            ? 'bg-amber-100 text-amber-700'
                            : active
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Live API Status Card */}
      <div className="border-t border-slate-100 p-4">
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">حالة الخادم (API)</span>
            {apiOnline && isAuthenticated ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <Wifi className="h-3 w-3" /> متصل (JWT)
              </span>
            ) : apiOnline ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                <Wifi className="h-3 w-3" /> خادم جاهز
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                <WifiOff className="h-3 w-3" /> وضع تجريبي
              </span>
            )}
          </div>
          {!isAuthenticated ? (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-teal-700"
            >
              <LogIn className="h-3.5 w-3.5" /> ربط مباشر بقاعدة البيانات
            </button>
          ) : (
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <button
                onClick={() => refreshFromApi()}
                className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-800"
              >
                <RefreshCw className={cn('h-3 w-3', isHydrating && 'animate-spin')} /> مزامنة الآن
              </button>
              <button
                onClick={logoutAdmin}
                className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700"
              >
                <LogOut className="h-3 w-3" /> خروج
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-72 border-l border-slate-200/80 bg-white lg:block">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed inset-y-0 right-0 z-50 w-72 shadow-2xl"
            >
              {SidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Wrapper */}
      <div className="flex min-h-screen flex-col lg:pr-72">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label="فتح القائمة"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث سريع في الإعدادات، الطلبات، المستخدمين..."
                className="w-72 rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-4 pr-9 text-xs text-slate-700 transition-all focus:w-80 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!isAuthenticated && (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-teal-700"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">دخول المشرف (Live API)</span>
              </button>
            )}

            <Link
              href="/settings/integrations"
              className="hidden items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/70 px-3 py-1.5 text-xs font-bold text-teal-700 transition-colors hover:bg-teal-100 md:inline-flex"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>مفاتيح الـ API</span>
            </Link>

            <Link
              href="/tickets"
              className="relative rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50"
              aria-label="الإشعارات والتذاكر"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -left-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                3
              </span>
            </Link>

            {/* Admin Account Switcher */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 transition-colors hover:bg-slate-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-sky-500 text-xs font-bold text-white">
                  {currentAdmin.avatarInitials}
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-bold text-slate-800">{currentAdmin.name}</p>
                  <p className="text-[10px] text-slate-500">{currentAdmin.role}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute left-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                  >
                    <div className="border-b border-slate-100 px-3 py-2">
                      <p className="text-[11px] font-bold text-slate-400">
                        تبديل المشرف (يدعم Maker-Checker المباشر عبر JWT)
                      </p>
                    </div>
                    <div className="mt-1 space-y-1">
                      {adminUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchAdmin(u.id);
                            setUserMenuOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-right transition-colors',
                            u.email === currentAdmin.email
                              ? 'bg-teal-50 text-teal-800'
                              : 'hover:bg-slate-50 text-slate-700'
                          )}
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                            {u.avatarInitials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold">{u.name}</p>
                            <p className="truncate text-[10px] text-slate-500">{u.email}</p>
                          </div>
                          {u.email === currentAdmin.email && (
                            <span className="h-2 w-2 rounded-full bg-teal-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1440px]">{children}</div>
        </main>
      </div>

      {/* Live Admin OTP Login Modal */}
      <Modal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        title="تسجيل دخول المشرف (الربط المباشر بـ PostgreSQL)"
        subtitle="سجّل دخولك عبر رمز OTP للحصول على جلسة JWT حقيقية وقراءة/كتابة البيانات الفعلية."
      >
        <div className="space-y-5">
          {/* Quick One-Click Dev Accounts */}
          <div>
            <p className="mb-2 text-xs font-bold text-slate-600">
              دخول سريع بحسابات المشرفين المعتمدة (توليد وتحقق OTP تلقائي):
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {adminUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={authBusy}
                  onClick={() => handleQuickLogin(u.email)}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-right transition-all hover:border-teal-400 hover:bg-teal-50/50 disabled:opacity-50"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{u.name}</p>
                    <p className="font-mono text-[10px] text-slate-500">{u.email}</p>
                  </div>
                  <LogIn className="h-4 w-4 text-teal-600" />
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="mx-3 text-[11px] font-bold text-slate-400">أو التحقق اليدوي عبر OTP</span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  البريد الإلكتروني أو رقم الجوال
                </label>
                <input
                  dir="ltr"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@faheem.sa"
                  className="input-base font-mono text-xs"
                />
              </div>
              <button type="submit" disabled={authBusy} className="btn-primary w-full">
                {authBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                <span>إرسال رمز التحقق (OTP)</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              {devOtpHint && (
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs text-teal-800">
                  رمز التحقق (بيئة التطوير):{' '}
                  <strong className="font-mono text-sm">{devOtpHint}</strong>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">أدخل رمز التحقق (OTP)</label>
                <input
                  dir="ltr"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="6 أرقام"
                  className="input-base text-center font-mono text-base tracking-widest"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="btn-secondary flex-1"
                >
                  تغيير الحساب
                </button>
                <button type="submit" disabled={authBusy} className="btn-primary flex-1">
                  {authBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>تأكيد الدخول</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
