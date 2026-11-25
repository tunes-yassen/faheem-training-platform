'use client';

import React, { useState } from 'react';
import {
  Building2,
  Users,
  BarChart3,
  Award,
  CheckCircle2,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function CorporatePage() {
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    employeesCount: '25 - 50 موظف',
    track: 'إدارة المشاريع والقيادة',
    deliveryMode: 'حضوري في مقر الشركة',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [refCode, setRefCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await api.submitCorporateQuote(form);
    setSubmitting(false);
    setRefCode(res.reference);
  };

  return (
    <div className="min-h-screen bg-porcelain pb-20">
      <section className="border-b border-slate-200/70 bg-hero-gradient bg-mesh-luminous py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-7">
              <span className="badge-teal">حلول تدريب الشركات والجهات الحكومية B2B</span>
              <h1 className="font-heading text-3xl font-black leading-tight text-slate-900 sm:text-5xl">
                ارفع كفاءة فرق عملك ببرامج تدريبية{' '}
                <span className="text-teal-600">مخصصة ومقاسة الأثر</span>
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-slate-600">
                نصمم وننفذ حقائب تدريبية احترافية في التقنية، البيانات، القيادة، الأمن السيبراني،
                والموارد البشرية مع تقارير حضور وتقييم قبلي وبعدي وشهادات معتمدة.
              </p>

              <div className="grid gap-4 pt-3 sm:grid-cols-2">
                {[
                  { icon: Building2, title: 'برامج مخصصة لهوية وقطاع منشأتك' },
                  { icon: Users, title: 'تدريب حضوري، أونلاين مباشر، أو هجين' },
                  { icon: BarChart3, title: 'لوحة تقارير حضور وقياس أثر التدريب' },
                  { icon: Award, title: 'شهادات موثقة برمز QR جاهزة لـ NCEL' },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quote Request Form */}
            <div className="lg:col-span-5">
              <div className="glass-card rounded-[2rem] p-6 shadow-soft-lg sm:p-8">
                <h2 className="font-heading text-xl font-black text-slate-900">
                  اطلب عرض سعر مخصص لشركتك
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  يتواصل معك مستشار التدريب المؤسسي خلال 24 ساعة عمل.
                </p>

                {refCode ? (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                    <h3 className="mt-3 font-heading text-lg font-extrabold text-emerald-900">
                      تم استلام طلب عرض السعر بنجاح
                    </h3>
                    <p className="mt-1 text-xs text-emerald-700">
                      الرقم المرجعي لطلبك: <strong dir="ltr">{refCode}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => setRefCode(null)}
                      className="btn-outline mt-4 text-xs"
                    >
                      إرسال طلب آخر
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">اسم الجهة / الشركة</label>
                      <input
                        required
                        className="input-field"
                        placeholder="مثال: شركة آفاق التقنية"
                        value={form.companyName}
                        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">اسم مسؤول التواصل</label>
                        <input
                          required
                          className="input-field"
                          placeholder="الاسم الكامل"
                          value={form.contactName}
                          onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                        />
                      </div>
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
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">البريد الرسمي للعمل</label>
                      <input
                        required
                        type="email"
                        dir="ltr"
                        className="input-field text-right"
                        placeholder="name@company.sa"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">عدد المتدربين</label>
                        <select
                          className="input-field"
                          value={form.employeesCount}
                          onChange={(e) => setForm({ ...form, employeesCount: e.target.value })}
                        >
                          <option>10 - 25 موظف</option>
                          <option>25 - 50 موظف</option>
                          <option>50 - 150 موظف</option>
                          <option>أكثر من 150 موظف</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">المسار التدريبي</label>
                        <select
                          className="input-field"
                          value={form.track}
                          onChange={(e) => setForm({ ...form, track: e.target.value })}
                        >
                          <option>إدارة المشاريع والقيادة</option>
                          <option>تحليل البيانات والذكاء الاصطناعي</option>
                          <option>الأمن السيبراني</option>
                          <option>الموارد البشرية ونظام العمل</option>
                          <option>المالية والمحاسبة</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">تفاصيل إضافية</label>
                      <textarea
                        rows={3}
                        className="input-field"
                        placeholder="اذكر الأهداف أو التواريخ المقترحة..."
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      />
                    </div>
                    <button type="submit" disabled={submitting} className="btn-primary w-full py-3.5">
                      <Send className="h-4 w-4" />
                      {submitting ? 'جاري الإرسال...' : 'إرسال طلب عرض السعر'}
                    </button>
                    <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                      <ShieldCheck className="h-4 w-4 text-teal-600" />
                      بيانات شركتك محفوظة بسرية تامة
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
