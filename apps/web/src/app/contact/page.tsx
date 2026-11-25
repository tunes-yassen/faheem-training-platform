'use client';

import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-porcelain pb-20">
      <section className="border-b border-slate-200/70 bg-hero-gradient bg-mesh-luminous py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <span className="badge-azure mb-3">مركز التواصل والدعم</span>
          <h1 className="font-heading text-3xl font-black text-slate-900 sm:text-4xl">
            نسعد بخدمتك والإجابة على استفساراتك
          </h1>
          <p className="mt-3 text-slate-600">
            فريق الدعم والمنسقين الأكاديميين متاح لمساعدتك يومياً من 9 صباحاً حتى 10 مساءً.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            {[
              { icon: Phone, label: 'الرقم الموحد', val: '9200 18450', color: 'bg-teal-50 text-teal-600' },
              { icon: Mail, label: 'البريد الإلكتروني', val: 'support@faheem.sa', color: 'bg-azure-50 text-azure-600' },
              { icon: MapPin, label: 'المقر الرئيسي', val: 'طريق الملك فهد، الرياض، المملكة العربية السعودية', color: 'bg-sunlit-50 text-amber-600' },
              { icon: Clock, label: 'ساعات العمل', val: 'السبت - الخميس | 9:00 ص - 10:00 م', color: 'bg-emerald-50 text-emerald-600' },
            ].map((item) => (
              <div key={item.label} className="glass-card flex items-center gap-4 rounded-2xl p-5">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">{item.label}</p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-900">{item.val}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-7">
            <div className="glass-card rounded-3xl p-6 shadow-soft-lg sm:p-8">
              <h2 className="font-heading text-xl font-black text-slate-900">أرسل لنا رسالة</h2>
              {sent ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                  <p className="mt-2 font-heading text-lg font-extrabold text-emerald-900">
                    تم استلام رسالتك بنجاح!
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    سيرد عليك فريق الدعم عبر البريد أو الجوال خلال وقت قصير.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSent(true);
                  }}
                  className="mt-5 space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">الاسم الكامل</label>
                      <input required className="input-field" placeholder="اسمك الكامل" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-700">رقم الجوال</label>
                      <input required dir="ltr" className="input-field text-right" placeholder="+9665XXXXXXXX" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">البريد الإلكتروني</label>
                    <input required type="email" dir="ltr" className="input-field text-right" placeholder="you@email.com" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">موضوع الرسالة</label>
                    <select className="input-field">
                      <option>استفسار عن الدورات المهنية</option>
                      <option>مساعدة في حجز دروس التقوية</option>
                      <option>الشهادات والتحقق</option>
                      <option>المدفوعات والمحفظة</option>
                      <option>شراكات وتدريب شركات</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">نص الرسالة</label>
                    <textarea required rows={4} className="input-field" placeholder="كيف يمكننا مساعدتك اليوم؟" />
                  </div>
                  <button type="submit" className="btn-primary w-full py-3.5">
                    <Send className="h-4 w-4" />
                    إرسال الرسالة
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
