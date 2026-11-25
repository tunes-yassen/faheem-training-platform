'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQS } from '@/lib/demo-data';

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-porcelain pb-20">
      <section className="border-b border-slate-200/70 bg-hero-gradient bg-mesh-luminous py-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-azure-50 text-azure-600">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-3xl font-black text-slate-900 sm:text-4xl">
            الأسئلة الشائعة
          </h1>
          <p className="mt-2 text-slate-600">
            كل ما تحتاج معرفته حول الدورات المهنية، دروس التقوية، المحفظة، والشهادات المعتمدة.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <div key={item.q} className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-4 text-right font-heading text-sm font-extrabold text-slate-900 sm:text-base"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`h-5 w-5 text-teal-600 transition-transform ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              {open === i && (
                <div className="border-t border-slate-100 px-6 py-4 text-sm leading-relaxed text-slate-600">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-teal-200 bg-teal-50/70 p-6 text-center">
          <p className="font-heading text-base font-extrabold text-teal-900">
            لم تجد إجابة لسؤالك؟
          </p>
          <p className="mt-1 text-xs text-teal-700">تواصل مباشرة مع فريق الدعم وسنساعدك فوراً.</p>
          <Link href="/contact" className="btn-primary mt-4 py-2.5 text-xs">
            تواصل مع الدعم
          </Link>
        </div>
      </section>
    </div>
  );
}
