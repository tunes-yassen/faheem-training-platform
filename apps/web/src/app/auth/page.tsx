'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Smartphone,
  KeyRound,
  BookOpen,
  Users,
  Sparkles,
  Award,
  Headphones,
  ArrowLeft,
  GraduationCap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth, portalPathForRole } from '@/context/AuthContext';
import type { UserRole } from '@/types';

const ROLES: { id: UserRole; label: string; desc: string; demoEmail: string; icon: typeof BookOpen }[] = [
  { id: 'TRAINEE', label: 'متدرب مهني', desc: 'الدورات، الحقائب، الاختبارات، والشهادات', demoEmail: 'student@faheem.sa', icon: GraduationCap },
  { id: 'TRAINER', label: 'مدرب مهني', desc: 'إدارة الدفعات، الحضور، والدرجات', demoEmail: 'trainer@faheem.sa', icon: Award },
  { id: 'STUDENT', label: 'طالب تقوية', desc: 'حصص التقوية، المحفظة، والتقارير', demoEmail: 'student@faheem.sa', icon: BookOpen },
  { id: 'PARENT', label: 'ولي أمر', desc: 'متابعة الأبناء والتقارير والفواتير', demoEmail: 'parent@faheem.sa', icon: Users },
  { id: 'TUTOR', label: 'معلم تقوية', desc: 'الطلبات الفورية، الجدول، والأرباح', demoEmail: 'tutor@faheem.sa', icon: Sparkles },
  { id: 'COORDINATOR', label: 'منسق أكاديمي', desc: 'إسناد المعلمين ومتابعة SLA', demoEmail: 'coordinator@faheem.sa', icon: Headphones },
];

export default function AuthPage() {
  const router = useRouter();
  const { loginAsRole } = useAuth();
  const [step, setStep] = useState<'IDENTIFY' | 'OTP'>('IDENTIFY');
  const [role, setRole] = useState<UserRole>('TRAINEE');
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('student@faheem.sa');
  const [otp, setOtp] = useState('123456');
  const [demoHint, setDemoHint] = useState<string | null>(null);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await api.requestOtp(identifier);
    setDemoHint(res.demoCode);
    setOtp(res.demoCode);
    setIsLiveApi(res.live);
    setLoading(false);
    setStep('OTP');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const verified = await api.verifyOtp({
      identifier,
      code: otp,
      roleCode: role,
      fullName: fullName || undefined,
    });
    loginAsRole(role, fullName, identifier, verified.user);
    setLoading(false);
    router.push(portalPathForRole(role));
  };

  return (
    <div className="min-h-[85vh] bg-hero-gradient bg-mesh-luminous py-14">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="glass-card rounded-[2rem] p-6 shadow-soft-lg sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-azure-500 text-white shadow-teal-glow">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="font-heading text-2xl font-black text-slate-900">
              تسجيل الدخول أو إنشاء حساب
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              دخول آمن عبر رمز التحقق المؤقت (OTP) متصل مباشرة بقاعدة بيانات منصة فهيم
            </p>
          </div>

          {step === 'IDENTIFY' ? (
            <form onSubmit={handleRequestOtp} className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-extrabold text-slate-700">
                  اختر نوع الحساب / لوحة التحكم:
                </label>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {ROLES.map((r) => {
                    const active = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setRole(r.id);
                          setIdentifier(r.demoEmail);
                        }}
                        className={`flex items-start gap-2.5 rounded-2xl border p-3 text-right transition-all ${
                          active
                            ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20'
                            : 'border-slate-200 bg-white hover:border-teal-300'
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <r.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">{r.label}</p>
                          <p className="text-[11px] text-slate-500">{r.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  الاسم الكامل (اختياري)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="مثال: فيصل العتيبي"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  البريد الإلكتروني أو رقم الجوال
                </label>
                <div className="relative">
                  <Smartphone className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    required
                    dir="ltr"
                    className="input-field pr-10 text-right"
                    placeholder="student@faheem.sa أو +966501234567"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                <span>{loading ? 'جاري إرسال رمز التحقق...' : 'إرسال رمز التحقق OTP'}</span>
                <ArrowLeft className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="mt-7 space-y-5">
              <div className="rounded-2xl border border-teal-200 bg-teal-50/70 p-4 text-center text-xs text-teal-800">
                تم إرسال رمز التحقق إلى <strong dir="ltr">{identifier}</strong>
                {demoHint && (
                  <p className="mt-1 font-bold text-teal-700">
                    رمز التحقق {isLiveApi ? '(من الخادم الحي)' : '(وضع التجربة)'}:{' '}
                    <span className="font-mono text-sm">{demoHint}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  أدخل رمز التحقق (6 أرقام)
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    required
                    dir="ltr"
                    maxLength={6}
                    className="input-field pr-10 text-center font-mono text-lg font-extrabold tracking-[0.4em]"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? 'جاري التحقق وتوليد الجلسة...' : 'تأكيد الدخول والانتقال إلى البوابة'}
              </button>

              <button
                type="button"
                onClick={() => setStep('IDENTIFY')}
                className="btn-outline w-full py-2.5 text-xs"
              >
                تعديل الحساب أو الدور
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
