'use client';

import React, { useState } from 'react';
import {
  QrCode,
  Search,
  ShieldCheck,
  Award,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { CertificateRecord } from '@/types';

const SAMPLE_CODES = ['FHM-2026-88412', 'FHM-2026-77305', 'FHM-2026-61029'];

export default function VerifyPage() {
  const [code, setCode] = useState('FHM-2026-88412');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateRecord | null | 'NOT_FOUND'>(null);

  const handleVerify = async (targetCode?: string) => {
    const query = (targetCode ?? code).trim();
    if (!query) return;
    setLoading(true);
    const cert = await api.verifyCertificate(query);
    setLoading(false);
    setResult(cert || 'NOT_FOUND');
  };

  return (
    <div className="min-h-screen bg-porcelain pb-20">
      <section className="border-b border-slate-200/70 bg-hero-gradient bg-mesh-luminous py-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-azure-500 text-white shadow-teal-glow">
            <QrCode className="h-7 w-7" />
          </div>
          <h1 className="font-heading text-3xl font-black text-slate-900 sm:text-4xl">
            التحقق الفوري من الشهادات
          </h1>
          <p className="mt-3 text-slate-600">
            أدخل الرقم التسلسلي للشهادة أو رمز QR للتحقق من صحتها واعتمادها الصادر عن منصة فهيم
            للتدريب.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute right-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                dir="ltr"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="FHM-2026-88412"
                className="input-field pr-11 text-left font-mono font-bold uppercase"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary px-8 py-3">
              {loading ? 'جاري التحقق...' : 'تحقق الآن'}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span>أرقام تجريبية للتحقق:</span>
            {SAMPLE_CODES.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setCode(sample);
                  handleVerify(sample);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono font-bold text-teal-700 hover:border-teal-400"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        {result === 'NOT_FOUND' && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
            <XCircle className="mx-auto h-12 w-12 text-rose-500" />
            <h2 className="mt-3 font-heading text-xl font-black text-rose-900">
              لم يتم العثور على شهادة مطابقة
            </h2>
            <p className="mt-1 text-sm text-rose-700">
              تأكد من إدخال الرقم التسلسلي بشكل صحيح أو تواصل مع فريق الدعم.
            </p>
          </div>
        )}

        {result && result !== 'NOT_FOUND' && (
          <div className="glass-card overflow-hidden rounded-[2rem] shadow-soft-lg">
            <div className="flex items-center justify-between bg-gradient-to-l from-teal-600 to-emerald-500 px-6 py-5 text-white sm:px-8">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-7 w-7" />
                <div>
                  <h2 className="font-heading text-lg font-extrabold">شهادة صحيحة وموثقة</h2>
                  <p className="text-xs text-teal-50">
                    تم التحقق من السجل الرسمي لمنصة فهيم للتدريب
                  </p>
                </div>
              </div>
              <span className="rounded-xl bg-white/20 px-3 py-1.5 font-mono text-xs font-bold backdrop-blur">
                {result.serial}
              </span>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <User className="h-3.5 w-3.5 text-teal-600" />
                  اسم حامل الشهادة
                </p>
                <p className="mt-1 font-heading text-base font-extrabold text-slate-900">
                  {result.holderName}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  التقدير العام
                </p>
                <p className="mt-1 font-heading text-base font-extrabold text-emerald-700">
                  {result.grade}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                <p className="text-xs font-bold text-slate-500">اسم البرنامج التدريبي</p>
                <p className="mt-1 font-heading text-lg font-black text-slate-900">
                  {result.courseTitle}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Calendar className="h-3.5 w-3.5 text-azure-600" />
                  تاريخ الإصدار
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">{result.issueDate}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Clock className="h-3.5 w-3.5 text-teal-600" />
                  عدد الساعات المعتمدة
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">{result.hours} ساعة تدريبية</p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-teal-200/70 bg-teal-50/60 p-4 sm:col-span-2">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-800">
                  <ShieldCheck className="h-5 w-5 text-teal-600" />
                  رمز جاهزية الاعتماد (NCEL):
                </div>
                <span className="font-mono text-xs font-extrabold text-teal-900">
                  {result.ncelCode}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
