'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  CheckCircle2,
  Wallet,
  Calendar,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function JoinPage() {
  const [applicantType, setApplicantType] = useState<'TUTOR' | 'TRAINER'>('TUTOR');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: 'الرياض',
    specialty: '',
    experienceYears: '3 - 5 سنوات',
    bio: '',
  });
  const [cvFile, setCvFile] = useState<string>('');
  const [certFile, setCertFile] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await api.submitTutorApplication({
      ...form,
      applicantType,
      cvFile: cvFile || 'cv.pdf',
      certFile: certFile || 'degree.pdf',
    });
    setSubmitting(false);
    setReference(res.reference);
  };

  return (
    <div className="min-h-screen bg-porcelain pb-20">
      <section className="border-b border-slate-200/70 bg-hero-gradient bg-mesh-luminous py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="badge-amber mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            انضم إلى نخبة فهيم التعليمية
          </span>
          <h1 className="font-heading text-3xl font-black text-slate-900 sm:text-4xl">
            انضم كمعلم تقوية أو مدرب مهني معتمد
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            استثمر خبرتك العلمية والمهنية بمرونة كاملة في الجدول، استقبال طلبات فورية، وتسويات
            مالية منتظمة وشفافة.
          </p>

          <div className="mt-8 grid gap-4 text-right sm:grid-cols-3">
            {[
              { icon: Calendar, title: 'جدول مرن 100%', desc: 'حدد ساعات توافرك وأيامك كما يناسبك' },
              { icon: Wallet, title: 'تسويات مالية شفافة', desc: 'تتبع أرباحك وسجل الحصص لحظياً' },
              { icon: ShieldCheck, title: 'بيئة موثوقة ومعتمدة', desc: 'دعم فني ومنسقون أكاديميون لخدمتك' },
            ].map((b) => (
              <div key={b.title} className="glass-card rounded-2xl p-4">
                <b.icon className="h-5 w-5 text-teal-600" />
                <p className="mt-2 font-heading text-sm font-extrabold text-slate-900">{b.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <div className="glass-card rounded-[2rem] p-6 shadow-soft-lg sm:p-8">
          {/* Type Switch */}
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-100/80 p-1.5">
            <button
              type="button"
              onClick={() => setApplicantType('TUTOR')}
              className={`rounded-xl py-2.5 text-sm font-extrabold transition-all ${
                applicantType === 'TUTOR'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              معلم دروس تقوية
            </button>
            <button
              type="button"
              onClick={() => setApplicantType('TRAINER')}
              className={`rounded-xl py-2.5 text-sm font-extrabold transition-all ${
                applicantType === 'TRAINER'
                  ? 'bg-white text-azure-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              مدرب دورات مهنية
            </button>
          </div>

          {reference ? (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto h-11 w-11 text-emerald-600" />
              <h2 className="mt-3 font-heading text-xl font-black text-emerald-900">
                تم استلام طلب الانضمام بنجاح!
              </h2>
              <p className="mt-2 text-sm text-emerald-800">
                رقم الطلب المرجعي: <strong dir="ltr">{reference}</strong>. سيقوم فريق الجودة
                الأكاديمية بمراجعة مؤهلاتك والرد خلال 48 ساعة.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">الاسم الثلاثي</label>
                  <input
                    required
                    className="input-field"
                    placeholder="أ. محمد بن عبدالعزيز..."
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">البريد الإلكتروني</label>
                  <input
                    required
                    type="email"
                    dir="ltr"
                    className="input-field text-right"
                    placeholder="teacher@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">رقم الجوال</label>
                  <input
                    required
                    dir="ltr"
                    className="input-field text-right"
                    placeholder="+9665XXXXXXXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">المدينة</label>
                  <input
                    required
                    className="input-field"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    {applicantType === 'TUTOR' ? 'المواد والمراحل الدراسية' : 'المجال التدريبي المهني'}
                  </label>
                  <input
                    required
                    className="input-field"
                    placeholder={
                      applicantType === 'TUTOR'
                        ? 'رياضيات، قدرات كمي — ثانوي'
                        : 'إدارة مشاريع PMP، تحليل بيانات...'
                    }
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">سنوات الخبرة</label>
                  <select
                    className="input-field"
                    value={form.experienceYears}
                    onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                  >
                    <option>1 - 3 سنوات</option>
                    <option>3 - 5 سنوات</option>
                    <option>5 - 10 سنوات</option>
                    <option>أكثر من 10 سنوات</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">نبذة تعريفية عن أسلوبك وخبراتك</label>
                <textarea
                  rows={3}
                  required
                  className="input-field"
                  placeholder="اذكر أبرز إنجازاتك وشهاداتك المهنية أو الأكاديمية..."
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>

              {/* Document Upload Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-5 text-center transition-colors hover:border-teal-400 hover:bg-teal-50/40">
                  <Upload className="h-6 w-6 text-teal-600" />
                  <span className="mt-2 text-xs font-extrabold text-slate-800">
                    رفع السيرة الذاتية (PDF)
                  </span>
                  <span className="mt-1 text-[11px] text-slate-500">
                    {cvFile || 'اضغط لاختيار ملف'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setCvFile(e.target.files?.[0]?.name || '')}
                  />
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-5 text-center transition-colors hover:border-azure-400 hover:bg-azure-50/40">
                  <FileText className="h-6 w-6 text-azure-600" />
                  <span className="mt-2 text-xs font-extrabold text-slate-800">
                    المؤهل العلمي / شهادات الاعتماد
                  </span>
                  <span className="mt-1 text-[11px] text-slate-500">
                    {certFile || 'اضغط لاختيار ملف'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => setCertFile(e.target.files?.[0]?.name || '')}
                  />
                </label>
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5">
                {submitting ? 'جاري رفع الطلب...' : 'إرسال طلب الاعتماد للمراجعة'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
