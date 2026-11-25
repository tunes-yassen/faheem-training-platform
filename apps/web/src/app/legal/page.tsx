import React from 'react';
import { ShieldCheck, FileText, RefreshCw } from 'lucide-react';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-porcelain pb-20">
      <section className="border-b border-slate-200/70 bg-hero-gradient bg-mesh-luminous py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <span className="badge-teal mb-3">الحوكمة والشفافية</span>
          <h1 className="font-heading text-3xl font-black text-slate-900 sm:text-4xl">
            الشروط والأحكام، الخصوصية، وسياسة الاسترداد
          </h1>
          <p className="mt-2 text-sm text-slate-600">آخر تحديث: الإصدار 2.1 — نوفمبر 2026</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-6 px-4 pt-10 sm:px-6">
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-teal-600" />
            <h2 className="font-heading text-xl font-black text-slate-900">1. شروط الاستخدام</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            باستخدامك لمنصة فهيم للتدريب، فإنك توافق على الالتزام بضوابط الحضور والسلوك الأكاديمي
            الاحترافي. يُحظر مشاركة روابط القاعات الافتراضية أو المواد التدريبية المسجلة خارج نطاق
            المسجلين المعتمدين، وتخضع جميع الشهادات الصادرة لنظام التحقق الرقمي.
          </p>
        </div>

        <div id="privacy" className="glass-card rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-azure-600" />
            <h2 className="font-heading text-xl font-black text-slate-900">2. سياسة الخصوصية وحماية البيانات</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            تلتزم منصة فهيم بحماية بيانات المستخدمين وفق نظام حماية البيانات الشخصية في المملكة.
            يتم تشفير البيانات الحساسة، ولا تُعرض في صفحة التحقق من الشهادات سوى المعلومات الأساسية
            غير الحساسة لإثبات صحة الشهادة. كما يخضع ربط حسابات الأبناء بموافقة موثقة من ولي الأمر.
          </p>
        </div>

        <div id="refund" className="glass-card rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 text-amber-600" />
            <h2 className="font-heading text-xl font-black text-slate-900">3. سياسة الإلغاء والاسترداد</h2>
          </div>
          <ul className="mt-3 list-disc space-y-2 pr-5 text-sm leading-relaxed text-slate-600">
            <li>
              <strong>دروس التقوية:</strong> إلغاء مجاني مع استرداد فوري 100% إلى محفظة الساعات عند
              الإلغاء قبل 12 ساعة على الأقل من موعد الحصة.
            </li>
            <li>
              <strong>الدورات المهنية الحضورية والأونلاين المباشرة:</strong> استرداد كامل قبل بدء
              الدفعة بـ 72 ساعة، أو تحويل المقعد لدفعة لاحقة.
            </li>
            <li>
              <strong>حوكمة الاسترداد المالي:</strong> تخضع طلبات الاسترداد النقدي لآلية اعتماد ثنائية
              (Maker-Checker) لضمان الدقة والأمان المالي.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
