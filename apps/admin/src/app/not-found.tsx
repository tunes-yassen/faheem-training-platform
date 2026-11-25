import Link from 'next/link';
import { Home, SearchX } from 'lucide-react';

export default function AdminNotFoundPage() {
  return (
    <div className="flex min-h-[65vh] items-center justify-center p-6">
      <div className="surface-card max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
          <SearchX className="h-7 w-7" />
        </div>
        <h1 className="font-display text-xl font-extrabold text-slate-900">
          الصفحة المطلوبة غير موجودة
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          يمكنك العودة إلى لوحة القيادة التنفيذية أو اختيار الوحدة المطلوبة من القائمة الجانبية.
        </p>
        <Link href="/" className="btn-primary mt-5 inline-flex w-full">
          <Home className="h-4 w-4" /> العودة للوحة القيادة
        </Link>
      </div>
    </div>
  );
}
