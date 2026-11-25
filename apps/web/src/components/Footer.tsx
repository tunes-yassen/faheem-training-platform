import React from 'react';
import Link from 'next/link';
import { GraduationCap, Mail, Phone, MapPin, ShieldCheck, Award } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200/80 bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-teal-500 via-azure-500 to-sunlit-500" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-azure-500 text-white shadow-teal-glow">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-extrabold text-slate-900">
                  منصة فهيم للتدريب
                </h3>
                <p className="text-xs text-slate-500">تعليم مهني وتقوية أكاديمية موثوقة</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              نجمع بين التدريب المهني المعتمد ودروس التقوية الفردية الذكية في بيئة رقمية آمنة
              ومشرقة تدعم الطلاب، أولياء الأمور، المعلمين، والشركات في المملكة.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="badge-teal">
                <ShieldCheck className="h-3.5 w-3.5" />
                جاهزية NCEL
              </span>
              <span className="badge-amber">
                <Award className="h-3.5 w-3.5" />
                شهادات QR موثقة
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-heading text-sm font-extrabold text-slate-900">
              استكشف المنصة
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li><Link href="/courses" className="hover:text-teal-600 transition-colors">الدورات المهنية المعتمدة</Link></li>
              <li><Link href="/tutoring" className="hover:text-teal-600 transition-colors">دروس التقوية والمعلمون</Link></li>
              <li><Link href="/corporate" className="hover:text-teal-600 transition-colors">برامج تدريب الشركات B2B</Link></li>
              <li><Link href="/join" className="hover:text-teal-600 transition-colors">انضم كمعلم أو مدرب</Link></li>
              <li><Link href="/verify" className="hover:text-teal-600 transition-colors">التحقق من الشهادات</Link></li>
            </ul>
          </div>

          {/* Portals & Support */}
          <div>
            <h4 className="mb-4 font-heading text-sm font-extrabold text-slate-900">
              البوابات والدعم
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li><Link href="/portal/student" className="hover:text-teal-600 transition-colors">بوابة الطالب</Link></li>
              <li><Link href="/portal/parent" className="hover:text-teal-600 transition-colors">بوابة ولي الأمر</Link></li>
              <li><Link href="/portal/tutor" className="hover:text-teal-600 transition-colors">بوابة المعلم والمدرب</Link></li>
              <li><Link href="/about" className="hover:text-teal-600 transition-colors">عن منصة فهيم</Link></li>
              <li><Link href="/faq" className="hover:text-teal-600 transition-colors">الأسئلة الشائعة</Link></li>
              <li><Link href="/legal" className="hover:text-teal-600 transition-colors">السياسات والخصوصية</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 font-heading text-sm font-extrabold text-slate-900">
              تواصل معنا
            </h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Phone className="h-4 w-4" />
                </span>
                <span dir="ltr">9200 18450</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-azure-50 text-azure-600">
                  <Mail className="h-4 w-4" />
                </span>
                <span>support@faheem.sa</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sunlit-50 text-amber-600">
                  <MapPin className="h-4 w-4" />
                </span>
                <span>الرياض — طريق الملك فهد، المملكة العربية السعودية</span>
              </li>
            </ul>
            <Link href="/contact" className="btn-outline mt-5 w-full py-2.5 text-xs">
              افتح تذكرة دعم أو تواصل معنا
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} منصة فهيم للتدريب. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4">
            <Link href="/legal" className="hover:text-teal-600">الشروط والأحكام</Link>
            <Link href="/legal#privacy" className="hover:text-teal-600">سياسة الخصوصية</Link>
            <Link href="/legal#refund" className="hover:text-teal-600">سياسة الإلغاء والاسترداد</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
